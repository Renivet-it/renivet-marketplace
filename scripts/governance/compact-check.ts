/**
 * Compact V2 governance helper for $renivet-spec and $renivet-review.
 *
 * Read-only and deterministic. The only file it ever writes is LAUNCH.md
 * (the `launch` command). It never changes the contract, SPEC.md, REVIEW.md,
 * the validator, Linear or the repository. It is advisory: the validator
 * remains the gate.
 *
 * Commands
 *   risk      compute path_rule_risk from risk-rules.yaml (paths, surface or diff)
 *   budget    lint the recorded investigation scope against the level budget
 *   launch    generate LAUNCH.md from work-item.yaml and SPEC.md
 *   precheck  deterministic REVIEW facts from the real diff
 */
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { parse } from "yaml";

export const LEVELS = ["L0", "L1", "L2", "L3"] as const;
export type Level = (typeof LEVELS)[number];
export type CheckStatus = "PASS" | "FLAG" | "CANNOT_ESTABLISH";

type UnknownRecord = Record<string, unknown>;

export interface Rule {
    id: string;
    glob: string;
    domain: string;
    min_level: Level;
    reason: string;
    source: string;
}

export interface RuleSet {
    version: number;
    default_level: Level;
    non_behavioural: string[];
    budgets: Record<string, { files: number; hops: number }>;
    mandatory_trace_domains: string[];
    critic_focus: Record<string, string[]>;
    rules: Rule[];
}

export interface RuleHit {
    path: string;
    rule_id: string;
    domain: string;
    min_level: Level;
    reason: string;
}

export interface RiskResult {
    path_rule_risk: Level;
    paths_checked: number;
    hits: RuleHit[];
    unmatched_paths: string[];
    domains: string[];
    critic_focus: string[];
}

export interface Check {
    id: string;
    status: CheckStatus;
    detail: string;
    items?: string[];
}

export const DEFAULT_RULES_PATH = join(import.meta.dir, "risk-rules.yaml");
export const DEPTH_TOKENS = ["L1_LIGHT", "L2_TARGETED", "L3_DEEP"] as const;

const isRecord = (value: unknown): value is UnknownRecord =>
    typeof value === "object" && value !== null && !Array.isArray(value);

const levelIndex = (level: string) => LEVELS.indexOf(level as Level);
const maxLevel = (a: Level, b: Level): Level =>
    levelIndex(a) >= levelIndex(b) ? a : b;

function asLevel(value: unknown): Level | null {
    return typeof value === "string" && levelIndex(value) >= 0
        ? (value as Level)
        : null;
}

// ---------------------------------------------------------------------------
// Rules and glob matching
// ---------------------------------------------------------------------------

export function loadRules(path = DEFAULT_RULES_PATH): RuleSet {
    const raw = parse(readFileSync(path, "utf8")) as unknown;
    if (!isRecord(raw)) throw new Error(`Rule file is not a mapping: ${path}`);
    const rules = raw.rules;
    if (!Array.isArray(rules) || rules.length === 0)
        throw new Error("Rule file has no rules");
    const ids = new Set<string>();
    for (const rule of rules as UnknownRecord[]) {
        for (const key of ["id", "glob", "domain", "min_level", "reason"]) {
            if (typeof rule[key] !== "string")
                throw new Error(`Rule missing ${key}: ${JSON.stringify(rule)}`);
        }
        if (!asLevel(rule.min_level))
            throw new Error(`Rule ${String(rule.id)} has invalid min_level`);
        if (ids.has(rule.id as string))
            throw new Error(`Duplicate rule id ${String(rule.id)}`);
        ids.add(rule.id as string);
    }
    const defaultLevel = asLevel(raw.default_level);
    if (!defaultLevel) throw new Error("Rule file has invalid default_level");
    return {
        version: Number(raw.version ?? 1),
        default_level: defaultLevel,
        non_behavioural: (raw.non_behavioural as string[]) ?? [],
        budgets: (raw.budgets as RuleSet["budgets"]) ?? {},
        mandatory_trace_domains:
            (raw.mandatory_trace_domains as string[]) ?? [],
        critic_focus: (raw.critic_focus as RuleSet["critic_focus"]) ?? {},
        rules: rules as unknown as Rule[],
    };
}

const REGEX_SPECIAL = /[.+^$()|[\]\\]/g;

/** Supports `*`, `**`, `?` and `{a,b}` alternation. */
export function globToRegExp(glob: string): RegExp {
    let out = "";
    let braceDepth = 0;
    for (let i = 0; i < glob.length; i++) {
        const c = glob[i];
        if (c === "*") {
            if (glob[i + 1] === "*") {
                if (glob[i + 2] === "/") {
                    out += "(?:.*/)?";
                    i += 2;
                } else {
                    out += ".*";
                    i += 1;
                }
            } else out += "[^/]*";
        } else if (c === "?") out += "[^/]";
        else if (c === "{") {
            out += "(?:";
            braceDepth++;
        } else if (c === "}" && braceDepth > 0) {
            out += ")";
            braceDepth--;
        } else if (c === "," && braceDepth > 0) out += "|";
        else out += c.replace(REGEX_SPECIAL, "\\$&");
    }
    return new RegExp(`^${out}$`);
}

