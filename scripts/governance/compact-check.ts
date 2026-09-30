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
 *   launch    generate (or --check) LAUNCH.md from work-item.yaml and SPEC.md
 *   precheck  deterministic REVIEW facts from the real diff and working tree
 *
 * Status semantics (every command):
 *   PASS              the condition was established and holds
 *   FLAG              the condition was established and needs attention
 *   CANNOT_ESTABLISH  the condition could not be determined; never a pass
 * Commands exit 0 unless --strict is given (then 1 if anything is FLAG or
 * CANNOT_ESTABLISH). Exit 2 means the command itself could not run or could
 * not establish its input.
 */
import { createHash } from "node:crypto";
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { parse } from "yaml";

export const LEVELS = ["L0", "L1", "L2", "L3"] as const;
export type Level = (typeof LEVELS)[number];
export type CheckStatus = "PASS" | "FLAG" | "CANNOT_ESTABLISH";

type UnknownRecord = Record<string, unknown>;

export const STATUS_SEMANTICS =
    "PASS: the condition was established and holds. FLAG: the condition was established and needs attention. CANNOT_ESTABLISH: the condition could not be determined and is never a pass. Advisory only; the validator remains the gate.";

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
    signal?: string;
    items?: string[];
}

export const DEFAULT_RULES_PATH = join(import.meta.dir, "risk-rules.yaml");
export const DEPTH_TOKENS = ["L1_LIGHT", "L2_TARGETED", "L3_DEEP"] as const;
export const LAUNCH_VERSION = "1";

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
// Rules, globs and path normalisation
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

/**
 * Clean one path entry: trim, strip wrapping quotes or backticks, turn
 * backslashes into slashes, collapse repeated slashes, and drop leading `./`
 * and `/`. A trailing slash is kept (it marks a directory).
 */
