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
    criticFocusFor,
    git,
    globToRegExp,
    loadRules,
    parseSections,
    precheck,
    renderLaunch,
    surfaceGlobs,
    verifyContractRisk,
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