const hasGlobChars = (value: string) => /[*?{]/.test(value);
const normalisePath = (value: string) =>
    value.replace(/\\/g, "/").replace(/^\.\//, "").replace(/^\//, "");

export function classifyPaths(
    inputPaths: string[],
    ruleSet: RuleSet
): RiskResult {
    const paths = [...new Set(inputPaths.map(normalisePath))].filter(Boolean);
    const nonBehavioural = ruleSet.non_behavioural.map(globToRegExp);
    const compiled = ruleSet.rules.map((rule) => ({
        rule,
        regex: globToRegExp(rule.glob),
    }));
    const hits: RuleHit[] = [];
    const unmatched: string[] = [];
    let risk: Level = "L0";
    for (const path of paths) {
        if (nonBehavioural.some((re) => re.test(path))) continue;
        const matched = compiled.filter(({ regex }) => regex.test(path));
        if (matched.length === 0) {
            unmatched.push(path);
            risk = maxLevel(risk, ruleSet.default_level);
            continue;
        }
        for (const { rule } of matched) {
            hits.push({
                path,
                rule_id: rule.id,
                domain: rule.domain,
                min_level: rule.min_level,
                reason: rule.reason,
            });
            risk = maxLevel(risk, rule.min_level);
        }
    }
    const domains = [...new Set(hits.map((hit) => hit.domain))].sort();
    return {
        path_rule_risk: risk,
        paths_checked: paths.length,
        hits,
        unmatched_paths: unmatched,
        domains,
        critic_focus: criticFocusFor(domains, ruleSet),
    };
}

/** Union of focus categories for the domains hit; at least two categories. */
export function criticFocusFor(domains: string[], ruleSet: RuleSet): string[] {
    const focus = new Set<string>();
    for (const domain of domains)
        for (const category of ruleSet.critic_focus[domain] ?? [])
            focus.add(category);
    for (const category of ruleSet.critic_focus.default ?? [])
        if (focus.size < 2) focus.add(category);
    return [...focus];
}

// ---------------------------------------------------------------------------
// Git and file helpers
// ---------------------------------------------------------------------------

export function git(args: string[], cwd: string, allowFail = false): string {
    const result = Bun.spawnSync(["git", ...args], { cwd });
    if (result.exitCode !== 0) {
        if (allowFail) return "";
        throw new Error(
            `git ${args.join(" ")} failed: ${result.stderr.toString().trim()}`
        );
    }
    return result.stdout.toString();
}

const lines = (text: string) =>
    text
        .split(/\r?\n/)
        .map((line) => line.trim())
        .filter(Boolean);

function trackedFiles(cwd: string): string[] {
    return lines(git(["ls-files"], cwd));
}

export function expandSurface(entries: string[], files: string[]): string[] {
    const out = new Set<string>();
    for (const entry of entries.map(normalisePath)) {
        if (!hasGlobChars(entry)) {
            out.add(entry);
            continue;
        }
        const regex = globToRegExp(entry);
        for (const file of files) if (regex.test(file)) out.add(file);
    }
    return [...out];
}

function readYamlFile(path: string): UnknownRecord {
    const parsed = parse(readFileSync(path, "utf8")) as unknown;
    if (!isRecord(parsed)) throw new Error(`Not a mapping: ${path}`);
    return parsed;
}

function pathOf(record: UnknownRecord, ...keys: string[]): unknown {
    let current: unknown = record;
    for (const key of keys) {
        if (!isRecord(current)) return undefined;
        current = current[key];
    }
    return current;
}

// ---------------------------------------------------------------------------
// SPEC.md sections
// ---------------------------------------------------------------------------

export const SPEC_HEADINGS = {
    understand: "what are we fixing",
    surface: "affected surface",
    plan: "implementation plan",
    acceptance: "acceptance criteria",
    rollback: "rollback",
    conditions: "conditions",
} as const;

const normaliseHeading = (value: string) =>
    value
        .toLowerCase()
        .replace(/[?:.]+$/g, "")
        .replace(/\s+/g, " ")
        .trim();

export function parseSections(markdown: string): Map<string, string> {
    const sections = new Map<string, string>();
    const source = markdown.split(/\r?\n/);
    let currentKey: string | null = null;
    let currentLevel = 0;
    let buffer: string[] = [];
    const flush = () => {
        if (currentKey !== null && !sections.has(currentKey))
            sections.set(currentKey, buffer.join("\n").trim());
    };
    for (const line of source) {
        const match = /^(#{1,6})\s+(.+?)\s*#*\s*$/.exec(line);
        if (match && match[1].length >= 2) {
            const level = match[1].length;
            if (currentKey !== null && level > currentLevel) {
                buffer.push(line);
                continue;
            }
            flush();
            currentKey = normaliseHeading(match[2]);
            currentLevel = level;
            buffer = [];
        } else if (match && match[1].length === 1) {
            flush();
            currentKey = null;
            buffer = [];
        } else if (currentKey !== null) buffer.push(line);
    }
    flush();
    return sections;
}

function listEntries(body: string | undefined): string[] {
    if (!body) return [];
    const entries: string[] = [];
    for (const raw of body.split(/\r?\n/)) {
        const line = raw
            .replace(/^\s*(?:[-*+]|\d+[.)])\s+/, "")
            .replace(/`/g, "")
            .trim();
        if (!line || line.startsWith("#")) continue;
        entries.push(line);
    }
    return entries;
}

export function surfaceGlobs(body: string | undefined): string[] {
    return listEntries(body)
        .map((entry) => entry.split(/\s+/)[0])
        .filter((token) => /[\\/.]/.test(token) || hasGlobChars(token));
}

// ---------------------------------------------------------------------------
// Command: risk
// ---------------------------------------------------------------------------

export interface VerifyResult {
    verified: boolean;
    recorded_path_rule_risk: string | null;
    recorded_final_risk: string | null;
    computed_path_rule_risk: Level;
    problems: string[];
}

export function verifyContractRisk(
    contract: UnknownRecord,
    computed: RiskResult
): VerifyResult {
    const recorded = asLevel(pathOf(contract, "risk", "path_rule_risk"));
    const final = asLevel(pathOf(contract, "risk", "final_risk"));
    const problems: string[] = [];
    if (!recorded)
        problems.push("risk.path_rule_risk is missing or not a level");
    else if (levelIndex(recorded) < levelIndex(computed.path_rule_risk))
        problems.push(
            `risk.path_rule_risk ${recorded} is below the computed ${computed.path_rule_risk} (the AI may raise risk, never lower it)`
        );
    if (!final) problems.push("risk.final_risk is missing or not a level");
    else if (levelIndex(final) < levelIndex(computed.path_rule_risk))
        problems.push(
            `risk.final_risk ${final} is below the computed path rule ${computed.path_rule_risk}`
        );
    return {
        verified: problems.length === 0,
        recorded_path_rule_risk: recorded,
        recorded_final_risk: final,
        computed_path_rule_risk: computed.path_rule_risk,
        problems,
    };
}

// ---------------------------------------------------------------------------
// Command: budget
// ---------------------------------------------------------------------------

export interface BudgetResult {
    level: Level | null;
    depth: string | null;
    depth_token_ok: boolean;
    recorded_files: number;
    file_budget: number | null;
    hop_budget: number | null;
    budget_exception: string | null;
    status: CheckStatus;
    notes: string[];
    mandatory_domain_traces: Check[];
}

export function budgetLint(
    contract: UnknownRecord,
    ruleSet: RuleSet,
    surfacePaths: string[]
): BudgetResult {
    const level = asLevel(pathOf(contract, "risk", "final_risk"));
    const investigation = pathOf(contract, "investigation");
    const depth =
        isRecord(investigation) && typeof investigation.depth === "string"
            ? investigation.depth
            : null;
    const areas =
        isRecord(investigation) &&
        Array.isArray(investigation.investigated_areas)
            ? investigation.investigated_areas
            : [];
    const exception =
        isRecord(investigation) &&
        typeof investigation.budget_exception === "string" &&
        investigation.budget_exception.trim()
            ? investigation.budget_exception.trim()
            : null;
    const notes: string[] = [
        "Bounded guidance and a lint of the scope recorded in the contract; it does not count live session reads.",
        "Hops are not recorded in the contract and are not linted.",
    ];
    const budget = level ? ruleSet.budgets[level] : undefined;
    const depthOk =
        depth !== null && (DEPTH_TOKENS as readonly string[]).includes(depth);
    if (depth !== null && !depthOk)
        notes.push(
            `investigation.depth "${depth}" is not one of ${DEPTH_TOKENS.join(", ")} (legacy spelling; not an error).`
        );
    if (depth === null) notes.push("investigation.depth is not recorded.");
    if (depthOk && level && level !== "L0") {
        const expected = `${level}_${level === "L1" ? "LIGHT" : level === "L2" ? "TARGETED" : "DEEP"}`;
        if (depth !== expected)
            notes.push(
                `depth ${depth} does not match final risk ${level} (expected ${expected}).`
            );
    }
    let status: CheckStatus = "PASS";
    if (!budget) {
        status = "CANNOT_ESTABLISH";
        notes.push(
            level
                ? `No budget is defined for level ${level}.`
                : "risk.final_risk is missing; no budget applies."
        );
    } else if (areas.length > budget.files && !exception) {
        status = "FLAG";
        notes.push(
            `${areas.length} recorded areas exceed the ${level} budget of ${budget.files} and no investigation.budget_exception is recorded.`
        );
    } else if (areas.length > budget.files) {
        notes.push(`Budget exceeded with a recorded exception: ${exception}`);
    }
    const traces: Check[] = [];
    if (level === "L3") {
        const surfaceRisk = classifyPaths(surfacePaths, ruleSet);
        const investigated = classifyPaths(
            areas.filter((v): v is string => typeof v === "string"),
            ruleSet
        );
        for (const domain of surfaceRisk.domains) {
            if (!ruleSet.mandatory_trace_domains.includes(domain)) continue;
            const traced = investigated.domains.includes(domain);
            traces.push({
                id: `trace:${domain}`,
                status: traced ? "PASS" : "FLAG",
                detail: traced
                    ? `An investigated area falls in the ${domain} domain.`
                    : `The declared surface hits ${domain}, but no recorded investigated area falls in that domain.`,
            });
        }
        if (surfacePaths.length === 0)
            traces.push({
                id: "trace:surface",
                status: "CANNOT_ESTABLISH",
                detail: "No Affected surface paths were available; mandatory domain traces cannot be established.",
            });
    }
    return {
        level,
        depth,
        depth_token_ok: depthOk,
        recorded_files: areas.length,
        file_budget: budget?.files ?? null,
        hop_budget: budget?.hops ?? null,
        budget_exception: exception,
        status,
        notes,
        mandatory_domain_traces: traces,
    };
}

// ---------------------------------------------------------------------------
// Command: launch
// ---------------------------------------------------------------------------

const WORD_TARGET: Record<string, number> = { L1: 250, L2: 450, L3: 700 };
const MAX_SECTION_WORDS = 90;
const wordCount = (text: string) => text.split(/\s+/).filter(Boolean).length;

function clip(text: string, maxWords = MAX_SECTION_WORDS): string {
    const words = text.replace(/\s+/g, " ").trim().split(" ").filter(Boolean);
    if (words.length <= maxWords) return words.join(" ");
    return `${words.slice(0, maxWords).join(" ")} … (full text in SPEC.md)`;
}

function sectionOrMissing(
    sections: Map<string, string>,
    key: string,
    heading: string,
    required: boolean
): string {
    const body = sections.get(key);
    if (body && body.trim()) return clip(body);
    return required
        ? `SECTION MISSING: "${heading}" (not found in SPEC.md)`
        : `(no "${heading}" section in SPEC.md)`;
}

export function renderLaunch(
    contract: UnknownRecord,
    specText: string | null
): string {
    const sections =
        specText === null ? new Map<string, string>() : parseSections(specText);
    const id = String(pathOf(contract, "task", "id") ?? "UNKNOWN");
    const title = String(pathOf(contract, "task", "title") ?? "UNKNOWN");
    const status = String(pathOf(contract, "task", "status") ?? "UNKNOWN");
    const risk = (pathOf(contract, "risk") as UnknownRecord | undefined) ?? {};
    const level = asLevel(risk.final_risk);
    const l2plus = level === "L2" || level === "L3";
    const out: string[] = [];
    const push = (text = "") => out.push(text);

    push(`# LAUNCH: ${id} — ${title}`);
    push();
    push(
        `> GENERATED from work-item.yaml and SPEC.md. Do not edit. If this page disagrees with the contract, the contract wins. Nothing here is invented; a missing item is shown as MISSING.`
    );
    push();
    push(
        `Readiness: ${status}    Risk: ${level ?? "UNKNOWN"}    Approval: ${String(pathOf(contract, "approval", "state") ?? "UNKNOWN")}`
    );
    push();
    if (specText === null)
        push("SECTION MISSING: SPEC.md was not found beside work-item.yaml.");

    push("## UNDERSTAND");
    push();
    push(
        `What are we fixing? ${sectionOrMissing(sections, SPEC_HEADINGS.understand, "What are we fixing?", true)}`
    );
    push();
    push(
        `Risk: initial ${String(risk.initial_risk ?? "?")}, path rule ${String(risk.path_rule_risk ?? "?")}, semantic ${String(risk.semantic_risk ?? "?")}, final ${String(risk.final_risk ?? "?")}.`
    );
    const reasons = Array.isArray(risk.reasons)
        ? (risk.reasons as unknown[])
        : [];
    if (reasons.length)
        push(`Reasons: ${clip(reasons.map(String).join("; "), 60)}`);
    const decisions = (
        Array.isArray(contract.decisions) ? contract.decisions : []
    ) as UnknownRecord[];
    const open = decisions
        .filter((d) => d.status !== "resolved")
        .sort((a, b) =>
            a.human_confirmation_required === b.human_confirmation_required
                ? 0
                : a.human_confirmation_required
                  ? -1
                  : 1
        );
    push();
    if (open.length === 0) push("Open decisions: none recorded as open.");
    else {
        push(`Open decisions (${open.length}):`);
        for (const d of open.slice(0, 5))
            push(
                `- ${String(d.id)} [${String(d.class ?? "?")}${d.human_confirmation_required ? ", human confirmation required" : ""}] ${clip(String(d.question ?? ""), 30)}`
            );
        if (open.length > 5)
            push(`- +${open.length - 5} more in work-item.yaml`);
    }

    push();
    push("## BUILD");
    push();
    const specSurface = surfaceGlobs(sections.get(SPEC_HEADINGS.surface));
    if (specSurface.length === 0)
        push(
            `Affected surface: SECTION MISSING: "Affected surface" (no paths found in SPEC.md)`
        );
    else {
        push("Affected surface:");
        for (const entry of specSurface.slice(0, 8)) push(`- ${entry}`);
        if (specSurface.length > 8)
            push(`- +${specSurface.length - 8} more in SPEC.md`);
    }
    const deps = (
        Array.isArray(contract.dependencies) ? contract.dependencies : []
    ) as UnknownRecord[];
    push();
    if (deps.length === 0) push("Dependencies: none recorded.");
    else {
        push("Dependencies:");
        for (const d of deps.slice(0, 6))
            push(
                `- ${String(d.id)} (${String(d.status ?? "?")}) ${clip(String(d.description ?? ""), 18)}`
            );
        if (deps.length > 6)
            push(`- +${deps.length - 6} more in work-item.yaml`);
    }
    push();
    push(
        `Implementation plan: ${sectionOrMissing(sections, SPEC_HEADINGS.plan, "Implementation plan", true)}`
    );
    push();
    push(
        `Rollback: ${sectionOrMissing(sections, SPEC_HEADINGS.rollback, "Rollback", l2plus)}`
    );
    const blockers = pathOf(contract, "approval", "design_blockers");
    push();
    push(
        `Known design blockers: ${Array.isArray(blockers) && blockers.length ? blockers.map(String).join("; ") : "none recorded"}`
    );

    push();
    push("## VERIFY");
    push();
    push(
        `Acceptance criteria: ${sectionOrMissing(sections, SPEC_HEADINGS.acceptance, "Acceptance criteria", true)}`
    );
    const texp = (
        Array.isArray(contract.test_expectations)
            ? contract.test_expectations
            : []
    ) as UnknownRecord[];
    push();
    if (texp.length === 0) push("Test expectations: none recorded.");
    else {
        push("Test expectations:");
        for (const t of texp.slice(0, 8))
            push(
                `- ${String(t.id)} ${String(t.category)} ${String(t.classification)}: ${clip(String(t.reason ?? ""), 18)}`
            );
        if (texp.length > 8)
            push(`- +${texp.length - 8} more in work-item.yaml`);
    }

    push();
    push("## PROVE");
    push();
    const required = texp.filter((t) => t.classification === "REQUIRED");
    if (required.length === 0)
        push("Evidence required: no REQUIRED test expectation recorded.");
    else {
        push("Evidence required (attach for each REQUIRED expectation):");
        for (const t of required.slice(0, 8))
            push(
                `- ${String(t.id)}: result of the ${String(t.category)} verification`
            );
        if (required.length > 8)
            push(`- +${required.length - 8} more in work-item.yaml`);
    }
    const conditions = listEntries(sections.get(SPEC_HEADINGS.conditions));
    push();
    if (conditions.length === 0)
        push(`Conditions: none declared (no "Conditions" entries in SPEC.md).`);
    else {
        push("Conditions:");
        for (const c of conditions.slice(0, 6)) push(`- ${clip(c, 30)}`);
    }
    push();
    push(
        "REVIEW will check: changed paths against the Affected surface, risk recomputed from the real diff, migration/auth/provider touches, base and head commits, a clean working tree, REQUIRED evidence, and the conditions above."
    );

    const body = out.join("\n");
    const target = level ? WORD_TARGET[level] : undefined;
    const words = wordCount(body);
    const footer = target
        ? `\n\nWords: ${words} (target about ${target}${words > target ? ", over target" : ""}).\n`
        : `\n\nWords: ${words}.\n`;
    return `${body}${footer}`;
}

// ---------------------------------------------------------------------------
// Command: precheck
// ---------------------------------------------------------------------------

export interface PrecheckInput {
    repo: string;
    id: string;
    workItemDir?: string;
    base?: string;
    head?: string;
    rulesPath?: string;
}

export interface PrecheckResult {
    id: string;
    base: string | null;
    base_sha: string | null;
    head_sha: string | null;
    default_branch: string | null;
    computed_path_rule_risk: Level | null;
    contract_final_risk: string | null;
    review_depth: string;
    escalation: {
        required: boolean;
        action: string | null;
    };
    changed_paths: string[];
    checks: Check[];
}

const TEST_FILE = /(^|\/)(tests?|__tests__)\/|\.(test|spec)\.[cm]?[jt]sx?$/;
const CODE_TEST_CATEGORIES = new Set([
    "unit",
    "component",
    "api",
    "integration",
    "e2e",
    "regression",
]);

function defaultBranch(repo: string): string | null {
    const head = git(
        ["symbolic-ref", "--short", "refs/remotes/origin/HEAD"],
        repo,
        true
    ).trim();
    if (head) return head;
    for (const candidate of ["origin/master", "origin/main", "master", "main"])
        if (
            git(
                ["rev-parse", "--verify", "--quiet", candidate],
                repo,
                true
            ).trim()
        )
            return candidate;
    return null;
}

export function precheck(input: PrecheckInput): PrecheckResult {
    const repo = resolve(input.repo);
    const ruleSet = loadRules(input.rulesPath);
    const dir = resolve(
        repo,
        input.workItemDir ?? join("docs", ".work-items", input.id)
    );
    const checks: Check[] = [];
    const add = (check: Check) => checks.push(check);

    const yamlPath = join(dir, "work-item.yaml");
    const specPath = join(dir, "SPEC.md");
    const reviewPath = join(dir, "REVIEW.md");
    const contract = existsSync(yamlPath) ? readYamlFile(yamlPath) : null;
    const spec = existsSync(specPath) ? readFileSync(specPath, "utf8") : null;
    const sections =
        spec === null ? new Map<string, string>() : parseSections(spec);

    // Base and head
    const defBranch = defaultBranch(repo);
    const headRef = input.head ?? "HEAD";
    const headSha =
        git(
            ["rev-parse", "--verify", "--quiet", `${headRef}^{commit}`],
            repo,
            true
        ).trim() || null;
    let baseRef = input.base ?? defBranch;
    let baseSha: string | null = null;
    if (baseRef && headSha) {
        baseSha =
            git(["merge-base", baseRef, headSha], repo, true).trim() ||
            git(
                ["rev-parse", "--verify", "--quiet", `${baseRef}^{commit}`],
                repo,
                true
            ).trim() ||
            null;
    } else baseRef = baseRef ?? null;
    const sha40 = (value: string | null) =>
        value !== null && /^[0-9a-f]{40}$/.test(value);
    if (!sha40(baseSha) || !sha40(headSha))
        add({
            id: "base-head",
            status: "CANNOT_ESTABLISH",
            detail: `Base or head could not be resolved to a 40-character SHA (base ${baseRef ?? "none"}, head ${headRef}).`,
        });
    else {
        const recordedBase = pathOf(
            contract ?? {},
            "implementation_review",
            "base_branch"
        );
        const bare = (ref: string) => ref.replace(/^origin\//, "");
        const problems: string[] = [];
        if (
            defBranch &&
            typeof recordedBase === "string" &&
            bare(recordedBase) !== bare(defBranch)
        )
            problems.push(
                `Recorded base_branch "${recordedBase}" differs from the repository default branch "${defBranch}".`
            );
        if (input.base && defBranch && bare(input.base) !== bare(defBranch))
            problems.push(
                `Comparison base "${input.base}" differs from the repository default branch "${defBranch}".`
            );
        add({
            id: "base-head",
            status: problems.length ? "FLAG" : "PASS",
            detail: problems.length
                ? problems.join(" ")
                : `base ${baseSha} (${baseRef}), head ${headSha}, default branch ${defBranch ?? "unknown"}.`,
        });
    }

    // Dirty tree
    const status = git(["status", "--porcelain"], repo, true);
    const dirty = lines(status);
    add({
        id: "dirty-tree",
        status: dirty.length ? "FLAG" : "PASS",
        detail: dirty.length
            ? `${dirty.length} uncommitted change(s); a completed review must record this state.`
            : "Working tree is clean.",
        items: dirty.slice(0, 10),
    });

    // Changed paths
    let changed: string[] = [];
    if (sha40(baseSha) && sha40(headSha)) {
        changed = lines(
            git(["diff", "--name-only", `${baseSha}...${headSha}`], repo, true)
        ).map(normalisePath);
    }
    const workItemPrefix =
        normalisePath(join("docs", ".work-items", input.id)) + "/";
    const relevant = changed.filter((p) => !p.startsWith(workItemPrefix));
    add({
        id: "changed-paths",
        status: sha40(baseSha) && sha40(headSha) ? "PASS" : "CANNOT_ESTABLISH",
        detail: `${changed.length} changed path(s) (${relevant.length} outside the work-item folder).`,
        items: relevant.slice(0, 30),
    });

    // Risk recomputation and escalation
    const risk = classifyPaths(relevant, ruleSet);
    const finalRisk = asLevel(pathOf(contract ?? {}, "risk", "final_risk"));
    let escalationRequired = false;
    if (!contract) {
        add({
            id: "risk-escalation",
            status: "CANNOT_ESTABLISH",
            detail: "work-item.yaml not found; no contract risk to compare.",
        });
    } else if (!finalRisk) {
        add({
            id: "risk-escalation",
            status: "CANNOT_ESTABLISH",
            detail: "risk.final_risk is missing or not a level.",
        });
    } else if (levelIndex(risk.path_rule_risk) > levelIndex(finalRisk)) {
        escalationRequired = true;
        add({
            id: "risk-escalation",
            status: "FLAG",
            detail: `The real diff computes path rule risk ${risk.path_rule_risk}, above the contract's final risk ${finalRisk}. Treat as material drift: governance_reentry_required true, result REVIEW_FAILED, task.status IN_REVIEW.`,
            items: risk.hits
                .slice(0, 10)
                .map(
                    (h) =>
                        `${h.path} -> ${h.domain} ${h.min_level} (${h.rule_id})`
                ),
        });
    } else {
        add({
            id: "risk-escalation",
            status: "PASS",
            detail: `Computed path rule risk ${risk.path_rule_risk} does not exceed the contract's final risk ${finalRisk}.`,
        });
    }

    // Migration, auth and provider touches
    const touch = (domains: string[]) =>
        risk.hits
            .filter((h) => domains.includes(h.domain))
            .map((h) => `${h.path} (${h.rule_id})`);
    for (const [id, domains] of [
        ["migration-touched", ["schema_migration"]],
        ["auth-touched", ["authn_authz", "tenant_isolation", "pii_identity"]],
        ["provider-touched", ["external_provider", "payment", "inventory"]],
    ] as const) {
        const items = touch([...domains]);
        add({
            id,
            status: items.length ? "FLAG" : "PASS",
            detail: items.length
                ? `${items.length} changed path(s) hit ${domains.join(", ")}; the review must address each.`
                : `No changed path hits ${domains.join(", ")}.`,
            items: items.slice(0, 15),
        });
    }

    // Scope drift and path-level spec/diff mismatch
    const surfaceEntries = surfaceGlobs(sections.get(SPEC_HEADINGS.surface));
    if (surfaceEntries.length === 0) {
        add({
            id: "scope-drift",
            status: "CANNOT_ESTABLISH",
            detail: `SPEC.md has no "Affected surface" paths; scope drift and spec/diff mismatch cannot be established by path.`,
        });
    } else {
        const regexes = surfaceEntries.map(globToRegExp);
        const nonBehavioural = ruleSet.non_behavioural.map(globToRegExp);
        const undeclared = relevant.filter(
            (p) =>
                !regexes.some((re) => re.test(p)) &&
                !nonBehavioural.some((re) => re.test(p))
        );
        const untouched = surfaceEntries.filter(
            (entry, i) => !relevant.some((p) => regexes[i].test(p))
        );
        add({
            id: "scope-drift",
            status: undeclared.length ? "FLAG" : "PASS",
            detail: undeclared.length
                ? `${undeclared.length} changed path(s) are outside the declared Affected surface.`
                : "Every changed behavioural path is inside the declared Affected surface.",
            items: undeclared.slice(0, 20),
        });
        add({
            id: "declared-but-untouched",
            status: untouched.length ? "FLAG" : "PASS",
            detail: untouched.length
                ? `${untouched.length} declared surface entr(ies) have no changed path; confirm the work is complete or the surface was over-declared.`
                : "Every declared surface entry has at least one changed path.",
            items: untouched.slice(0, 20),
        });
    }

    // Required evidence presence
    const evidenceProblems: string[] = [];
    if (!contract) evidenceProblems.push("work-item.yaml not found");
    else {
        if (pathOf(contract, "task", "status") !== "READY_FOR_DEV")
            evidenceProblems.push(
                `task.status is ${String(pathOf(contract, "task", "status"))}, not READY_FOR_DEV`
            );
        if (pathOf(contract, "approval", "state") !== "APPROVED")
            evidenceProblems.push("approval.state is not APPROVED");
        const approver = pathOf(contract, "approval", "approved_by");
        if (typeof approver !== "string" || !approver.trim())
            evidenceProblems.push("approval.approved_by is empty");
        const blockers = pathOf(contract, "approval", "design_blockers");
        if (Array.isArray(blockers) && blockers.length)
            evidenceProblems.push("approval.design_blockers is not empty");
    }
    if (spec === null) evidenceProblems.push("SPEC.md not found");
    if (contract) {
        const texp = (
            Array.isArray(contract.test_expectations)
                ? contract.test_expectations
                : []
        ) as UnknownRecord[];
        const needsTests = texp.filter(
            (t) =>
                t.classification === "REQUIRED" &&
                CODE_TEST_CATEGORIES.has(String(t.category))
        );
        const testFilesChanged = changed.filter((p) => TEST_FILE.test(p));
        if (needsTests.length && testFilesChanged.length === 0)
            evidenceProblems.push(
                `${needsTests.length} REQUIRED code-level test expectation(s) (${needsTests.map((t) => String(t.id)).join(", ")}) but no test file changed in the diff`
            );
    }
    add({
        id: "required-evidence",
        status: evidenceProblems.length ? "FLAG" : "PASS",
        detail: evidenceProblems.length
            ? evidenceProblems.join("; ")
            : "Contract approved and READY_FOR_DEV, SPEC.md present, and REQUIRED code-level expectations have a changed test file.",
    });

    // Conditions
    const conditions = listEntries(sections.get(SPEC_HEADINGS.conditions));
    if (conditions.length === 0)
        add({
            id: "conditions",
            status: "PASS",
            detail: `No "Conditions" entries are declared in SPEC.md.`,
        });
    else if (!existsSync(reviewPath))
        add({
            id: "conditions",
            status: "CANNOT_ESTABLISH",
            detail: `${conditions.length} condition(s) declared; REVIEW.md does not exist yet, so verification cannot be checked.`,
            items: conditions,
        });
    else {
        const review = readFileSync(reviewPath, "utf8");
        const missing = conditions.filter((c) => {
            const label = /^(COND-[\w-]+)/i.exec(c)?.[1] ?? c.slice(0, 40);
            return !review.includes(label);
        });
        add({
            id: "conditions",
            status: missing.length ? "FLAG" : "PASS",
            detail: missing.length
                ? `${missing.length} of ${conditions.length} condition(s) are not referenced in REVIEW.md.`
                : `All ${conditions.length} condition(s) are referenced in REVIEW.md.`,
            items: missing,
        });
    }

    const effective = finalRisk
        ? maxLevel(finalRisk, risk.path_rule_risk)
        : risk.path_rule_risk;
    return {
        id: input.id,
        base: baseRef,
        base_sha: baseSha,
        head_sha: headSha,
        default_branch: defBranch,
        computed_path_rule_risk: risk.path_rule_risk,
        contract_final_risk: finalRisk,
        review_depth:
            effective === "L3"
                ? "L3: the AI must evidence every requirement, invariant, security boundary, integration and test expectation; script lines are inputs, not a substitute."
                : "L1/L2: the AI may accept script-established PASS lines and writes exceptions and material findings.",
        escalation: {
            required: escalationRequired,
            action: escalationRequired
                ? "MATERIAL_DRIFT; governance_reentry_required: true; result REVIEW_FAILED; task.status IN_REVIEW"
                : null,
        },
        changed_paths: relevant,
        checks,
    };
}

// ---------------------------------------------------------------------------
// CLI
// ---------------------------------------------------------------------------

function parseArgs(argv: string[]) {
    const positional: string[] = [];
    const flags = new Map<string, string | true>();
    for (let i = 0; i < argv.length; i++) {
        const arg = argv[i];
        if (arg.startsWith("--")) {
            const key = arg.slice(2);
            const next = argv[i + 1];
            if (next !== undefined && !next.startsWith("--")) {
                flags.set(key, next);
                i++;
            } else flags.set(key, true);
        } else positional.push(arg);
    }
    return { positional, flags };
}

function usage(): never {
    console.error(
        [
            "Usage: bun run scripts/governance/compact-check.ts <command> [options]",
            "  risk     --paths a,b | --diff <base>..<head> | --surface <SPEC.md> [--verify <work-item.yaml>] [--rules <file>]",
            "  budget   <work-item.yaml> [--rules <file>]",
            "  launch   <work-item.yaml> [--stdout] [--out <file>]",
            "  precheck --id REN-nnn [--base <ref>] [--head <ref>] [--dir <work-item dir>] [--repo <path>] [--rules <file>]",
        ].join("\n")
    );
    process.exit(2);
}

function main(argv: string[]) {
    const [command, ...rest] = argv;
    const { positional, flags } = parseArgs(rest);
    const cwd = process.cwd();
    const rulesPath =
        typeof flags.get("rules") === "string"
            ? (flags.get("rules") as string)
            : undefined;
    try {
        if (command === "risk") {
            const ruleSet = loadRules(rulesPath);
            let paths: string[] = [];
            const diff = flags.get("diff");
            const pathsFlag = flags.get("paths");
            const verifyPath = flags.get("verify");
            if (typeof diff === "string")
                paths = lines(
                    git(
                        [
                            "diff",
                            "--name-only",
                            diff.includes("..")
                                ? diff.replace("..", "...")
                                : diff,
                        ],
                        cwd
                    )
                );
            if (typeof pathsFlag === "string")
                paths.push(
                    ...pathsFlag
                        .split(",")
                        .map((p) => p.trim())
                        .filter(Boolean)
                );
            let specPath =
                typeof flags.get("surface") === "string"
                    ? (flags.get("surface") as string)
                    : undefined;
            if (!specPath && typeof verifyPath === "string") {
                const beside = join(dirname(resolve(verifyPath)), "SPEC.md");
                if (existsSync(beside)) specPath = beside;
            }
            if (specPath) {
                const entries = surfaceGlobs(
                    parseSections(readFileSync(specPath, "utf8")).get(
                        SPEC_HEADINGS.surface
                    )
                );
                paths.push(...expandSurface(entries, trackedFiles(cwd)));
            }
            if (paths.length === 0) {
                console.error(
                    "No paths to classify (use --paths, --diff or --surface)."
                );
                process.exit(2);
            }
            const result = classifyPaths(paths, ruleSet);
            if (typeof verifyPath === "string") {
                const verification = verifyContractRisk(
                    readYamlFile(resolve(verifyPath)),
                    result
                );
                console.log(
                    JSON.stringify({ ...result, verification }, null, 2)
                );
                process.exit(verification.verified ? 0 : 1);
            }
            console.log(JSON.stringify(result, null, 2));
            return;
        }
        if (command === "budget") {
            const yamlPath = positional[0];
            if (!yamlPath) usage();
            const ruleSet = loadRules(rulesPath);
            const abs = resolve(yamlPath);
            const spec = join(dirname(abs), "SPEC.md");
            const entries = existsSync(spec)
                ? surfaceGlobs(
                      parseSections(readFileSync(spec, "utf8")).get(
                          SPEC_HEADINGS.surface
                      )
                  )
                : [];
            const surface = expandSurface(entries, trackedFiles(cwd));
            console.log(
                JSON.stringify(
                    budgetLint(readYamlFile(abs), ruleSet, surface),
                    null,
                    2
                )
            );
            return;
        }
        if (command === "launch") {
            const yamlPath = positional[0];
            if (!yamlPath) usage();
            const abs = resolve(yamlPath);
            const spec = join(dirname(abs), "SPEC.md");
            const text = renderLaunch(
                readYamlFile(abs),
                existsSync(spec) ? readFileSync(spec, "utf8") : null
            );
            const out =
                typeof flags.get("out") === "string"
                    ? resolve(flags.get("out") as string)
                    : join(dirname(abs), "LAUNCH.md");
            if (flags.get("stdout") === true) console.log(text);
            else {
                writeFileSync(out, text, "utf8");
                console.log(`Wrote ${out}`);
            }
            return;
        }
        if (command === "precheck") {
            const id = flags.get("id");
            if (typeof id !== "string") usage();
            const result = precheck({
                repo:
                    typeof flags.get("repo") === "string"
                        ? (flags.get("repo") as string)
                        : cwd,
                id,
                workItemDir:
                    typeof flags.get("dir") === "string"
                        ? (flags.get("dir") as string)
                        : undefined,
                base:
                    typeof flags.get("base") === "string"
                        ? (flags.get("base") as string)
                        : undefined,
                head:
                    typeof flags.get("head") === "string"
                        ? (flags.get("head") as string)
                        : undefined,
                rulesPath,
            });
            console.log(JSON.stringify(result, null, 2));
            return;
        }
        usage();
    } catch (error) {
        console.error(error instanceof Error ? error.message : String(error));
        process.exit(2);
    }
}

if (import.meta.main) main(process.argv.slice(2));
