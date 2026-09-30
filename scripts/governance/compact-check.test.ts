import {
    cpSync,
    mkdirSync,
    mkdtempSync,
    readFileSync,
    rmSync,
    writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { afterAll, describe, expect, test } from "bun:test";
import { parse, stringify } from "yaml";
import {
    budgetLint,
    classifyPaths,
    cleanPath,
    criticFocusFor,
    expandEntries,
    git,
    globToRegExp,
    launchFreshness,
    loadRules,
    parseSections,
    pathKey,
    precheck,
    renderLaunch,
    resolveRange,
    splitPathList,
    STATUS_SEMANTICS,
    surfaceGlobs,
    surfaceParse,
    verifyContractRisk,
    workingTreeChanges,
} from "./compact-check";
import { validateWorkItem } from "./validate-work-item";

const here = import.meta.dir;
const repoRoot = join(here, "..", "..");
const baseFixtureDir = join(here, "fixtures-compact", "base-l1");
const ruleSet = loadRules();

function loadBase(): Record<string, any> {
    return parse(readFileSync(join(baseFixtureDir, "work-item.yaml"), "utf8"));
}

const tempDirs: string[] = [];
afterAll(() => {
    for (const dir of tempDirs) rmSync(dir, { recursive: true, force: true });
});

/** Build a temporary git repository with the base fixture committed on master. */
function makeRepo(
    mutate?: (contract: Record<string, any>) => void,
    spec?: (text: string) => string
) {
    const dir = mkdtempSync(join(tmpdir(), "compact-check-"));
    tempDirs.push(dir);
    git(["init", "-q", "-b", "master"], dir);
    git(["config", "user.email", "fixture@example.invalid"], dir);
    git(["config", "user.name", "Fixture"], dir);
    const itemDir = join(dir, "docs", ".work-items", "REN-CT1");
    mkdirSync(itemDir, { recursive: true });
    const contract = loadBase();
    mutate?.(contract);
    writeFileSync(join(itemDir, "work-item.yaml"), stringify(contract));
    const specText = readFileSync(join(baseFixtureDir, "SPEC.md"), "utf8");
    writeFileSync(join(itemDir, "SPEC.md"), spec ? spec(specText) : specText);
    mkdirSync(join(dir, "src"), { recursive: true });
    writeFileSync(join(dir, "src", "example.ts"), "export const value = 1;\n");
    git(["add", "-A"], dir);
    git(["commit", "-q", "-m", "base"], dir);
    git(["checkout", "-q", "-b", "feature/ren-ct1"], dir);
    return dir;
}

function commitFiles(dir: string, files: Record<string, string>) {
    for (const [path, content] of Object.entries(files)) {
        const full = join(dir, path);
        mkdirSync(dirname(full), { recursive: true });
        writeFileSync(full, content);
    }
    git(["add", "-A"], dir);
    git(["commit", "-q", "-m", "change"], dir);
}

const check = (result: ReturnType<typeof precheck>, id: string) => {
    const found = result.checks.find((c) => c.id === id);
    if (!found) throw new Error(`check ${id} missing`);
    return found;
};

describe("risk rules", () => {
    test("rule ids are unique and every glob matches at least one tracked file", () => {
        const files = git(["ls-files"], repoRoot)
            .split(/\r?\n/)
            .filter(Boolean);
        const unmatched = ruleSet.rules.filter((rule) => {
            const regex = globToRegExp(rule.glob);
            return !files.some((file) => regex.test(file));
        });
        expect(unmatched.map((rule) => rule.id)).toEqual([]);
        expect(new Set(ruleSet.rules.map((r) => r.id)).size).toBe(
            ruleSet.rules.length
        );
    });

    test("budgets and critic focus cover the documented levels and domains", () => {
        expect(ruleSet.budgets.L1).toEqual({ files: 8, hops: 1 });
        expect(ruleSet.budgets.L2).toEqual({ files: 25, hops: 2 });
        expect(ruleSet.budgets.L3).toEqual({ files: 60, hops: 3 });
        for (const rule of ruleSet.rules)
            expect(Object.keys(ruleSet.critic_focus)).toContain(rule.domain);
    });
});

describe("glob matching", () => {
    test("supports segments, double star, braces and parenthesised routes", () => {
        expect(
            globToRegExp("src/lib/razorpay/**").test(
                "src/lib/razorpay/index.ts"
            )
        ).toBe(true);
        expect(
            globToRegExp("src/lib/razorpay/**").test("src/lib/razorpay")
        ).toBe(false);
        expect(
            globToRegExp("src/app/(protected)/checkout/**").test(
                "src/app/(protected)/checkout/page.tsx"
            )
        ).toBe(true);
        expect(
            globToRegExp("src/lib/{delhivery,shiprocket}/**").test(
                "src/lib/shiprocket/index.ts"
            )
        ).toBe(true);
        expect(globToRegExp("src/*.ts").test("src/a/b.ts")).toBe(false);
        expect(globToRegExp("**/*.md").test("README.md")).toBe(true);
    });
});

describe("risk classification", () => {
    test("computes the highest matching level and lists the domains", () => {
        const result = classifyPaths(
            ["src/middleware.ts", "src/lib/delhivery/orders.ts"],
            ruleSet
        );
        expect(result.path_rule_risk).toBe("L3");
        expect(result.domains).toEqual(["authn_authz", "external_provider"]);
    });

    test("documentation and test-only changes are L0; unmatched code is the default level", () => {
        expect(
            classifyPaths(
                ["docs/x.md", "src/lib/finance/calculations.test.ts"],
                ruleSet
            ).path_rule_risk
        ).toBe("L0");
        expect(
            classifyPaths(["src/components/ui/button.tsx"], ruleSet)
                .path_rule_risk
        ).toBe("L1");
    });

    test("migrations are L3 and schema definitions are L2", () => {
        expect(
            classifyPaths(["drizzle/0001_x.sql"], ruleSet).path_rule_risk
        ).toBe("L3");
        expect(
            classifyPaths(["src/lib/db/schema/orders.ts"], ruleSet)
                .path_rule_risk
        ).toBe("L2");
    });

    test("critic focus has at least two categories and follows the domains", () => {
        expect(criticFocusFor([], ruleSet).length).toBeGreaterThanOrEqual(2);
        expect(criticFocusFor(["external_provider"], ruleSet)).toEqual(
            expect.arrayContaining([
                "integrations_idempotency",
                "failure_recovery",
            ])
        );
    });

    test("F7: a recorded path rule or final risk below the computed value is rejected", () => {
        const computed = classifyPaths(["src/middleware.ts"], ruleSet);
        const contract = loadBase();
        const result = verifyContractRisk(contract, computed);
        expect(result.verified).toBe(false);
        expect(result.problems.join(" ")).toContain("never lower");
        contract.risk.path_rule_risk = "L3";
        contract.risk.final_risk = "L3";
        expect(verifyContractRisk(contract, computed).verified).toBe(true);
    });
});

describe("unchanged 1.0 contract", () => {
    test("the base fixture validates under the unchanged validator", () => {
        const result = validateWorkItem(loadBase());
        expect(result.errors).toEqual([]);
        expect(result.valid).toBe(true);
    });
});

describe("budget lint", () => {
    test("passes within budget and flags an unexplained overage", () => {
        const within = budgetLint(loadBase(), ruleSet, []);
        expect(within.status).toBe("PASS");
        const over = loadBase();
        over.investigation.investigated_areas = Array.from(
            { length: 9 },
            (_, i) => `src/f${i}.ts`
        );
        expect(budgetLint(over, ruleSet, []).status).toBe("FLAG");
        over.investigation.budget_exception =
            "Shared helper used by nine modules.";
        expect(budgetLint(over, ruleSet, []).status).toBe("PASS");
    });

    test("a legacy depth spelling is noted, not an error", () => {
        const contract = loadBase();
        contract.investigation.depth = "dependency_tracing";
        const result = budgetLint(contract, ruleSet, []);
        expect(result.depth_token_ok).toBe(false);
        expect(result.status).toBe("PASS");
        expect(result.notes.join(" ")).toContain("legacy spelling");
    });

    test("L3 flags a mandatory domain hit by the surface with no investigated area in it", () => {
        const contract = loadBase();
        contract.risk.final_risk = "L3";
        contract.investigation.investigated_areas = ["src/example.ts"];
        const result = budgetLint(contract, ruleSet, [
            "src/lib/razorpay/payment.ts",
        ]);
        expect(
            result.mandatory_domain_traces.some(
                (t) => t.id === "trace:payment" && t.status === "FLAG"
            )
        ).toBe(true);
        contract.investigation.investigated_areas = [
            "src/lib/razorpay/index.ts",
        ];
        const traced = budgetLint(contract, ruleSet, [
            "src/lib/razorpay/payment.ts",
        ]);
        expect(
            traced.mandatory_domain_traces.find((t) => t.id === "trace:payment")
                ?.status
        ).toBe("PASS");
    });

    test("it states that it is not live session-read enforcement", () => {
        expect(budgetLint(loadBase(), ruleSet, []).notes.join(" ")).toContain(
            "does not count live session reads"
        );
    });
});

describe("launch packet", () => {
    const spec = readFileSync(join(baseFixtureDir, "SPEC.md"), "utf8");

    test("has the four sections and the contract-wins statement", () => {
        const text = renderLaunch(loadBase(), spec);
        for (const heading of [
            "## UNDERSTAND",
            "## BUILD",
            "## VERIFY",
            "## PROVE",
        ])
            expect(text).toContain(heading);
        expect(text).toContain("the contract wins");
        expect(text).toContain("Today the example screen shows a stale number");
        expect(text).toContain("src/example.ts");
        expect(text).toContain("TEXP-001");
        expect(text).toContain("COND-1");
    });

    test("a missing heading is visible and nothing is invented", () => {
        const stripped = spec.replace(
            /## What are we fixing\?[\s\S]*?(?=## Affected surface)/,
            ""
        );
        const text = renderLaunch(loadBase(), stripped);
        expect(text).toContain('SECTION MISSING: "What are we fixing?"');
        expect(text).not.toContain("stale number");
    });

    test("rollback is required from L2 and optional at L1", () => {
        const noRollback = spec.replace(
            /## Rollback[\s\S]*?(?=## Conditions)/,
            ""
        );
        expect(renderLaunch(loadBase(), noRollback)).toContain(
            '(no "Rollback" section in SPEC.md)'
        );
        const l2 = loadBase();
        l2.risk.final_risk = "L2";
        expect(renderLaunch(l2, noRollback)).toContain(
            'SECTION MISSING: "Rollback"'
        );
    });

    test("a missing SPEC.md is shown and the packet still renders", () => {
        expect(renderLaunch(loadBase(), null)).toContain(
            "SECTION MISSING: SPEC.md was not found"
        );
    });

    test("stays near the L1 size target for a small contract", () => {
        const words = renderLaunch(loadBase(), spec).split(/\s+/).length;
        expect(words).toBeLessThan(450);
    });

    test("parses headings regardless of case and trailing punctuation", () => {
        const sections = parseSections(
            "## AFFECTED SURFACE:\n\n- `src/a.ts`\n- src/b/**\n"
        );
        expect(surfaceGlobs(sections.get("affected surface"))).toEqual([
            "src/a.ts",
            "src/b/**",
        ]);
    });
});

describe("REVIEW pre-check (seeded faults)", () => {
    test("clean: a declared change inside the surface passes scope, risk and evidence", () => {
        const dir = makeRepo();
        commitFiles(dir, {
            "src/example.ts": "export const value = 2;\n",
            "src/example.test.ts": "// test\n",
        });
        const result = precheck({ repo: dir, id: "REN-CT1" });
        expect(check(result, "base-head").status).toBe("PASS");
        expect(check(result, "dirty-tree").status).toBe("PASS");
        expect(check(result, "scope-drift").status).toBe("PASS");
        expect(check(result, "declared-but-untouched").status).toBe("PASS");
        expect(check(result, "risk-escalation").status).toBe("PASS");
        expect(check(result, "required-evidence").status).toBe("PASS");
        expect(result.base_sha).toMatch(/^[0-9a-f]{40}$/);
        expect(result.head_sha).toMatch(/^[0-9a-f]{40}$/);
        expect(result.escalation.required).toBe(false);
        expect(result.review_depth).toContain("L1/L2");
    });

    test("F1: an L1 contract whose diff touches an auth path escalates and re-enters governance", () => {
        const dir = makeRepo();
        commitFiles(dir, {
            "src/example.ts": "export const value = 2;\n",
            "src/middleware.ts": "export {};\n",
            "src/example.test.ts": "// t\n",
        });
        const result = precheck({ repo: dir, id: "REN-CT1" });
        expect(check(result, "risk-escalation").status).toBe("FLAG");
        expect(result.escalation.required).toBe(true);
        expect(result.escalation.action).toContain(
            "governance_reentry_required: true"
        );
        expect(result.computed_path_rule_risk).toBe("L3");
        expect(check(result, "auth-touched").status).toBe("FLAG");
        expect(check(result, "scope-drift").status).toBe("FLAG");
        expect(result.review_depth).toContain("L3");
    });

    test("F2: an undeclared migration file is flagged as a migration touch and scope drift", () => {
        const dir = makeRepo();
        commitFiles(dir, {
            "src/example.ts": "export const value = 2;\n",
            "src/example.test.ts": "// t\n",
            "drizzle/0100_x.sql": "select 1;\n",
        });
        const result = precheck({ repo: dir, id: "REN-CT1" });
        expect(check(result, "migration-touched").status).toBe("FLAG");
        expect(check(result, "scope-drift").items).toContain(
            "drizzle/0100_x.sql"
        );
    });

    test("F3: an undeclared provider call-site file is flagged", () => {
        const dir = makeRepo();
        commitFiles(dir, {
            "src/example.ts": "export const value = 2;\n",
            "src/example.test.ts": "// t\n",
            "src/lib/delhivery/extra.ts": "export {};\n",
        });
        const result = precheck({ repo: dir, id: "REN-CT1" });
        expect(check(result, "provider-touched").status).toBe("FLAG");
        expect(check(result, "scope-drift").status).toBe("FLAG");
    });

    test("F4: a recorded base that differs from the default branch, and a dirty tree, are flagged", () => {
        const dir = makeRepo((contract) => {
            contract.implementation_review = { base_branch: "origin/main" };
        });
        commitFiles(dir, {
            "src/example.ts": "export const value = 2;\n",
            "src/example.test.ts": "// t\n",
        });
        writeFileSync(join(dir, "src", "uncommitted.ts"), "export {};\n");
        const result = precheck({ repo: dir, id: "REN-CT1" });
        expect(check(result, "base-head").status).toBe("FLAG");
        expect(check(result, "base-head").detail).toContain(
            "differs from the repository default branch"
        );
        expect(check(result, "dirty-tree").status).toBe("FLAG");
    });

    test("F5: a REQUIRED unit expectation with no changed test file is flagged", () => {
        const dir = makeRepo();
        commitFiles(dir, { "src/example.ts": "export const value = 2;\n" });
        const result = precheck({ repo: dir, id: "REN-CT1" });
        expect(check(result, "required-evidence").status).toBe("FLAG");
        expect(check(result, "required-evidence").detail).toContain("TEXP-001");
    });

    test("F6: a condition with no reference in REVIEW.md is flagged; a referenced one passes", () => {
        const dir = makeRepo();
        commitFiles(dir, {
            "src/example.ts": "export const value = 2;\n",
            "src/example.test.ts": "// t\n",
        });
        expect(
            check(precheck({ repo: dir, id: "REN-CT1" }), "conditions").status
        ).toBe("CANNOT_ESTABLISH");
        const reviewPath = join(
            dir,
            "docs",
            ".work-items",
            "REN-CT1",
            "REVIEW.md"
        );
        writeFileSync(reviewPath, "# Review\n\nNothing about conditions.\n");
        expect(
            check(precheck({ repo: dir, id: "REN-CT1" }), "conditions").status
        ).toBe("FLAG");
        writeFileSync(
            reviewPath,
            "# Review\n\nCOND-1 verified by written confirmation.\n"
        );
        expect(
            check(precheck({ repo: dir, id: "REN-CT1" }), "conditions").status
        ).toBe("PASS");
    });

    test("path-level mismatch: a declared surface entry with no changed path is flagged", () => {
        const dir = makeRepo();
        commitFiles(dir, { "src/example.ts": "export const value = 2;\n" });
        const result = precheck({ repo: dir, id: "REN-CT1" });
        expect(check(result, "declared-but-untouched").status).toBe("FLAG");
        expect(check(result, "declared-but-untouched").items).toContain(
            "src/example.test.ts"
        );
    });

    test("a SPEC.md without an Affected surface cannot establish scope drift", () => {
        const dir = makeRepo(undefined, (text) =>
            text.replace(
                /## Affected surface[\s\S]*?(?=## Implementation plan)/,
                ""
            )
        );
        commitFiles(dir, { "src/example.ts": "export const value = 2;\n" });
        expect(
            check(precheck({ repo: dir, id: "REN-CT1" }), "scope-drift").status
        ).toBe("CANNOT_ESTABLISH");
    });

    test("an unapproved contract is reported under required evidence", () => {
        const dir = makeRepo((contract) => {
            contract.task.status = "BLOCKED";
            contract.approval.state = "BLOCKED";
        });
        commitFiles(dir, {
            "src/example.ts": "export const value = 2;\n",
            "src/example.test.ts": "// t\n",
        });
        expect(
            check(precheck({ repo: dir, id: "REN-CT1" }), "required-evidence")
                .detail
        ).toContain("not READY_FOR_DEV");
    });

    test("the pre-check writes nothing", () => {
        const dir = makeRepo();
        commitFiles(dir, {
            "src/example.ts": "export const value = 2;\n",
            "src/example.test.ts": "// t\n",
        });
        const before = git(["status", "--porcelain"], dir);
        precheck({ repo: dir, id: "REN-CT1" });
        expect(git(["status", "--porcelain"], dir)).toBe(before);
    });
});

describe("command line", () => {
    test("risk --paths prints JSON and risk --verify exits 1 on a lowered path rule", () => {
        const run = (args: string[]) =>
            Bun.spawnSync(
                ["bun", "run", join(here, "compact-check.ts"), ...args],
                { cwd: repoRoot }
            );
        const ok = run(["risk", "--paths", "src/middleware.ts"]);
        expect(ok.exitCode).toBe(0);
        expect(JSON.parse(ok.stdout.toString()).path_rule_risk).toBe("L3");
        const dir = mkdtempSync(join(tmpdir(), "compact-cli-"));
        tempDirs.push(dir);
        cpSync(baseFixtureDir, dir, { recursive: true });
        const verify = run([
            "risk",
            "--paths",
            "src/middleware.ts",
            "--verify",
            join(dir, "work-item.yaml"),
        ]);
        expect(verify.exitCode).toBe(1);
    });
});

// ---------------------------------------------------------------------------
// Hardening regression tests
// ---------------------------------------------------------------------------

const script = join(here, "compact-check.ts");
const runCli = (args: string[], cwd: string) =>
    Bun.spawnSync(["bun", "run", script, ...args], { cwd });
const changeFiles = {
    "src/example.ts": "export const value = 2;\n",
    "src/example.test.ts": "// t\n",
};
const reviewPath = (dir: string) =>
    join(dir, "docs", ".work-items", "REN-CT1", "REVIEW.md");

describe("hardening 1: fail-closed git refs", () => {
    test("a bogus base is unresolved and every dependent check is CANNOT_ESTABLISH", () => {
        const dir = makeRepo();
        commitFiles(dir, changeFiles);
        const result = precheck({
            repo: dir,
            id: "REN-CT1",
            base: "deadbeefdeadbeefdeadbeefdeadbeefdeadbeef",
        });
        expect(check(result, "base-head").status).toBe("CANNOT_ESTABLISH");
        expect(check(result, "base-head").signal).toBe("UNRESOLVED_REF");
        expect(check(result, "empty-diff").signal).toBe("UNRESOLVED_REF");
        for (const id of [
            "risk-escalation",
            "migration-touched",
            "auth-touched",
            "provider-touched",
            "scope-drift",
            "declared-but-untouched",
            "required-evidence",
        ])
            expect(check(result, id).status).toBe("CANNOT_ESTABLISH");
        expect(result.computed_path_rule_risk).toBeNull();
        expect(result.incomplete).toBe(true);
        expect(
            result.checks.some(
                (c) =>
                    c.status === "PASS" &&
                    /No changed path|does not exceed|inside the declared/.test(
                        c.detail
                    )
            )
        ).toBe(false);
    });

    test("a bogus head is unresolved and never reads as clean", () => {
        const dir = makeRepo();
        commitFiles(dir, changeFiles);
        const result = precheck({
            repo: dir,
            id: "REN-CT1",
            head: "no-such-ref",
        });
        expect(check(result, "base-head").status).toBe("CANNOT_ESTABLISH");
        expect(check(result, "risk-escalation").status).toBe(
            "CANNOT_ESTABLISH"
        );
        expect(check(result, "scope-drift").status).toBe("CANNOT_ESTABLISH");
    });

    test("base equal to head is an explicit EMPTY_DIFF, not a clean pass", () => {
        const dir = makeRepo();
        commitFiles(dir, changeFiles);
        const result = precheck({
            repo: dir,
            id: "REN-CT1",
            base: "HEAD",
            head: "HEAD",
        });
        expect(check(result, "empty-diff").status).toBe("FLAG");
        expect(check(result, "empty-diff").signal).toBe("EMPTY_DIFF");
        expect(check(result, "risk-escalation").status).toBe(
            "CANNOT_ESTABLISH"
        );
        expect(check(result, "scope-drift").status).toBe("CANNOT_ESTABLISH");
        expect(result.escalation.required).toBe(false);
    });

    test("a branch already merged into the default branch is an EMPTY_DIFF", () => {
        const dir = makeRepo();
        commitFiles(dir, changeFiles);
        git(["checkout", "-q", "master"], dir);
        git(["merge", "-q", "--ff-only", "feature/ren-ct1"], dir);
        const result = precheck({ repo: dir, id: "REN-CT1" });
        expect(check(result, "empty-diff").signal).toBe("EMPTY_DIFF");
    });

    test("resolveRange reports each unresolved reference with a code", () => {
        const dir = makeRepo();
        expect(resolveRange(dir, "nope").problems.join(" ")).toContain(
            "UNRESOLVED_BASE"
        );
        expect(
            resolveRange(dir, undefined, "nope").problems.join(" ")
        ).toContain("UNRESOLVED_HEAD");
        expect(resolveRange(dir).ok).toBe(true);
    });
});

describe("hardening 2: uncommitted changes", () => {
    test("an untracked sensitive file escalates and is reported as working tree", () => {
        const dir = makeRepo();
        commitFiles(dir, changeFiles);
        writeFileSync(join(dir, "src", "middleware.ts"), "export {};\n");
        const result = precheck({ repo: dir, id: "REN-CT1" });
        expect(result.changed.untracked).toContain("src/middleware.ts");
        expect(result.changed.committed).not.toContain("src/middleware.ts");
        expect(result.committed_path_rule_risk).toBe("L1");
        expect(result.working_tree_path_rule_risk).toBe("L3");
        expect(result.computed_path_rule_risk).toBe("L3");
        expect(check(result, "risk-escalation").status).toBe("FLAG");
        expect(check(result, "risk-escalation").detail).toContain(
            "only from uncommitted changes"
        );
        expect(check(result, "auth-touched").status).toBe("FLAG");
        expect(check(result, "scope-drift").status).toBe("FLAG");
    });

    test("a staged sensitive file is included and kept apart from committed changes", () => {
        const dir = makeRepo();
        commitFiles(dir, changeFiles);
        writeFileSync(join(dir, "src", "middleware.ts"), "export {};\n");
        git(["add", "src/middleware.ts"], dir);
        const result = precheck({ repo: dir, id: "REN-CT1" });
        expect(result.changed.staged).toContain("src/middleware.ts");
        expect(result.changed.untracked).not.toContain("src/middleware.ts");
        expect(result.escalation.required).toBe(true);
    });

    test("an unstaged edit to a tracked sensitive file is included", () => {
        const dir = makeRepo();
        commitFiles(dir, {
            ...changeFiles,
            "src/middleware.ts": "export {};\n",
        });
        writeFileSync(
            join(dir, "src", "middleware.ts"),
            "export const x = 1;\n"
        );
        const result = precheck({ repo: dir, id: "REN-CT1" });
        expect(result.changed.unstaged).toContain("src/middleware.ts");
        expect(result.changed.committed).toContain("src/middleware.ts");
        expect(result.escalation.required).toBe(true);
    });

    test("a rename out of a sensitive directory keeps the old path (no rename evasion)", () => {
        const dir = makeRepo();
        git(["checkout", "-q", "master"], dir);
        commitFiles(dir, { "src/lib/razorpay/x.ts": "export {};\n" });
        git(["checkout", "-q", "feature/ren-ct1"], dir);
        git(["rebase", "-q", "master"], dir);
        commitFiles(dir, changeFiles);
        git(["mv", "src/lib/razorpay/x.ts", "src/lib/moved.ts"], dir);
        git(["commit", "-q", "-m", "mv"], dir);
        const result = precheck({ repo: dir, id: "REN-CT1" });
        expect(result.changed.committed).toContain("src/lib/razorpay/x.ts");
        expect(result.changed.committed).toContain("src/lib/moved.ts");
        expect(result.computed_path_rule_risk).toBe("L3");
    });

    test("workingTreeChanges separates staged, unstaged and untracked paths", () => {
        const dir = makeRepo();
        writeFileSync(join(dir, "src", "a.ts"), "a\n");
        git(["add", "src/a.ts"], dir);
        writeFileSync(join(dir, "src", "example.ts"), "changed\n");
        writeFileSync(join(dir, "src", "b.ts"), "b\n");
        const tree = workingTreeChanges(dir);
        expect(tree.ok).toBe(true);
        expect(tree.staged).toEqual(["src/a.ts"]);
        expect(tree.unstaged).toEqual(["src/example.ts"]);
        expect(tree.untracked).toEqual(["src/b.ts"]);
    });
});

describe("hardening 3: dirty-tree check", () => {
    test("a newly generated REVIEW.md and LAUNCH.md do not make the tree dirty", () => {
        const dir = makeRepo();
        commitFiles(dir, changeFiles);
        writeFileSync(reviewPath(dir), "# Review\n");
        writeFileSync(
            join(dir, "docs", ".work-items", "REN-CT1", "LAUNCH.md"),
            "# Launch\n"
        );
        const result = precheck({ repo: dir, id: "REN-CT1" });
        expect(check(result, "dirty-tree").status).toBe("PASS");
        expect(result.ignored_generated.sort()).toEqual([
            "docs/.work-items/REN-CT1/LAUNCH.md",
            "docs/.work-items/REN-CT1/REVIEW.md",
        ]);
    });

    test("a modified tracked REVIEW.md is also ignored", () => {
        const dir = makeRepo();
        writeFileSync(reviewPath(dir), "# Review v1\n");
        commitFiles(dir, changeFiles);
        writeFileSync(reviewPath(dir), "# Review v2\n");
        expect(
            check(precheck({ repo: dir, id: "REN-CT1" }), "dirty-tree").status
        ).toBe("PASS");
    });

    test("other files in the work-item folder are not ignored", () => {
        const dir = makeRepo();
        commitFiles(dir, changeFiles);
        const specFile = join(dir, "docs", ".work-items", "REN-CT1", "SPEC.md");
        writeFileSync(specFile, readFileSync(specFile, "utf8") + "\nEdited.\n");
        const result = precheck({ repo: dir, id: "REN-CT1" });
        expect(check(result, "dirty-tree").status).toBe("FLAG");
        expect(check(result, "dirty-tree").items).toContain(
            "docs/.work-items/REN-CT1/SPEC.md"
        );
    });

    test("an uncommitted source file still makes the tree dirty", () => {
        const dir = makeRepo();
        commitFiles(dir, changeFiles);
        writeFileSync(join(dir, "src", "extra.ts"), "x\n");
        expect(
            check(precheck({ repo: dir, id: "REN-CT1" }), "dirty-tree").status
        ).toBe("FLAG");
    });
});

describe("hardening 4: base and merge-base handling", () => {
    test("a merge-base SHA and the branch-name form both pass", () => {
        const dir = makeRepo();
        commitFiles(dir, changeFiles);
        const sha = git(["merge-base", "master", "HEAD"], dir).trim();
        const bySha = precheck({ repo: dir, id: "REN-CT1", base: sha });
        const byName = precheck({ repo: dir, id: "REN-CT1", base: "master" });
        expect(check(bySha, "base-head").status).toBe("PASS");
        expect(check(byName, "base-head").status).toBe("PASS");
        expect(bySha.base_sha).toBe(sha);
        expect(byName.base_sha).toBe(sha);
    });

    test("a base that is not the merge-base with the default branch is flagged", () => {
        const dir = makeRepo();
        commitFiles(dir, changeFiles);
        const root = git(["rev-list", "--max-parents=0", "HEAD"], dir).trim();
        git(["checkout", "-q", "master"], dir);
        commitFiles(dir, { "src/other.ts": "x\n" });
        git(["checkout", "-q", "feature/ren-ct1"], dir);
        git(["rebase", "-q", "master"], dir);
        const result = precheck({ repo: dir, id: "REN-CT1", base: root });
        expect(check(result, "base-head").status).toBe("FLAG");
        expect(check(result, "base-head").detail).toContain(
            "not the merge-base"
        );
    });
});

describe("hardening 5: path normalisation", () => {
    test("directory with and without a trailing slash classify the same", () => {
        const a = classifyPaths(["src/app/api/permission"], ruleSet);
        const b = classifyPaths(["src/app/api/permission/"], ruleSet);
        expect(a.path_rule_risk).toBe("L3");
        expect(b.path_rule_risk).toBe("L3");
        expect(a.domains).toEqual(b.domains);
        expect(
            classifyPaths(["src/lib/razorpay"], ruleSet).path_rule_risk
        ).toBe("L3");
        expect(
            classifyPaths(["src/lib/razorpay/"], ruleSet).path_rule_risk
        ).toBe("L3");
    });

    test("backslashes, leading ./ and /, repeated slashes and duplicates normalise", () => {
        expect(cleanPath(".\\src\\app\\api\\permission\\")).toBe(
            "src/app/api/permission/"
        );
        expect(cleanPath("./src//lib/")).toBe("src/lib/");
        expect(cleanPath("/src/middleware.ts")).toBe("src/middleware.ts");
        expect(pathKey("src/lib/")).toBe("src/lib");
        const result = classifyPaths(
            [
                "src/middleware.ts",
                "./src/middleware.ts",
                "\\src\\middleware.ts",
                "/src/middleware.ts",
            ],
            ruleSet
        );
        expect(result.paths_checked).toBe(1);
        expect(result.hits).toHaveLength(1);
    });

    test("comma-separated lists split, but commas inside braces do not", () => {
        expect(splitPathList("src/a.ts, src/b.ts,src/c.ts")).toEqual([
            "src/a.ts",
            "src/b.ts",
            "src/c.ts",
        ]);
        expect(splitPathList("src/lib/{a,b}.ts,src/x.ts")).toEqual([
            "src/lib/{a,b}.ts",
            "src/x.ts",
        ]);
        expect(splitPathList(["src/a.ts,src/a.ts", "src/b.ts"])).toEqual([
            "src/a.ts",
            "src/b.ts",
        ]);
    });

    test("directory and glob entries expand and never silently lower risk", () => {
        const files = [
            "src/lib/razorpay/index.ts",
            "src/lib/razorpay/payment.ts",
            "src/example.ts",
        ];
        expect(expandEntries(["src/lib/razorpay"], files)).toEqual(
            expect.arrayContaining(files.slice(0, 2))
        );
        expect(expandEntries(["src/lib/razorpay/**"], files)).toEqual(
            expect.arrayContaining(files.slice(0, 2))
        );
        // a glob over a directory that has no files yet keeps its directory prefix
        const empty = expandEntries(["src/app/api/permission/**"], files);
        expect(empty).toContain("src/app/api/permission");
        expect(classifyPaths(empty, ruleSet).path_rule_risk).toBe("L3");
    });

    test("risk --paths accepts comma-separated directory-style input through the CLI", () => {
        const out = runCli(
            ["risk", "--paths", "src/example.ts, src/app/api/permission"],
            repoRoot
        );
        expect(out.exitCode).toBe(0);
        expect(JSON.parse(out.stdout.toString()).path_rule_risk).toBe("L3");
    });

    test("scope drift accepts a directory entry in the Affected surface", () => {
        const dir = makeRepo(undefined, (text) =>
            text.replace("- src/example.ts\n- src/example.test.ts", "- src/")
        );
        commitFiles(dir, changeFiles);
        const result = precheck({ repo: dir, id: "REN-CT1" });
        expect(check(result, "scope-drift").status).toBe("PASS");
        expect(check(result, "declared-but-untouched").status).toBe("PASS");
    });
});

describe("hardening 6: conditions", () => {
    const withConditions = (dir: string, review?: string) => {
        if (review !== undefined) writeFileSync(reviewPath(dir), review);
        return check(precheck({ repo: dir, id: "REN-CT1" }), "conditions");
    };

    test("COND-1 does not match COND-10", () => {
        const dir = makeRepo();
        commitFiles(dir, changeFiles);
        expect(withConditions(dir, "COND-10 was verified.\n").status).toBe(
            "FLAG"
        );
        expect(withConditions(dir, "COND-1 was verified.\n").status).toBe(
            "PASS"
        );
        expect(withConditions(dir, "see (COND-1) and COND-10\n").status).toBe(
            "PASS"
        );
        expect(withConditions(dir, "XCOND-1 is not it\n").status).toBe("FLAG");
    });

    test("the first pass is CANNOT_ESTABLISH with an explicit second-pass signal", () => {
        const dir = makeRepo();
        commitFiles(dir, changeFiles);
        const result = withConditions(dir);
        expect(result.status).toBe("CANNOT_ESTABLISH");
        expect(result.signal).toBe("SECOND_PASS_REQUIRED");
        expect(result.detail).toContain(
            "run precheck again after REVIEW.md is drafted"
        );
        const full = precheck({ repo: dir, id: "REN-CT1" });
        expect(full.incomplete).toBe(true);
    });

    test("a condition without an ID cannot be matched and is never a pass", () => {
        const dir = makeRepo(undefined, (text) =>
            text.replace("COND-1:", "Confirm:")
        );
        commitFiles(dir, changeFiles);
        expect(withConditions(dir, "Confirm the value.\n").status).toBe(
            "CANNOT_ESTABLISH"
        );
    });

    test("the second pass passes once REVIEW.md references every ID", () => {
        const dir = makeRepo();
        commitFiles(dir, changeFiles);
        const result = precheck({ repo: dir, id: "REN-CT1" });
        expect(check(result, "conditions").status).toBe("CANNOT_ESTABLISH");
        writeFileSync(reviewPath(dir), "COND-1: confirmed in writing.\n");
        const second = precheck({ repo: dir, id: "REN-CT1" });
        expect(check(second, "conditions").status).toBe("PASS");
        expect(second.incomplete).toBe(false);
    });
});

describe("hardening 7: launch packet safety", () => {
    const spec = readFileSync(join(baseFixtureDir, "SPEC.md"), "utf8");
    const base = () => loadBase();

    test("absent lists are MISSING; empty lists are NONE RECORDED", () => {
        const missing = base();
        delete missing.decisions;
        delete missing.dependencies;
        delete missing.test_expectations;
        delete missing.approval.design_blockers;
        const text = renderLaunch(missing, spec);
        expect(text).toContain("Open decisions: MISSING: decisions");
        expect(text).toContain("Dependencies: MISSING: dependencies");
        expect(text).toContain("Test expectations: MISSING: test_expectations");
        expect(text).toContain("Evidence required: MISSING: test_expectations");
        expect(text).toContain(
            "Known design blockers: MISSING: approval.design_blockers"
        );
        expect(text).not.toContain("Dependencies: none recorded");
        const empty = base();
        empty.decisions = [];
        empty.dependencies = [];
        empty.test_expectations = [];
        empty.approval.design_blockers = [];
        const emptyText = renderLaunch(empty, spec);
        expect(emptyText).toContain("Open decisions: NONE RECORDED");
        expect(emptyText).toContain("Dependencies: NONE RECORDED");
        expect(emptyText).toContain("Test expectations: NONE RECORDED");
        expect(emptyText).toContain("Known design blockers: NONE RECORDED");
    });

    test("an invalid or missing final risk is NOT TRUSTED and never shows READY as trustworthy", () => {
        for (const value of ["BOGUS", undefined]) {
            const contract = base();
            if (value === undefined) delete contract.risk.final_risk;
            else contract.risk.final_risk = value;
            const text = renderLaunch(contract, spec);
            expect(text).toContain("Readiness: NOT TRUSTED");
            expect(text).toContain("Raw task.status: READY_FOR_DEV");
            expect(text).not.toMatch(/^Readiness: READY_FOR_DEV/m);
        }
    });

    test("READY_FOR_DEV without an APPROVED approval is NOT TRUSTED; a valid contract is trusted", () => {
        const contract = base();
        contract.approval.state = "PENDING";
        expect(renderLaunch(contract, spec)).toContain(
            "Readiness: NOT TRUSTED"
        );
        expect(renderLaunch(base(), spec)).toMatch(
            /^Readiness: READY_FOR_DEV/m
        );
    });

    test("with an invalid risk level, rollback is treated as required", () => {
        const contract = base();
        contract.risk.final_risk = "BOGUS";
        const noRollback = spec.replace(
            /## Rollback[\s\S]*?(?=## Conditions)/,
            ""
        );
        expect(renderLaunch(contract, noRollback)).toContain(
            'SECTION MISSING: "Rollback"'
        );
    });

    test("headings inside code fences are not sections", () => {
        const fenced =
            "## What are we fixing?\n\nText\n\n```\n## Acceptance criteria\nfake criteria\n```\n\n~~~\n## Rollback\nfake rollback\n~~~\n";
        const sections = parseSections(fenced);
        expect(sections.has("acceptance criteria")).toBe(false);
        expect(sections.has("rollback")).toBe(false);
        expect(sections.get("what are we fixing")).toContain("fake criteria");
        const text = renderLaunch(base(), fenced);
        expect(text).toContain('SECTION MISSING: "Acceptance criteria"');
    });

    test("comma-separated surface lines keep every path", () => {
        const parsed = surfaceParse(
            "- src/a.ts, src/b.ts\n- `src/c/**`, src/d.ts — reason\n- src/{e,f}.ts\n- nothing"
        );
        expect(parsed.entries).toEqual([
            "src/a.ts",
            "src/b.ts",
            "src/c/**",
            "src/d.ts",
            "src/{e,f}.ts",
        ]);
        expect(parsed.skipped).toEqual(["nothing"]);
        const text = renderLaunch(
            base(),
            spec.replace(
                "- src/example.ts\n- src/example.test.ts",
                "- src/a.ts, src/b.ts\n- nothing"
            )
        );
        expect(text).toContain("- src/b.ts");
        expect(text).toContain("tokens not read as paths: nothing");
    });

    test("a source stamp is printed and launchFreshness detects a stale packet", () => {
        const yamlText = readFileSync(
            join(baseFixtureDir, "work-item.yaml"),
            "utf8"
        );
        const text = renderLaunch(base(), spec, yamlText);
        expect(text).toMatch(
            /^Source stamp: work-item\.yaml [0-9a-f]{12}, SPEC\.md [0-9a-f]{12}, compact-check launch v1$/m
        );
        expect(text).toContain(`Status semantics: ${STATUS_SEMANTICS}`);
        expect(launchFreshness(text, yamlText, spec).status).toBe("FRESH");
        expect(
            launchFreshness(text, yamlText, spec + "\nchanged\n").status
        ).toBe("STALE");
        expect(launchFreshness(text, yamlText + "# edit\n", spec).status).toBe(
            "STALE"
        );
        expect(launchFreshness(null, yamlText, spec).status).toBe("MISSING");
        expect(launchFreshness("# no stamp", yamlText, spec).status).toBe(
            "STALE"
        );
        // line endings do not change the stamp
        expect(
            launchFreshness(
                text,
                yamlText.replace(/\n/g, "\r\n"),
                spec.replace(/\n/g, "\r\n")
            ).status
        ).toBe("FRESH");
    });

    test("launch writes LAUNCH.md and --check reports FRESH then STALE (CLI)", () => {
        const dir = mkdtempSync(join(tmpdir(), "compact-launch-"));
        tempDirs.push(dir);
        cpSync(baseFixtureDir, dir, { recursive: true });
        const yamlFile = join(dir, "work-item.yaml");
        const wrote = runCli(["launch", yamlFile], repoRoot);
        expect(wrote.exitCode).toBe(0);
        expect(readFileSync(join(dir, "LAUNCH.md"), "utf8")).toContain(
            "the contract wins"
        );
        expect(runCli(["launch", yamlFile, "--check"], repoRoot).exitCode).toBe(
            0
        );
        writeFileSync(
            join(dir, "SPEC.md"),
            readFileSync(join(dir, "SPEC.md"), "utf8") + "\nMore.\n"
        );
        const stale = runCli(["launch", yamlFile, "--check"], repoRoot);
        expect(stale.exitCode).toBe(1);
        expect(JSON.parse(stale.stdout.toString()).status).toBe("STALE");
    });

    test("a CRLF SPEC.md parses the same as LF", () => {
        const lf = renderLaunch(base(), spec);
        const crlf = renderLaunch(base(), spec.replace(/\n/g, "\r\n"));
        expect(crlf.replace(/Source stamp:.*\n/, "")).toBe(
            lf.replace(/Source stamp:.*\n/, "")
        );
        expect(crlf).not.toMatch(/SECTION MISSING:/);
        const dir = makeRepo(undefined, (text) => text.replace(/\n/g, "\r\n"));
        commitFiles(dir, changeFiles);
        const result = precheck({ repo: dir, id: "REN-CT1" });
        expect(check(result, "scope-drift").status).toBe("PASS");
        expect(check(result, "conditions").signal).toBe("SECOND_PASS_REQUIRED");
    });
});

describe("hardening 8: status semantics", () => {
    test("every command output states the semantics and PASS is never given for an unestablished check", () => {
        const dir = makeRepo();
        commitFiles(dir, changeFiles);
        const result = precheck({ repo: dir, id: "REN-CT1" });
        expect(result.status_semantics).toBe(STATUS_SEMANTICS);
        expect(
            result.summary.pass +
                result.summary.flag +
                result.summary.cannot_establish
        ).toBe(result.checks.length);
        const risk = JSON.parse(
            runCli(
                ["risk", "--paths", "src/example.ts"],
                repoRoot
            ).stdout.toString()
        );
        expect(risk.status_semantics).toBe(STATUS_SEMANTICS);
        const budget = JSON.parse(
            runCli(
                ["budget", join(baseFixtureDir, "work-item.yaml")],
                repoRoot
            ).stdout.toString()
        );
        expect(budget.status_semantics).toBe(STATUS_SEMANTICS);
        expect(runCli([], repoRoot).stderr.toString()).toContain(
            "Status semantics"
        );
    });

    test("budget without a recorded investigated_areas list is CANNOT_ESTABLISH, not PASS", () => {
        const contract = loadBase();
        delete contract.investigation.investigated_areas;
        const result = budgetLint(contract, ruleSet, []);
        expect(result.status).toBe("CANNOT_ESTABLISH");
        expect(result.recorded_files).toBeNull();
    });

    test("--strict exits 1 on any FLAG or CANNOT_ESTABLISH and 0 otherwise", () => {
        const dir = makeRepo();
        commitFiles(dir, changeFiles);
        const relaxed = runCli(
            ["precheck", "--id", "REN-CT1", "--repo", dir],
            repoRoot
        );
        expect(relaxed.exitCode).toBe(0);
        const strict = runCli(
            ["precheck", "--id", "REN-CT1", "--repo", dir, "--strict"],
            repoRoot
        );
        expect(strict.exitCode).toBe(1);
        expect(JSON.parse(strict.stdout.toString()).incomplete).toBe(true);
        const clean = makeRepo(
            (c) => {
                c.investigation.investigated_areas = ["src/example.ts"];
            },
            (t) => t.replace(/\n## Conditions[\s\S]*$/, "\n")
        );
        commitFiles(clean, changeFiles);
        const ok = runCli(
            ["precheck", "--id", "REN-CT1", "--repo", clean, "--strict"],
            repoRoot
        );
        expect(
            JSON.parse(ok.stdout.toString()).checks.filter(
                (c: any) => c.status !== "PASS"
            )
        ).toEqual([]);
        expect(ok.exitCode).toBe(0);
    }, 60000);

    test("risk with no paths cannot establish and exits 2", () => {
        const out = runCli(["risk"], repoRoot);
        expect(out.exitCode).toBe(2);
        expect(out.stderr.toString()).toContain("CANNOT_ESTABLISH");
    });

    test("risk --verify reports a FLAG status when the recorded value is lowered", () => {
        const computed = classifyPaths(["src/middleware.ts"], ruleSet);
        expect(verifyContractRisk(loadBase(), computed).status).toBe("FLAG");
        const ok = loadBase();
        ok.risk.path_rule_risk = "L3";
        ok.risk.final_risk = "L3";
        expect(verifyContractRisk(ok, computed).status).toBe("PASS");
    });
});

describe("hardening 9: L3 trace check", () => {
    test("equivalent directory representations match the mandatory domain trace", () => {
        for (const area of [
            "src/lib/razorpay",
            "src/lib/razorpay/",
            "./src/lib/razorpay/",
            "src\\lib\\razorpay",
        ]) {
            const contract = loadBase();
            contract.risk.final_risk = "L3";
            contract.investigation.investigated_areas = [area];
            const result = budgetLint(contract, ruleSet, [
                "src/lib/razorpay/payment.ts",
            ]);
            expect(
                result.mandatory_domain_traces.find(
                    (t) => t.id === "trace:payment"
                )?.status
            ).toBe("PASS");
        }
    });

    test("duplicate areas that differ only by a trailing slash count once", () => {
        const contract = loadBase();
        contract.investigation.investigated_areas = [
            "src/a",
            "src/a/",
            "./src/a",
        ];
        expect(budgetLint(contract, ruleSet, []).recorded_files).toBe(1);
    });

    test("an unrelated investigated area still leaves the trace flagged", () => {
        const contract = loadBase();
        contract.risk.final_risk = "L3";
        contract.investigation.investigated_areas = ["src/components/ui"];
        const result = budgetLint(contract, ruleSet, [
            "src/lib/razorpay/payment.ts",
        ]);
        expect(
            result.mandatory_domain_traces.find((t) => t.id === "trace:payment")
                ?.status
        ).toBe("FLAG");
    });
});

describe("hardening 10: remaining untested paths", () => {
    test("risk --diff classifies the committed diff through the CLI", () => {
        const dir = makeRepo();
        commitFiles(dir, { "src/middleware.ts": "export {};\n" });
        const out = runCli(["risk", "--diff", "master..HEAD"], dir);
        expect(out.exitCode).toBe(0);
        const json = JSON.parse(out.stdout.toString());
        expect(json.path_rule_risk).toBe("L3");
        expect(json.domains).toContain("authn_authz");
        const bad = runCli(["risk", "--diff", "nope..HEAD"], dir);
        expect(bad.exitCode).toBe(2);
        expect(bad.stderr.toString()).toContain("UNRESOLVED_REF");
    });

    test("risk --diff --with-working-tree adds uncommitted paths", () => {
        const dir = makeRepo();
        commitFiles(dir, changeFiles);
        writeFileSync(join(dir, "src", "middleware.ts"), "export {};\n");
        expect(
            JSON.parse(
                runCli(
                    ["risk", "--diff", "master..HEAD"],
                    dir
                ).stdout.toString()
            ).path_rule_risk
        ).toBe("L1");
        expect(
            JSON.parse(
                runCli(
                    ["risk", "--diff", "master..HEAD", "--with-working-tree"],
                    dir
                ).stdout.toString()
            ).path_rule_risk
        ).toBe("L3");
    });

    test("risk --surface reads the SPEC.md Affected surface, including directories and commas", () => {
        const dir = mkdtempSync(join(tmpdir(), "compact-surface-"));
        tempDirs.push(dir);
        writeFileSync(
            join(dir, "SPEC.md"),
            "## What are we fixing?\n\nx\n\n## Affected surface\n\n- src/example.ts, src/app/api/permission\n"
        );
        git(["init", "-q", "-b", "master"], dir);
        const out = runCli(["risk", "--surface", join(dir, "SPEC.md")], dir);
        expect(out.exitCode).toBe(0);
        expect(JSON.parse(out.stdout.toString()).path_rule_risk).toBe("L3");
    });

    test("risk --verify from SPEC.md rejects a lowered path rule when the surface is a directory", () => {
        const dir = mkdtempSync(join(tmpdir(), "compact-verify-"));
        tempDirs.push(dir);
        cpSync(baseFixtureDir, dir, { recursive: true });
        writeFileSync(
            join(dir, "SPEC.md"),
            readFileSync(join(dir, "SPEC.md"), "utf8").replace(
                "- src/example.ts\n- src/example.test.ts",
                "- src/app/api/permission"
            )
        );
        git(["init", "-q", "-b", "master"], dir);
        const out = runCli(
            ["risk", "--verify", join(dir, "work-item.yaml")],
            dir
        );
        expect(out.exitCode).toBe(1);
        expect(
            JSON.parse(out.stdout.toString()).verification.problems.join(" ")
        ).toContain("never lower");
    });

    test("launch with missing fields renders and marks every gap (CLI)", () => {
        const dir = mkdtempSync(join(tmpdir(), "compact-missing-"));
        tempDirs.push(dir);
        writeFileSync(
            join(dir, "work-item.yaml"),
            'schema_version: "1.0"\ntask:\n  id: REN-X\n  title: Sparse\n'
        );
        const out = runCli(
            ["launch", join(dir, "work-item.yaml"), "--stdout"],
            repoRoot
        );
        expect(out.exitCode).toBe(0);
        const text = out.stdout.toString();
        expect(text).toContain("Readiness: NOT TRUSTED");
        expect(text).toContain("SECTION MISSING: SPEC.md was not found");
        expect(text).toContain("MISSING: decisions");
    });

    test("precheck CLI prints the JSON result for a throwaway repository", () => {
        const dir = makeRepo();
        commitFiles(dir, {
            "src/middleware.ts": "export {};\n",
            ...changeFiles,
        });
        const out = runCli(
            ["precheck", "--id", "REN-CT1", "--repo", dir],
            repoRoot
        );
        expect(out.exitCode).toBe(0);
        const json = JSON.parse(out.stdout.toString());
        expect(json.escalation.required).toBe(true);
        expect(
            json.checks.find((c: any) => c.id === "risk-escalation").status
        ).toBe("FLAG");
    });

    test("an existing test file listed in related_tests satisfies a REQUIRED expectation with a note", () => {
        const dir = makeRepo((contract) => {
            contract.investigation.related_tests = ["src/existing.test.ts"];
        });
        git(["checkout", "-q", "master"], dir);
        commitFiles(dir, { "src/existing.test.ts": "// existing\n" });
        git(["checkout", "-q", "feature/ren-ct1"], dir);
        git(["rebase", "-q", "master"], dir);
        commitFiles(dir, { "src/example.ts": "export const value = 2;\n" });
        const result = precheck({ repo: dir, id: "REN-CT1" });
        expect(check(result, "required-evidence").status).toBe("PASS");
        expect(check(result, "required-evidence").detail).toContain(
            "existing test file"
        );
    });

    test("a related_tests entry that does not exist does not satisfy the expectation", () => {
        const dir = makeRepo((contract) => {
            contract.investigation.related_tests = ["src/ghost.test.ts"];
        });
        commitFiles(dir, { "src/example.ts": "export const value = 2;\n" });
        expect(
            check(precheck({ repo: dir, id: "REN-CT1" }), "required-evidence")
                .status
        ).toBe("FLAG");
    });
});