export function cleanPath(value: string): string {
    let out = value
        .trim()
        .replace(/^[`'"]+|[`'"]+$/g, "")
        .replace(/\\/g, "/")
        .replace(/\/{2,}/g, "/");
    while (out.startsWith("./")) out = out.slice(2);
    out = out.replace(/^\/+/, "");
    return out === "." ? "" : out;
}

/** The comparison form of a path: cleaned and without a trailing slash. */
export const pathKey = (value: string): string =>
    cleanPath(value).replace(/\/+$/, "");

/** Split on commas and newlines, but not on commas inside `{a,b}`. */
export function splitPathList(input: string | string[]): string[] {
    const source = Array.isArray(input) ? input : [input];
    const out: string[] = [];
    for (const chunk of source) {
        let depth = 0;
        let current = "";
        const push = () => {
            const cleaned = cleanPath(current);
            if (cleaned) out.push(cleaned);
            current = "";
        };
        for (const c of chunk) {
            if (c === "{") depth++;
            else if (c === "}" && depth > 0) depth--;
            if ((c === "," && depth === 0) || c === "\n" || c === "\r") push();
            else current += c;
        }
        push();
    }
    return [...new Set(out)];
}

/**
 * Classify paths against the rule set. Each input may be a file or a
 * directory, with or without a trailing slash: a path is tested both as given
 * and as a directory prefix, so `src/app/api/permission` and
 * `src/app/api/permission/` classify the same. Duplicates are merged.
 */
export function classifyPaths(
    inputPaths: string[],
    ruleSet: RuleSet
): RiskResult {
    const paths = [...new Set(inputPaths.map(pathKey))].filter(Boolean);
    const nonBehavioural = ruleSet.non_behavioural.map(globToRegExp);
    const compiled = ruleSet.rules.map((rule) => ({
        rule,
        regex: globToRegExp(rule.glob),
    }));
    const matches = (regex: RegExp, path: string) =>
        regex.test(path) || regex.test(`${path}/`);
    const hits: RuleHit[] = [];
    const unmatched: string[] = [];
    let risk: Level = "L0";
    for (const path of paths) {
        if (nonBehavioural.some((re) => matches(re, path))) continue;
        const matched = compiled.filter(({ regex }) => matches(regex, path));
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

/** Matches a surface entry that may be a file, a directory or a glob. */
export function surfaceMatcher(entry: string): RegExp {
    const key = pathKey(entry);
    if (hasGlobChars(key)) return globToRegExp(key);
    const escaped = key.replace(REGEX_SPECIAL, "\\$&");
    return new RegExp(`^${escaped}(?:/.*)?$`);
}

/**
 * Expand surface or path entries against a file listing so that globs and
 * directories become concrete files. Nothing is dropped: a glob that matches no
 * file keeps its literal directory prefix, a directory keeps itself, and a
 * literal path that does not exist yet is kept as given.
 */
export function expandEntries(entries: string[], files: string[]): string[] {
    const out = new Set<string>();
    for (const raw of entries) {
        const key = pathKey(raw);
        if (!key) continue;
        if (hasGlobChars(key)) {
            const regex = globToRegExp(key);
            const before = files.filter((file) => regex.test(file));
            for (const file of before) out.add(file);
            const first = key.search(/[*?{]/);
            const prefix = key.slice(0, first);
            const dir = prefix.slice(0, prefix.lastIndexOf("/") + 1);
            if (dir) out.add(pathKey(dir));
            else if (before.length === 0) out.add(key);
            continue;
        }
        const under = files.filter((file) => file.startsWith(`${key}/`));
        for (const file of under) out.add(file);
        out.add(key);
    }
    return [...out];
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

const nulList = (text: string) => text.split("\0").filter(Boolean);

function repoFiles(cwd: string): string[] {
    return lines(git(["ls-files", "-co", "--exclude-standard"], cwd, true));
}

const sha40 = (value: string | null | undefined): value is string =>
    typeof value === "string" && /^[0-9a-f]{40}$/.test(value);

function resolveCommit(repo: string, ref: string): string | null {
    const out = git(
        ["rev-parse", "--verify", "--quiet", `${ref}^{commit}`],
        repo,
        true
    ).trim();
    return sha40(out) ? out : null;
}

function mergeBase(repo: string, a: string, b: string): string | null {
    const out = git(["merge-base", a, b], repo, true).trim();
    return sha40(out) ? out : null;
}

function defaultBranch(repo: string): string | null {
    const head = git(
        ["symbolic-ref", "--short", "refs/remotes/origin/HEAD"],
        repo,
        true
    ).trim();
    if (head) return head;
    for (const candidate of ["origin/master", "origin/main", "master", "main"])
        if (resolveCommit(repo, candidate)) return candidate;
    return null;
}

/** Committed paths between two commits. Renames appear as a delete and an add. */
export function committedPaths(
    repo: string,
    baseSha: string,
    headSha: string
): string[] {
    return nulList(
        git(
            ["diff", "--name-only", "--no-renames", "-z", baseSha, headSha],
            repo,
            true
        )
    ).map(cleanPath);
}

export interface WorkingTree {
    ok: boolean;
    staged: string[];
    unstaged: string[];
    untracked: string[];
}

/** Staged, unstaged and untracked paths from `git status`. */
export function workingTreeChanges(repo: string): WorkingTree {
    const result = Bun.spawnSync(
        ["git", "status", "--porcelain=v1", "-z", "--untracked-files=all"],
        { cwd: repo }
    );
    const tree: WorkingTree = {
        ok: result.exitCode === 0,
        staged: [],
        unstaged: [],
        untracked: [],
    };
    if (!tree.ok) return tree;
    const parts = result.stdout.toString().split("\0");
    for (let i = 0; i < parts.length; i++) {
        const entry = parts[i];
        if (!entry) continue;
        const x = entry[0];
        const y = entry[1];
        const path = cleanPath(entry.slice(3));
        if (x === "R" || x === "C") {
            const original = cleanPath(parts[++i] ?? "");
            tree.staged.push(path);
            if (x === "R" && original) tree.staged.push(original);
            if (y !== " " && y !== "?") tree.unstaged.push(path);
            continue;
        }
        if (x === "?" && y === "?") tree.untracked.push(path);
        else {
            if (x !== " " && x !== "!") tree.staged.push(path);
            if (y !== " " && y !== "!") tree.unstaged.push(path);
        }
    }
    return tree;
}

function repoRoot(repo: string): string | null {
    const out = git(["rev-parse", "--show-toplevel"], repo, true).trim();
    return out ? resolve(out) : null;
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

const normaliseText = (text: string) => text.replace(/\r\n/g, "\n");
const digest = (text: string) =>
    createHash("sha256").update(normaliseText(text)).digest("hex").slice(0, 12);

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

/** Parse `##` and deeper headings. Lines inside code fences are content. */
export function parseSections(markdown: string): Map<string, string> {
    const sections = new Map<string, string>();
    const source = markdown.split(/\r?\n/);
    let currentKey: string | null = null;
    let currentLevel = 0;
    let buffer: string[] = [];
    let fence: string | null = null;
    const flush = () => {
        if (currentKey !== null && !sections.has(currentKey))
            sections.set(currentKey, buffer.join("\n").trim());
    };
    for (const line of source) {
        const fenceMatch = /^\s*(`{3,}|~{3,})/.exec(line);
        if (fenceMatch) {
            const marker = fenceMatch[1][0];
            if (fence === null) fence = marker;
            else if (fence === marker) fence = null;
            if (currentKey !== null) buffer.push(line);
            continue;
        }
        if (fence !== null) {
            if (currentKey !== null) buffer.push(line);
            continue;
        }
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
    let fence = false;
    for (const raw of body.split(/\r?\n/)) {
        if (/^\s*(`{3,}|~{3,})/.test(raw)) {
            fence = !fence;
            continue;
        }
        if (fence) continue;
        const line = raw
            .replace(/^\s*(?:[-*+]|\d+[.)])\s+/, "")
            .replace(/`/g, "")
            .trim();
        if (!line || line.startsWith("#")) continue;
        entries.push(line);
    }
    return entries;
}

/**
 * Paths and globs from the Affected surface section. One entry per line; a line
 * may hold several comma-separated paths, and trailing prose after ` - `,
 * ` — ` or ` (` is ignored. No path is dropped silently: a token that does not
 * look like a path is returned in `skipped` by `surfaceParse`.
 */
export function surfaceParse(body: string | undefined): {
    entries: string[];
    skipped: string[];
} {
    const entries: string[] = [];
    const skipped: string[] = [];
    for (const line of listEntries(body)) {
        const cut = line.split(/\s+(?:—|–|-|\()\s*/)[0];
        for (const token of splitPathList(cut)) {
            const piece = token.replace(/[;,]+$/, "");
            if (/[\\/.]/.test(piece) || hasGlobChars(piece))
                entries.push(piece);
            else if (piece) skipped.push(piece);
        }
    }
    return { entries: [...new Set(entries)], skipped };
}

export const surfaceGlobs = (body: string | undefined): string[] =>
    surfaceParse(body).entries;

// ---------------------------------------------------------------------------
// Command: risk
// ---------------------------------------------------------------------------

export interface VerifyResult {
    status: CheckStatus;
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
        status: problems.length === 0 ? "PASS" : "FLAG",
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
    recorded_files: number | null;
    file_budget: number | null;
    hop_budget: number | null;
    budget_exception: string | null;
    status: CheckStatus;
    notes: string[];
    mandatory_domain_traces: Check[];
    status_semantics: string;
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
    const rawAreas =
        isRecord(investigation) &&
        Array.isArray(investigation.investigated_areas)
            ? (investigation.investigated_areas as unknown[])
            : null;
    const areas = rawAreas
        ? [
              ...new Set(
                  rawAreas
                      .filter((v): v is string => typeof v === "string")
                      .map(pathKey)
                      .filter(Boolean)
              ),
          ]
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
        "PASS means only that the recorded area count is within the level budget; it does not show the investigation was bounded.",
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
    } else if (rawAreas === null) {
        status = "CANNOT_ESTABLISH";
        notes.push(
            "investigation.investigated_areas is missing or not a list; the recorded scope cannot be counted."
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
        const investigated = classifyPaths(areas, ruleSet);
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
        recorded_files: rawAreas === null ? null : areas.length,
        file_budget: budget?.files ?? null,
        hop_budget: budget?.hops ?? null,
        budget_exception: exception,
        status,
        notes,
        mandatory_domain_traces: traces,
        status_semantics: STATUS_SEMANTICS,
    };
}

// ---------------------------------------------------------------------------
// Command: launch
// ---------------------------------------------------------------------------

const WORD_TARGET: Record<string, number> = { L1: 250, L2: 450, L3: 700 };
const MAX_SECTION_WORDS = 90;
const WORK_ITEM_STATES = ["DRAFT", "IN_REVIEW", "BLOCKED", "READY_FOR_DEV"];
const wordCount = (text: string) => text.split(/\s+/).filter(Boolean).length;

function clip(
    text: string,
    maxWords = MAX_SECTION_WORDS,
    pointer = " … (full text in SPEC.md)"
): string {
    const words = text.replace(/\s+/g, " ").trim().split(" ").filter(Boolean);
    if (words.length <= maxWords) return words.join(" ");
    return `${words.slice(0, maxWords).join(" ")}${pointer}`;
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

type ListField =
    | { state: "missing" }
    | { state: "empty" }
    | { state: "list"; items: UnknownRecord[]; raw: unknown[] };

function listField(contract: UnknownRecord, ...keys: string[]): ListField {
    const value = pathOf(contract, ...keys);
    if (!Array.isArray(value)) return { state: "missing" };
    if (value.length === 0) return { state: "empty" };
    return {
        state: "list",
        items: value.filter(isRecord),
        raw: value,
    };
}

const missingField = (name: string) =>
    `MISSING: ${name} is absent or not a list in work-item.yaml`;

export function launchStamp(
    contractText: string,
    specText: string | null
): string {
    return `work-item.yaml ${digest(contractText)}, SPEC.md ${specText === null ? "absent" : digest(specText)}, compact-check launch v${LAUNCH_VERSION}`;
}

export function renderLaunch(
    contract: UnknownRecord,
    specText: string | null,
    contractText = ""
): string {
    const sections =
        specText === null ? new Map<string, string>() : parseSections(specText);
    const id = String(pathOf(contract, "task", "id") ?? "UNKNOWN");
    const title = String(pathOf(contract, "task", "title") ?? "UNKNOWN");
    const status = pathOf(contract, "task", "status");
    const approval = pathOf(contract, "approval", "state");
    const risk = (pathOf(contract, "risk") as UnknownRecord | undefined) ?? {};
    const level = asLevel(risk.final_risk);
    const requireRollback = level === null || level === "L2" || level === "L3";
    const out: string[] = [];
    const push = (text = "") => out.push(text);

    const trustProblems: string[] = [];
    if (!level)
        trustProblems.push("risk.final_risk is missing or not L0 to L3");
    if (typeof status !== "string" || !WORK_ITEM_STATES.includes(status))
        trustProblems.push("task.status is missing or not a valid state");
    if (typeof approval !== "string")
        trustProblems.push("approval.state is missing");
    else if (status === "READY_FOR_DEV" && approval !== "APPROVED")
        trustProblems.push(
            `task.status is READY_FOR_DEV but approval.state is ${approval}`
        );

    push(`# LAUNCH: ${id} — ${title}`);
    push();
    push(
        `> GENERATED from work-item.yaml and SPEC.md. Do not edit. If this page disagrees with the contract, the contract wins. Nothing here is invented: a missing item is shown as MISSING or SECTION MISSING, and NONE RECORDED means the contract lists the item as empty.`
    );
    push();
    if (trustProblems.length)
        push(
            `Readiness: NOT TRUSTED (${trustProblems.join("; ")}). Raw task.status: ${String(status ?? "absent")}. Risk: ${level ?? "INVALID"}. Run the validator before acting on this page.`
        );
    else
        push(
            `Readiness: ${String(status)}    Risk: ${String(level)}    Approval: ${String(approval)}`
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
        push(`Reasons: ${clip(reasons.map(String).join("; "), 60, " …")}`);
    const decisions = listField(contract, "decisions");
    push();
    if (decisions.state === "missing")
        push(`Open decisions: ${missingField("decisions")}`);
    else if (decisions.state === "empty")
        push("Open decisions: NONE RECORDED (decisions is an empty list).");
    else {
        const open = decisions.items
            .filter((d) => d.status !== "resolved")
            .sort((a, b) =>
                a.human_confirmation_required === b.human_confirmation_required
                    ? 0
                    : a.human_confirmation_required
                      ? -1
                      : 1
            );
        if (open.length === 0)
            push(
                `Open decisions: none of the ${decisions.raw.length} recorded decision(s) is open.`
            );
        else {
            push(`Open decisions (${open.length}):`);
            for (const d of open.slice(0, 5))
                push(
                    `- ${String(d.id)} [${String(d.class ?? "?")}${d.human_confirmation_required ? ", human confirmation required" : ""}] ${clip(String(d.question ?? ""), 30, " …")}`
                );
            if (open.length > 5)
                push(`- +${open.length - 5} more in work-item.yaml`);
        }
    }

    push();
    push("## BUILD");
    push();
    const surface = surfaceParse(sections.get(SPEC_HEADINGS.surface));
    if (surface.entries.length === 0)
        push(
            `Affected surface: SECTION MISSING: "Affected surface" (no paths found in SPEC.md)`
        );
    else {
        push("Affected surface:");
        for (const entry of surface.entries.slice(0, 8)) push(`- ${entry}`);
        if (surface.entries.length > 8)
            push(`- +${surface.entries.length - 8} more in SPEC.md`);
    }
    if (surface.skipped.length)
        push(
            `Affected surface tokens not read as paths: ${surface.skipped.join(", ")}`
        );
    const deps = listField(contract, "dependencies");
    push();
    if (deps.state === "missing")
        push(`Dependencies: ${missingField("dependencies")}`);
    else if (deps.state === "empty")
        push("Dependencies: NONE RECORDED (dependencies is an empty list).");
    else {
        push("Dependencies:");
        for (const d of deps.items.slice(0, 6))
            push(
                `- ${String(d.id)} (${String(d.status ?? "?")}) ${clip(String(d.description ?? ""), 18, " …")}`
            );
        if (deps.items.length > 6)
            push(`- +${deps.items.length - 6} more in work-item.yaml`);
    }
    push();
    push(
        `Implementation plan: ${sectionOrMissing(sections, SPEC_HEADINGS.plan, "Implementation plan", true)}`
    );
    push();
    push(
        `Rollback: ${sectionOrMissing(sections, SPEC_HEADINGS.rollback, "Rollback", requireRollback)}`
    );
    const blockers = listField(contract, "approval", "design_blockers");
    push();
    if (blockers.state === "missing")
        push(
            `Known design blockers: ${missingField("approval.design_blockers")}`
        );
    else if (blockers.state === "empty")
        push(
            "Known design blockers: NONE RECORDED (design_blockers is an empty list)."
        );
    else push(`Known design blockers: ${blockers.raw.map(String).join("; ")}`);

    push();
    push("## VERIFY");
    push();
    push(
        `Acceptance criteria: ${sectionOrMissing(sections, SPEC_HEADINGS.acceptance, "Acceptance criteria", true)}`
    );
    const texp = listField(contract, "test_expectations");
    push();
    if (texp.state === "missing")
        push(`Test expectations: ${missingField("test_expectations")}`);
    else if (texp.state === "empty")
        push(
            "Test expectations: NONE RECORDED (test_expectations is an empty list)."
        );
    else {
        push("Test expectations:");
        for (const t of texp.items.slice(0, 8))
            push(
                `- ${String(t.id)} ${String(t.category)} ${String(t.classification)}: ${clip(String(t.reason ?? ""), 18, " …")}`
            );
        if (texp.items.length > 8)
            push(`- +${texp.items.length - 8} more in work-item.yaml`);
    }

    push();
    push("## PROVE");
    push();
    if (texp.state === "missing")
        push(`Evidence required: ${missingField("test_expectations")}`);
    else if (texp.state === "empty")
        push("Evidence required: NONE RECORDED (no test expectations).");
    else {
        const required = texp.items.filter(
            (t) => t.classification === "REQUIRED"
        );
        if (required.length === 0)
            push(
                "Evidence required: no REQUIRED test expectation is recorded."
            );
        else {
            push("Evidence required (attach for each REQUIRED expectation):");
            for (const t of required.slice(0, 8))
                push(
                    `- ${String(t.id)}: result of the ${String(t.category)} verification`
                );
            if (required.length > 8)
                push(`- +${required.length - 8} more in work-item.yaml`);
        }
    }
    const conditions = listEntries(sections.get(SPEC_HEADINGS.conditions));
    push();
    if (conditions.length === 0)
        push(`Conditions: none declared (no "Conditions" entries in SPEC.md).`);
    else {
        push("Conditions:");
        for (const c of conditions.slice(0, 6)) push(`- ${clip(c, 30, " …")}`);
    }
    push();
    push(
        "REVIEW will check: changed paths (committed and working tree) against the Affected surface, risk recomputed from the real diff, migration/auth/provider touches, base and head commits, uncommitted changes, REQUIRED evidence, and the conditions above."
    );

    const body = out.join("\n");
    const target = level ? WORD_TARGET[level] : undefined;
    const words = wordCount(body);
    const footer = `\n\nWords: ${words}${target ? ` (target about ${target}${words > target ? ", over target" : ""})` : ""}.\nSource stamp: ${launchStamp(contractText, specText)}\nStatus semantics: ${STATUS_SEMANTICS}\n`;
    return `${body}${footer}`;
}

export interface LaunchCheck {
    status: "FRESH" | "STALE" | "MISSING";
    detail: string;
}

export function launchFreshness(
    existing: string | null,
    contractText: string,
    specText: string | null
): LaunchCheck {
    if (existing === null)
        return { status: "MISSING", detail: "LAUNCH.md does not exist." };
    const match = /^Source stamp: (.+)$/m.exec(normaliseText(existing));
    if (!match)
        return { status: "STALE", detail: "LAUNCH.md has no source stamp." };
    const expected = launchStamp(contractText, specText);
    return match[1].trim() === expected
        ? { status: "FRESH", detail: `Matches ${expected}.` }
        : {
              status: "STALE",
              detail: `LAUNCH.md was generated from "${match[1].trim()}" but the sources are now "${expected}".`,
          };
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

export interface RangeResult {
    ok: boolean;
    problems: string[];
    head_sha: string | null;
    base_sha: string | null;
    explicit_base_sha: string | null;
    default_branch: string | null;
    default_merge_base: string | null;
}

export function resolveRange(
    repo: string,
    baseInput?: string,
    headInput?: string
): RangeResult {
    const problems: string[] = [];
    const headRef = headInput ?? "HEAD";
    const headSha = resolveCommit(repo, headRef);
    if (!headSha)
        problems.push(`UNRESOLVED_HEAD: "${headRef}" is not a commit`);
    const defBranch = defaultBranch(repo);
    const defaultMergeBase =
        headSha && defBranch ? mergeBase(repo, defBranch, headSha) : null;
    let explicitSha: string | null = null;
    let baseSha: string | null = null;
    if (baseInput) {
        explicitSha = resolveCommit(repo, baseInput);
        if (!explicitSha)
            problems.push(`UNRESOLVED_BASE: "${baseInput}" is not a commit`);
        else if (headSha) {
            baseSha = mergeBase(repo, explicitSha, headSha);
            if (!baseSha)
                problems.push(
                    `NO_MERGE_BASE: "${baseInput}" and "${headRef}" share no history`
                );
        }
    } else if (!defBranch)
        problems.push("NO_DEFAULT_BRANCH: no default branch could be found");
    else if (headSha) {
        baseSha = defaultMergeBase;
        if (!baseSha)
            problems.push(
                `NO_MERGE_BASE: "${defBranch}" and "${headRef}" share no history`
            );
    }
    return {
        ok: problems.length === 0 && sha40(baseSha) && sha40(headSha),
        problems,
        head_sha: headSha,
        base_sha: baseSha,
        explicit_base_sha: explicitSha,
        default_branch: defBranch,
        default_merge_base: defaultMergeBase,
    };
}

export interface PrecheckResult {
    id: string;
    status_semantics: string;
    base_sha: string | null;
    head_sha: string | null;
    default_branch: string | null;
    computed_path_rule_risk: Level | null;
    committed_path_rule_risk: Level | null;
    working_tree_path_rule_risk: Level | null;
    contract_final_risk: string | null;
    review_depth: string;
    escalation: { required: boolean; action: string | null };
    changed: {
        committed: string[];
        staged: string[];
        unstaged: string[];
        untracked: string[];
    };
    changed_paths: string[];
    ignored_generated: string[];
    checks: Check[];
    summary: { pass: number; flag: number; cannot_establish: number };
    incomplete: boolean;
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
/** Generated by the skills inside the task folder; they do not make a tree dirty. */
const GENERATED_ARTEFACTS = ["REVIEW.md", "LAUNCH.md"];

const conditionId = (entry: string) =>
    /^(COND-[A-Za-z0-9]+(?:-[A-Za-z0-9]+)*)/i.exec(entry)?.[1] ?? null;

const containsToken = (text: string, token: string) =>
    new RegExp(
        `(?<![A-Za-z0-9-])${token.replace(REGEX_SPECIAL, "\\$&")}(?![A-Za-z0-9-])`
    ).test(text);

export function precheck(input: PrecheckInput): PrecheckResult {
    const top = repoRoot(input.repo);
    const repo = top ?? resolve(input.repo);
    const ruleSet = loadRules(input.rulesPath);
    const dir = resolve(
        repo,
        input.workItemDir ?? join("docs", ".work-items", input.id)
    );
    const dirPrefix = `${pathKey(join("docs", ".work-items", input.id))}/`;
    const checks: Check[] = [];
    const add = (check: Check) => checks.push(check);

    const yamlPath = join(dir, "work-item.yaml");
    const specPath = join(dir, "SPEC.md");
    const reviewPath = join(dir, "REVIEW.md");
    const contract = existsSync(yamlPath) ? readYamlFile(yamlPath) : null;
    const spec = existsSync(specPath) ? readFileSync(specPath, "utf8") : null;
    const sections =
        spec === null ? new Map<string, string>() : parseSections(spec);

    // Range
    const range = top
        ? resolveRange(repo, input.base, input.head)
        : ({
              ok: false,
              problems: ["NOT_A_GIT_REPOSITORY"],
              head_sha: null,
              base_sha: null,
              explicit_base_sha: null,
              default_branch: null,
              default_merge_base: null,
          } satisfies RangeResult);
    const recordedBase = pathOf(
        contract ?? {},
        "implementation_review",
        "base_branch"
    );
    const bare = (ref: string) => ref.replace(/^origin\//, "");
    if (!range.ok)
        add({
            id: "base-head",
            status: "CANNOT_ESTABLISH",
            signal: "UNRESOLVED_REF",
            detail: `Base or head could not be resolved to commits: ${range.problems.join("; ")}.`,
        });
    else {
        const problems: string[] = [];
        if (
            range.explicit_base_sha &&
            range.default_merge_base &&
            range.base_sha !== range.default_merge_base
        )
            problems.push(
                `The comparison base ${range.base_sha} is not the merge-base of head with the default branch (${range.default_merge_base}).`
            );
        if (
            range.default_branch &&
            typeof recordedBase === "string" &&
            bare(recordedBase) !== bare(range.default_branch)
        )
            problems.push(
                `Recorded base_branch "${recordedBase}" differs from the repository default branch "${range.default_branch}".`
            );
        add({
            id: "base-head",
            status: problems.length ? "FLAG" : "PASS",
            detail: problems.length
                ? problems.join(" ")
                : `base ${range.base_sha}, head ${range.head_sha}, default branch ${range.default_branch ?? "unknown"}.`,
        });
    }

    // Changes: committed diff and working tree, kept apart
    const committedAll =
        range.ok && range.base_sha && range.head_sha
            ? committedPaths(repo, range.base_sha, range.head_sha)
            : [];
    const tree = workingTreeChanges(repo);
    const isGenerated = (path: string) =>
        GENERATED_ARTEFACTS.some((name) => path === `${dirPrefix}${name}`);
    const ignoredGenerated = [
        ...tree.staged,
        ...tree.unstaged,
        ...tree.untracked,
    ].filter(isGenerated);
    const outsideItem = (paths: string[]) =>
        [...new Set(paths.map(pathKey))].filter(
            (p) => p && !p.startsWith(dirPrefix)
        );
    const committed = outsideItem(committedAll);
    const staged = outsideItem(tree.staged);
    const unstaged = outsideItem(tree.unstaged);
    const untracked = outsideItem(tree.untracked);
    const working = [...new Set([...staged, ...unstaged, ...untracked])];
    const all = [...new Set([...committed, ...working])];
    const diffEstablished = range.ok && tree.ok;

    if (!tree.ok)
        add({
            id: "dirty-tree",
            status: "CANNOT_ESTABLISH",
            detail: "git status could not be read.",
        });
    else {
        const dirtyItems = [
            ...new Set(
                [...tree.staged, ...tree.unstaged, ...tree.untracked]
                    .map(pathKey)
                    .filter((p) => p && !isGenerated(p))
            ),
        ];
        add({
            id: "dirty-tree",
            status: dirtyItems.length ? "FLAG" : "PASS",
            detail: dirtyItems.length
                ? `${dirtyItems.length} uncommitted path(s) (${staged.length} staged, ${unstaged.length} unstaged, ${untracked.length} untracked outside the task folder); a completed review must record this state. Generated REVIEW.md and LAUNCH.md are ignored.`
                : "No uncommitted changes other than the generated REVIEW.md and LAUNCH.md.",
            items: dirtyItems.slice(0, 10),
        });
    }

    add({
        id: "empty-diff",
        status: !diffEstablished
            ? "CANNOT_ESTABLISH"
            : all.length === 0
              ? "FLAG"
              : "PASS",
        signal: !diffEstablished
            ? "UNRESOLVED_REF"
            : all.length === 0
              ? "EMPTY_DIFF"
              : undefined,
        detail: !diffEstablished
            ? "The diff could not be established (unresolved ref or unreadable working tree), so nothing below can be treated as clean."
            : all.length === 0
              ? "EMPTY_DIFF: no committed or working-tree change outside the task folder. A review of nothing is not evidence; check the base and head."
              : `${all.length} changed path(s) outside the task folder.`,
    });

    add({
        id: "changed-paths",
        status: diffEstablished ? "PASS" : "CANNOT_ESTABLISH",
        detail: diffEstablished
            ? `${committed.length} committed, ${staged.length} staged, ${unstaged.length} unstaged, ${untracked.length} untracked path(s) outside the task folder.`
            : "Changed paths could not be established.",
        items: all.slice(0, 30),
    });

    const diffReady = diffEstablished && all.length > 0;
    const notReady = (what: string): Check["detail"] =>
        !diffEstablished
            ? `${what} cannot be established: the diff could not be resolved.`
            : `${what} cannot be established: the diff is empty.`;

    // Risk recomputation over committed plus working-tree paths
    const riskAll = classifyPaths(all, ruleSet);
    const riskCommitted = classifyPaths(committed, ruleSet);
    const riskWorking = classifyPaths(working, ruleSet);
    const finalRisk = asLevel(pathOf(contract ?? {}, "risk", "final_risk"));
    let escalationRequired = false;
    if (!diffReady)
        add({
            id: "risk-escalation",
            status: "CANNOT_ESTABLISH",
            detail: notReady("Risk escalation"),
        });
    else if (!contract)
        add({
            id: "risk-escalation",
            status: "CANNOT_ESTABLISH",
            detail: "work-item.yaml not found; no contract risk to compare.",
        });
    else if (!finalRisk)
        add({
            id: "risk-escalation",
            status: "CANNOT_ESTABLISH",
            detail: "risk.final_risk is missing or not a level.",
        });
    else if (levelIndex(riskAll.path_rule_risk) > levelIndex(finalRisk)) {
        escalationRequired = true;
        const onlyWorking =
            levelIndex(riskCommitted.path_rule_risk) <= levelIndex(finalRisk);
        add({
            id: "risk-escalation",
            status: "FLAG",
            detail: `The real diff computes path rule risk ${riskAll.path_rule_risk} (committed ${riskCommitted.path_rule_risk}, working tree ${riskWorking.path_rule_risk}), above the contract's final risk ${finalRisk}${onlyWorking ? "; the escalation comes only from uncommitted changes" : ""}. Treat as material drift: governance_reentry_required true, result REVIEW_FAILED, task.status IN_REVIEW.`,
            items: riskAll.hits
                .slice(0, 10)
                .map(
                    (h) =>
                        `${h.path} -> ${h.domain} ${h.min_level} (${h.rule_id})`
                ),
        });
    } else
        add({
            id: "risk-escalation",
            status: "PASS",
            detail: `Computed path rule risk ${riskAll.path_rule_risk} (committed ${riskCommitted.path_rule_risk}, working tree ${riskWorking.path_rule_risk}) does not exceed the contract's final risk ${finalRisk}.`,
        });

    // Migration, auth and provider touches
    const touch = (domains: string[]) =>
        riskAll.hits
            .filter((h) => domains.includes(h.domain))
            .map((h) => `${h.path} (${h.rule_id})`);
    for (const [id, label, domains] of [
        ["migration-touched", "Migration touch", ["schema_migration"]],
        [
            "auth-touched",
            "Auth touch",
            ["authn_authz", "tenant_isolation", "pii_identity"],
        ],
        [
            "provider-touched",
            "Provider, payment or inventory touch",
            ["external_provider", "payment", "inventory"],
        ],
    ] as const) {
        if (!diffReady) {
            add({ id, status: "CANNOT_ESTABLISH", detail: notReady(label) });
            continue;
        }
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
    const surface = surfaceParse(sections.get(SPEC_HEADINGS.surface));
    if (surface.entries.length === 0)
        add({
            id: "scope-drift",
            status: "CANNOT_ESTABLISH",
            detail: `SPEC.md has no "Affected surface" paths; scope drift and spec/diff mismatch cannot be established by path.`,
        });
    else if (!diffReady) {
        add({
            id: "scope-drift",
            status: "CANNOT_ESTABLISH",
            detail: notReady("Scope drift"),
        });
        add({
            id: "declared-but-untouched",
            status: "CANNOT_ESTABLISH",
            detail: notReady("Declared-but-untouched surface"),
        });
    } else {
        const matchers = surface.entries.map(surfaceMatcher);
        const nonBehavioural = ruleSet.non_behavioural.map(globToRegExp);
        const undeclared = all.filter(
            (p) =>
                !matchers.some((re) => re.test(p)) &&
                !nonBehavioural.some((re) => re.test(p))
        );
        const untouched = surface.entries.filter(
            (_, i) => !all.some((p) => matchers[i].test(p))
        );
        add({
            id: "scope-drift",
            status: undeclared.length ? "FLAG" : "PASS",
            detail: undeclared.length
                ? `${undeclared.length} changed path(s) are outside the declared Affected surface.`
                : "Every changed behavioural path (committed and working tree) is inside the declared Affected surface.",
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
    let evidenceEstablishable = true;
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
    let evidenceNote = "";
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
        if (needsTests.length) {
            if (!diffReady) evidenceEstablishable = false;
            else {
                const changedTests = all.filter((p) => TEST_FILE.test(p));
                const related = pathOf(
                    contract,
                    "investigation",
                    "related_tests"
                );
                const existing = (Array.isArray(related) ? related : [])
                    .filter((v): v is string => typeof v === "string")
                    .map(pathKey)
                    .filter(
                        (p) => TEST_FILE.test(p) && existsSync(resolve(repo, p))
                    );
                if (changedTests.length === 0 && existing.length === 0)
                    evidenceProblems.push(
                        `${needsTests.length} REQUIRED code-level test expectation(s) (${needsTests.map((t) => String(t.id)).join(", ")}) but no test file changed and no existing test listed in investigation.related_tests was found`
                    );
                else if (changedTests.length === 0)
                    evidenceNote = ` No test file changed; REQUIRED expectations rely on existing test file(s) listed in investigation.related_tests that exist (${existing.slice(0, 3).join(", ")}). The review must judge coverage statically.`;
            }
        }
    }
    add({
        id: "required-evidence",
        status: evidenceProblems.length
            ? "FLAG"
            : evidenceEstablishable
              ? "PASS"
              : "CANNOT_ESTABLISH",
        detail: evidenceProblems.length
            ? evidenceProblems.join("; ")
            : evidenceEstablishable
              ? `Contract approved and READY_FOR_DEV, SPEC.md present, and REQUIRED code-level expectations have test evidence.${evidenceNote}`
              : notReady("The REQUIRED test-file evidence"),
    });

    // Conditions (exact IDs; the first pass cannot pass before REVIEW.md exists)
    const conditions = listEntries(sections.get(SPEC_HEADINGS.conditions));
    if (conditions.length === 0)
        add({
            id: "conditions",
            status: "PASS",
            detail: `No "Conditions" entries are declared in SPEC.md.`,
        });
    else {
        const noId = conditions.filter((c) => !conditionId(c));
        if (noId.length)
            add({
                id: "conditions",
                status: "CANNOT_ESTABLISH",
                detail: `${noId.length} condition(s) have no COND-<id> prefix and cannot be matched exactly; give each an ID.`,
                items: noId,
            });
        else if (!existsSync(reviewPath))
            add({
                id: "conditions",
                status: "CANNOT_ESTABLISH",
                signal: "SECOND_PASS_REQUIRED",
                detail: `${conditions.length} condition(s) declared and REVIEW.md does not exist yet. This is the first pass: run precheck again after REVIEW.md is drafted; until then the conditions are not verified.`,
                items: conditions,
            });
        else {
            const review = readFileSync(reviewPath, "utf8");
            const missing = conditions.filter(
                (c) => !containsToken(review, conditionId(c) as string)
            );
            add({
                id: "conditions",
                status: missing.length ? "FLAG" : "PASS",
                detail: missing.length
                    ? `${missing.length} of ${conditions.length} condition ID(s) are not referenced in REVIEW.md.`
                    : `All ${conditions.length} condition ID(s) are referenced in REVIEW.md.`,
                items: missing,
            });
        }
    }

    const effective = finalRisk
        ? maxLevel(finalRisk, riskAll.path_rule_risk)
        : riskAll.path_rule_risk;
    const count = (status: CheckStatus) =>
        checks.filter((c) => c.status === status).length;
    const summary = {
        pass: count("PASS"),
        flag: count("FLAG"),
        cannot_establish: count("CANNOT_ESTABLISH"),
    };
    return {
        id: input.id,
        status_semantics: STATUS_SEMANTICS,
        base_sha: range.base_sha,
        head_sha: range.head_sha,
        default_branch: range.default_branch,
        computed_path_rule_risk: diffReady ? riskAll.path_rule_risk : null,
        committed_path_rule_risk: diffEstablished
            ? riskCommitted.path_rule_risk
            : null,
        working_tree_path_rule_risk: diffEstablished
            ? riskWorking.path_rule_risk
            : null,
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
        changed: { committed, staged, unstaged, untracked },
        changed_paths: all,
        ignored_generated: [...new Set(ignoredGenerated)],
        checks,
        summary,
        incomplete: summary.cannot_establish > 0,
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
            "  risk     --paths a,b | --diff <base>..<head> [--with-working-tree] | --surface <SPEC.md> [--verify <work-item.yaml>] [--rules <file>]",
            "  budget   <work-item.yaml> [--rules <file>] [--strict]",
            "  launch   <work-item.yaml> [--stdout] [--out <file>] [--check]",
            "  precheck --id REN-nnn [--base <ref>] [--head <ref>] [--dir <work-item dir>] [--repo <path>] [--rules <file>] [--strict]",
            "",
            `Status semantics: ${STATUS_SEMANTICS}`,
            "Exit 0 normally; --strict exits 1 on any FLAG or CANNOT_ESTABLISH; exit 2 means the command could not run or establish its input.",
        ].join("\n")
    );
    process.exit(2);
}

function strictExit(
    flags: Map<string, string | true>,
    statuses: CheckStatus[]
): void {
    if (flags.get("strict") === true && statuses.some((s) => s !== "PASS"))
        process.exit(1);
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
            const files = repoFiles(cwd);
            let entries: string[] = [];
            const diff = flags.get("diff");
            const pathsFlag = flags.get("paths");
            const verifyPath = flags.get("verify");
            if (typeof diff === "string") {
                const [baseRef, headRef] = diff.includes("..")
                    ? diff.split(/\.{2,3}/)
                    : [diff, "HEAD"];
                const base = resolveCommit(cwd, baseRef);
                const head = resolveCommit(cwd, headRef || "HEAD");
                if (!base || !head) {
                    console.error(
                        `UNRESOLVED_REF: cannot resolve ${baseRef} or ${headRef || "HEAD"}.`
                    );
                    process.exit(2);
                }
                const mb = mergeBase(cwd, base, head);
                if (!mb) {
                    console.error("NO_MERGE_BASE: the refs share no history.");
                    process.exit(2);
                }
                entries.push(...committedPaths(cwd, mb, head));
            }
            if (flags.get("with-working-tree") === true) {
                const tree = workingTreeChanges(cwd);
                if (!tree.ok) {
                    console.error("git status could not be read.");
                    process.exit(2);
                }
                entries.push(
                    ...tree.staged,
                    ...tree.unstaged,
                    ...tree.untracked
                );
            }
            if (typeof pathsFlag === "string")
                entries.push(...splitPathList(pathsFlag));
            let specPath =
                typeof flags.get("surface") === "string"
                    ? (flags.get("surface") as string)
                    : undefined;
            if (!specPath && typeof verifyPath === "string") {
                const beside = join(dirname(resolve(verifyPath)), "SPEC.md");
                if (existsSync(beside)) specPath = beside;
            }
            if (specPath)
                entries.push(
                    ...surfaceParse(
                        parseSections(readFileSync(specPath, "utf8")).get(
                            SPEC_HEADINGS.surface
                        )
                    ).entries
                );
            entries = entries.map(cleanPath).filter(Boolean);
            if (entries.length === 0) {
                console.error(
                    "CANNOT_ESTABLISH: no paths to classify (use --paths, --diff or --surface)."
                );
                process.exit(2);
            }
            const result = classifyPaths(
                expandEntries(entries, files),
                ruleSet
            );
            if (typeof verifyPath === "string") {
                const verification = verifyContractRisk(
                    readYamlFile(resolve(verifyPath)),
                    result
                );
                console.log(
                    JSON.stringify(
                        {
                            ...result,
                            verification,
                            status_semantics: STATUS_SEMANTICS,
                        },
                        null,
                        2
                    )
                );
                process.exit(verification.verified ? 0 : 1);
            }
            console.log(
                JSON.stringify(
                    { ...result, status_semantics: STATUS_SEMANTICS },
                    null,
                    2
                )
            );
            return;
        }
        if (command === "budget") {
            const yamlPath = positional[0];
            if (!yamlPath) usage();
            const ruleSet = loadRules(rulesPath);
            const abs = resolve(yamlPath);
            const spec = join(dirname(abs), "SPEC.md");
            const entries = existsSync(spec)
                ? surfaceParse(
                      parseSections(readFileSync(spec, "utf8")).get(
                          SPEC_HEADINGS.surface
                      )
                  ).entries
                : [];
            const surface = expandEntries(entries, repoFiles(cwd));
            const result = budgetLint(readYamlFile(abs), ruleSet, surface);
            console.log(JSON.stringify(result, null, 2));
            strictExit(flags, [
                result.status,
                ...result.mandatory_domain_traces.map((t) => t.status),
            ]);
            return;
        }
        if (command === "launch") {
            const yamlPath = positional[0];
            if (!yamlPath) usage();
            const abs = resolve(yamlPath);
            const spec = join(dirname(abs), "SPEC.md");
            const contractText = readFileSync(abs, "utf8");
            const specText = existsSync(spec)
                ? readFileSync(spec, "utf8")
                : null;
            const out =
                typeof flags.get("out") === "string"
                    ? resolve(flags.get("out") as string)
                    : join(dirname(abs), "LAUNCH.md");
            if (flags.get("check") === true) {
                const check = launchFreshness(
                    existsSync(out) ? readFileSync(out, "utf8") : null,
                    contractText,
                    specText
                );
                console.log(JSON.stringify(check, null, 2));
                if (check.status !== "FRESH") process.exit(1);
                return;
            }
            const text = renderLaunch(
                readYamlFile(abs),
                specText,
                contractText
            );
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
            strictExit(
                flags,
                result.checks.map((c) => c.status)
            );
            return;
        }
        usage();
    } catch (error) {
        console.error(error instanceof Error ? error.message : String(error));
        process.exit(2);
    }
}

if (import.meta.main) main(process.argv.slice(2));
