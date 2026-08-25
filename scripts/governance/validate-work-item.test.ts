import { mkdtempSync, rmSync, symlinkSync, writeFileSync } from "node:fs";
import { mkdtemp, rm, symlink } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, test } from "bun:test";
import { parse, stringify } from "yaml";
import { validateWorkItem, validateWorkItemFile } from "./validate-work-item";

const fixture = (name: string) =>
    `${import.meta.dir}/fixtures/${name}/work-item.yaml`;

async function loadValidFixture() {
    return parse(await Bun.file(fixture("valid-l2")).text());
}

function supportsFileSymlinks() {
    const directory = mkdtempSync(join(tmpdir(), "renivet-symlink-probe-"));
    try {
        writeFileSync(join(directory, "target"), "target");
        symlinkSync("target", join(directory, "link"), "file");
        return true;
    } catch (error) {
        if (
            error instanceof Error &&
            "code" in error &&
            ["EACCES", "EPERM", "UNKNOWN"].includes(String(error.code))
        ) {
            return false;
        }
        throw error;
    } finally {
        rmSync(directory, { recursive: true, force: true });
    }
}

const symlinkTest = supportsFileSymlinks() ? test : test.skip;

describe("governance work-item validation", () => {
    test("accepts a complete READY_FOR_DEV L2 contract", async () => {
        const result = await validateWorkItemFile(fixture("valid-l2"));
        expect(result).toEqual({ valid: true, errors: [] });
    });

    test("rejects an empty READY_FOR_DEV contract", async () => {
        const item = await loadValidFixture();
        item.requirements = [];
        item.scenarios = [];
        item.invariants = [];
        item.flows = [];
        item.test_expectations = [];
        item.traceability = {
            requirement_to_scenarios: [],
            scenario_to_invariants: [],
            scenario_to_test_expectations: [],
        };

        const result = validateWorkItem(item);
        expect(result.errors.map((error) => error.code)).toContain(
            "GOV-COMPLETENESS-001"
        );
    });

    test("rejects missing required record content and approval fields", async () => {
        const item = await loadValidFixture();
        item.requirements[0] = { id: "REQ-001" };
        delete item.approval.design_blockers;

        const result = validateWorkItem(item);
        const codes = result.errors.map((error) => error.code);
        expect(codes).toContain("GOV-SCHEMA-001");
        expect(codes).toContain("GOV-APPROVAL-001");
    });

    test("rejects final risk below the maximum risk input", async () => {
        const result = await validateWorkItemFile(fixture("invalid-risk"));
        expect(result.valid).toBeFalse();
        expect(result.errors.map((error) => error.code)).toContain(
            "GOV-RISK-001"
        );
    });

    test("rejects missing traceability targets", async () => {
        const result = await validateWorkItemFile(
            fixture("invalid-traceability")
        );
        expect(result.valid).toBeFalse();
        expect(result.errors.map((error) => error.code)).toContain(
            "GOV-TRACE-001"
        );
    });

    test("requires each scenario and invariant to participate in invariant traceability", async () => {
        const item = await loadValidFixture();
        item.traceability.scenario_to_invariants = [];

        const result = validateWorkItem(item);
        expect(result.errors.map((error) => error.code)).toContain(
            "GOV-TRACE-001"
        );
    });

    test("blocks READY_FOR_DEV with an unresolved human decision", async () => {
        const item = await loadValidFixture();
        item.decisions[0] = {
            ...item.decisions[0],
            class: "HUMAN_CONFIRMATION",
            status: "unresolved",
            consequence: "high",
            human_confirmation_required: true,
        };

        const result = validateWorkItem(item);
        expect(result.errors.map((error) => error.code)).toContain(
            "GOV-APPROVAL-001"
        );
    });

    test("requires human confirmation for high-consequence decisions regardless of confidence", async () => {
        const item = await loadValidFixture();
        item.decisions[0] = {
            ...item.decisions[0],
            confidence: "high",
            consequence: "high",
            human_confirmation_required: false,
        };

        const result = validateWorkItem(item);
        expect(result.errors.map((error) => error.code)).toContain(
            "GOV-DECISION-001"
        );
    });

    test("blocks READY_FOR_DEV when an L2 critic is incomplete", async () => {
        const item = await loadValidFixture();
        item.critic.completed = false;

        const result = validateWorkItem(item);
        expect(result.errors.map((error) => error.code)).toContain(
            "GOV-CRITIC-001"
        );
    });

    test("rejects an L2 Critic without independence attestation", async () => {
        const item = await loadValidFixture();
        item.critic = { required: true, completed: true, findings: [] };

        const result = validateWorkItem(item);
        expect(result.errors.map((error) => error.code)).toContain(
            "GOV-CRITIC-001"
        );
    });

    test("rejects a Critic artifact path that escapes the work-item folder", async () => {
        const item = await loadValidFixture();
        item.critic.artifact = "../README.md";

        const result = validateWorkItem(item);
        expect(result.errors.map((error) => error.code)).toContain(
            "GOV-CRITIC-001"
        );
    });

    test("does not impose an L2/L3 Critic on an L1 work item", async () => {
        const item = await loadValidFixture();
        item.risk = {
            initial_risk: "L1",
            path_rule_risk: "L1",
            semantic_risk: "L1",
            final_risk: "L1",
        };
        item.critic = { required: false, completed: false };

        const result = validateWorkItem(item);
        expect(result.errors.map((error) => error.code)).not.toContain(
            "GOV-CRITIC-001"
        );
    });

    test("rejects duplicate stable IDs and missing test reasons", async () => {
        const item = await loadValidFixture();
        item.test_expectations.push({
            ...item.test_expectations[0],
            reason: "",
        });

        const result = validateWorkItem(item);
        const codes = result.errors.map((error) => error.code);
        expect(codes).toContain("GOV-ID-001");
        expect(codes).toContain("GOV-TEST-001");
    });

    test("rejects a work item whose recorded branch differs from CI", async () => {
        const item = await loadValidFixture();
        const result = validateWorkItem(item, {
            branch: "feature/another-task",
        });

        expect(result.errors.map((error) => error.code)).toContain(
            "GOV-BRANCH-001"
        );
    });

    test("requires an implementation review result", async () => {
        const item = await loadValidFixture();
        delete item.implementation_review.result;

        const result = validateWorkItem(item);
        expect(result.errors.map((error) => error.code)).toContain(
            "GOV-REVIEW-001"
        );
    });

    test("rejects a present non-object implementation review", async () => {
        for (const implementationReview of [null, "invalid", []]) {
            const item = await loadValidFixture();
            item.implementation_review = implementationReview;

            const result = validateWorkItem(item);
            expect(result.errors).toContainEqual(
                expect.objectContaining({
                    code: "GOV-REVIEW-001",
                    path: "implementation_review",
                })
            );
        }
    });

    test("requires an implementation review base commit", async () => {
        const item = await loadValidFixture();
        delete item.implementation_review.base_commit;

        const result = validateWorkItem(item);
        expect(result.errors.map((error) => error.code)).toContain(
            "GOV-REVIEW-001"
        );
    });

    test("requires an implementation review head commit", async () => {
        const item = await loadValidFixture();
        delete item.implementation_review.head_commit;

        const result = validateWorkItem(item);
        expect(result.errors.map((error) => error.code)).toContain(
            "GOV-REVIEW-001"
        );
    });

    test("allows unavailable commits only for a blocked review", async () => {
        const item = await loadValidFixture();
        item.implementation_review.result = "REVIEW_BLOCKED";
        item.implementation_review.base_commit = null;
        item.implementation_review.head_commit = null;
        item.implementation_review.reconciliation.scope = "PARTIAL";
        item.implementation_review.blocking_findings = [
            "The comparison base commit is unavailable.",
        ];
        item.implementation_review.evidence = [
            "Comparison input unavailable: base and head commits could not be resolved.",
        ];

        const result = validateWorkItem(item);
        expect(result).toEqual({ valid: true, errors: [] });
    });

    test("accepts a required action as the blocked-review condition", async () => {
        const item = await loadValidFixture();
        item.implementation_review.result = "REVIEW_BLOCKED";
        item.implementation_review.base_commit = null;
        item.implementation_review.head_commit = null;
        item.implementation_review.reconciliation.scope = "PARTIAL";
        item.implementation_review.required_actions = [
            "Provide the unavailable comparison base.",
        ];
        item.implementation_review.evidence = [
            "Comparison input unavailable: the base commit could not be resolved.",
        ];

        const result = validateWorkItem(item);
        expect(result).toEqual({ valid: true, errors: [] });
    });

    test("rejects SHA commits for a blocked review", async () => {
        const item = await loadValidFixture();
        item.implementation_review.result = "REVIEW_BLOCKED";
        item.implementation_review.reconciliation.scope = "PARTIAL";
        item.implementation_review.blocking_findings = [
            "The comparison input is unavailable.",
        ];
        item.implementation_review.evidence = [
            "Comparison input unavailable: the required comparison could not be completed.",
        ];

        const result = validateWorkItem(item);
        expect(result.errors).toEqual(
            expect.arrayContaining([
                expect.objectContaining({
                    code: "GOV-REVIEW-001",
                    path: "implementation_review.base_commit",
                }),
                expect.objectContaining({
                    code: "GOV-REVIEW-001",
                    path: "implementation_review.head_commit",
                }),
            ])
        );
    });

    for (const completedResult of [
        "REVIEW_PASSED",
        "REVIEW_PASSED_WITH_FINDINGS",
        "REVIEW_FAILED",
    ]) {
        test(`requires SHA40 commits for ${completedResult}`, async () => {
            const item = await loadValidFixture();
            item.task.status = "IN_REVIEW";
            item.implementation_review.result = completedResult;
            item.implementation_review.base_commit = null;
            item.implementation_review.head_commit = null;

            const result = validateWorkItem(item);
            expect(result.errors).toEqual(
                expect.arrayContaining([
                    expect.objectContaining({
                        code: "GOV-REVIEW-001",
                        path: "implementation_review.base_commit",
                    }),
                    expect.objectContaining({
                        code: "GOV-REVIEW-001",
                        path: "implementation_review.head_commit",
                    }),
                ])
            );
        });
    }

    test("requires implementation review reconciliation", async () => {
        const item = await loadValidFixture();
        delete item.implementation_review.reconciliation;

        const result = validateWorkItem(item);
        expect(result.errors.map((error) => error.code)).toContain(
            "GOV-REVIEW-001"
        );
    });

    test("rejects an unknown implementation review result", async () => {
        const item = await loadValidFixture();
        item.implementation_review.result = "REVIEW_UNKNOWN";

        const result = validateWorkItem(item);
        expect(result.errors.map((error) => error.code)).toContain(
            "GOV-REVIEW-001"
        );
    });

    test("rejects an unknown implementation review reconciliation result", async () => {
        const item = await loadValidFixture();
        item.implementation_review.reconciliation.security = "UNKNOWN";

        const result = validateWorkItem(item);
        expect(result.errors.map((error) => error.code)).toContain(
            "GOV-REVIEW-001"
        );
    });

    for (const reconciliationResult of ["FAIL", "PARTIAL"]) {
        test(`rejects a passed review with a ${reconciliationResult} reconciliation result`, async () => {
            const item = await loadValidFixture();
            item.implementation_review.reconciliation.security =
                reconciliationResult;

            const result = validateWorkItem(item);
            expect(result.errors).toContainEqual(
                expect.objectContaining({
                    code: "GOV-REVIEW-001",
                    path: "implementation_review.reconciliation",
                })
            );
        });
    }

    test("rejects material drift for a review passed with findings", async () => {
        const item = await loadValidFixture();
        item.task.status = "IN_REVIEW";
        item.implementation_review.result = "REVIEW_PASSED_WITH_FINDINGS";
        item.implementation_review.material_drift = "MATERIAL_DRIFT";
        item.implementation_review.governance_reentry_required = true;

        const result = validateWorkItem(item);
        expect(result.errors).toContainEqual(
            expect.objectContaining({
                code: "GOV-REVIEW-001",
                path: "implementation_review.result",
            })
        );
    });

    test("requires a finding condition for a review passed with findings", async () => {
        const item = await loadValidFixture();
        item.implementation_review.result = "REVIEW_PASSED_WITH_FINDINGS";

        const result = validateWorkItem(item);
        expect(result.errors).toContainEqual(
            expect.objectContaining({
                code: "GOV-REVIEW-001",
                path: "implementation_review.result",
            })
        );
    });

    for (const findingCondition of [
        "required action",
        "partial reconciliation",
        "minor drift",
    ]) {
        test(`accepts ${findingCondition} for a review passed with findings`, async () => {
            const item = await loadValidFixture();
            item.implementation_review.result = "REVIEW_PASSED_WITH_FINDINGS";
            if (findingCondition === "required action") {
                item.implementation_review.required_actions = [
                    "Address the non-blocking coverage gap.",
                ];
            } else if (findingCondition === "partial reconciliation") {
                item.implementation_review.reconciliation.test_coverage =
                    "PARTIAL";
            } else {
                item.implementation_review.material_drift = "MINOR_DRIFT";
            }

            const result = validateWorkItem(item);
            expect(result).toEqual({ valid: true, errors: [] });
        });
    }

    test("rejects a failed reconciliation for a review passed with findings", async () => {
        const item = await loadValidFixture();
        item.implementation_review.result = "REVIEW_PASSED_WITH_FINDINGS";
        item.implementation_review.reconciliation.security = "FAIL";

        const result = validateWorkItem(item);
        expect(result.errors).toContainEqual(
            expect.objectContaining({
                code: "GOV-REVIEW-001",
                path: "implementation_review.reconciliation",
            })
        );
    });

    test("rejects a blocking finding for a review passed with findings", async () => {
        const item = await loadValidFixture();
        item.implementation_review.result = "REVIEW_PASSED_WITH_FINDINGS";
        item.implementation_review.blocking_findings = [
            "The authorization requirement failed.",
        ];

        const result = validateWorkItem(item);
        expect(result.errors).toContainEqual(
            expect.objectContaining({
                code: "GOV-REVIEW-001",
                path: "implementation_review.blocking_findings",
            })
        );
    });

    test("requires a failure condition for a failed review", async () => {
        const item = await loadValidFixture();
        item.implementation_review.result = "REVIEW_FAILED";

        const result = validateWorkItem(item);
        expect(result.errors).toContainEqual(
            expect.objectContaining({
                code: "GOV-REVIEW-001",
                path: "implementation_review.result",
            })
        );
    });

    test("rejects a partial-only failed review", async () => {
        const item = await loadValidFixture();
        item.implementation_review.result = "REVIEW_FAILED";
        item.implementation_review.reconciliation.test_coverage = "PARTIAL";

        const result = validateWorkItem(item);
        expect(result.errors).toContainEqual(
            expect.objectContaining({
                code: "GOV-REVIEW-001",
                path: "implementation_review.result",
            })
        );
    });

    for (const failureCondition of [
        "failed reconciliation",
        "blocking finding",
        "material drift",
    ]) {
        test(`accepts ${failureCondition} for a failed review`, async () => {
            const item = await loadValidFixture();
            item.task.status = "IN_REVIEW";
            item.implementation_review.result = "REVIEW_FAILED";
            if (failureCondition === "failed reconciliation") {
                item.implementation_review.reconciliation.security = "FAIL";
            } else if (failureCondition === "blocking finding") {
                item.implementation_review.blocking_findings = [
                    "The authorization requirement failed.",
                ];
            } else {
                item.implementation_review.material_drift = "MATERIAL_DRIFT";
                item.implementation_review.governance_reentry_required = true;
            }

            const result = validateWorkItem(item);
            expect(result).toEqual({ valid: true, errors: [] });
        });
    }

    test("rejects an all-pass blocked review with no blocker", async () => {
        const item = await loadValidFixture();
        item.implementation_review.result = "REVIEW_BLOCKED";
        item.implementation_review.base_commit = null;
        item.implementation_review.head_commit = null;
        item.implementation_review.evidence = [
            "Comparison input unavailable: the base commit could not be resolved.",
        ];

        const result = validateWorkItem(item);
        expect(result.errors).toEqual(
            expect.arrayContaining([
                expect.objectContaining({
                    code: "GOV-REVIEW-001",
                    path: "implementation_review.reconciliation",
                }),
                expect.objectContaining({
                    code: "GOV-REVIEW-001",
                    path: "implementation_review",
                }),
            ])
        );
    });

    test("requires a blocker or action for a blocked review", async () => {
        const item = await loadValidFixture();
        item.implementation_review.result = "REVIEW_BLOCKED";
        item.implementation_review.base_commit = null;
        item.implementation_review.head_commit = null;
        item.implementation_review.reconciliation.scope = "PARTIAL";
        item.implementation_review.evidence = [
            "Comparison input unavailable: the base commit could not be resolved.",
        ];

        const result = validateWorkItem(item);
        expect(result.errors).toContainEqual(
            expect.objectContaining({
                code: "GOV-REVIEW-001",
                path: "implementation_review",
            })
        );
    });

    test("requires explicit unavailable-input evidence for null blocked commits", async () => {
        const item = await loadValidFixture();
        item.implementation_review.result = "REVIEW_BLOCKED";
        item.implementation_review.base_commit = null;
        item.implementation_review.head_commit = null;
        item.implementation_review.reconciliation.scope = "PARTIAL";
        item.implementation_review.blocking_findings = [
            "The comparison base commit is unavailable.",
        ];
        item.implementation_review.evidence = ["Review could not proceed."];

        const result = validateWorkItem(item);
        expect(result.errors).toContainEqual(
            expect.objectContaining({
                code: "GOV-REVIEW-001",
                path: "implementation_review.evidence",
            })
        );
    });

    test("rejects a failed reconciliation for a blocked review", async () => {
        const item = await loadValidFixture();
        item.implementation_review.result = "REVIEW_BLOCKED";
        item.implementation_review.base_commit = null;
        item.implementation_review.head_commit = null;
        item.implementation_review.reconciliation.scope = "PARTIAL";
        item.implementation_review.reconciliation.security = "FAIL";
        item.implementation_review.blocking_findings = [
            "The comparison base commit is unavailable.",
        ];
        item.implementation_review.evidence = [
            "Comparison input unavailable: the base commit could not be resolved.",
        ];

        const result = validateWorkItem(item);
        expect(result.errors).toContainEqual(
            expect.objectContaining({
                code: "GOV-REVIEW-001",
                path: "implementation_review.reconciliation",
            })
        );
    });

    test("requires a failed review result for material drift", async () => {
        const item = await loadValidFixture();
        item.task.status = "IN_REVIEW";
        item.implementation_review.result = "REVIEW_BLOCKED";
        item.implementation_review.material_drift = "MATERIAL_DRIFT";
        item.implementation_review.governance_reentry_required = true;

        const result = validateWorkItem(item);
        expect(result.errors).toContainEqual(
            expect.objectContaining({
                code: "GOV-DRIFT-001",
                path: "implementation_review.result",
            })
        );
    });

    test("rejects governance re-entry for non-material drift", async () => {
        const item = await loadValidFixture();
        item.task.status = "IN_REVIEW";
        item.implementation_review.result = "REVIEW_PASSED_WITH_FINDINGS";
        item.implementation_review.material_drift = "MINOR_DRIFT";
        item.implementation_review.governance_reentry_required = true;

        const result = validateWorkItem(item);
        expect(result.errors).toContainEqual(
            expect.objectContaining({
                code: "GOV-DRIFT-001",
                path: "implementation_review.governance_reentry_required",
            })
        );
    });

    test("rejects a passed review with blocking findings", async () => {
        const item = await loadValidFixture();
        item.implementation_review.blocking_findings = [
            "Authorization behavior changed.",
        ];

        const result = validateWorkItem(item);
        expect(result.errors.map((error) => error.code)).toContain(
            "GOV-REVIEW-001"
        );
    });

    test("rejects a passed review with required actions", async () => {
        const item = await loadValidFixture();
        item.implementation_review.required_actions = [
            "Restore the approved authorization boundary.",
        ];

        const result = validateWorkItem(item);
        expect(result.errors.map((error) => error.code)).toContain(
            "GOV-REVIEW-001"
        );
    });

    test("rejects a passed review with material drift", async () => {
        const item = await loadValidFixture();
        item.implementation_review.material_drift = "MATERIAL_DRIFT";

        const result = validateWorkItem(item);
        expect(result.errors.map((error) => error.code)).toContain(
            "GOV-REVIEW-001"
        );
    });

    test("requires governance re-entry for material drift when the task is non-ready", async () => {
        const item = await loadValidFixture();
        item.task.status = "IN_REVIEW";
        item.implementation_review.classification = "NO_DRIFT";
        item.implementation_review.material_drift = "MATERIAL_DRIFT";
        item.implementation_review.governance_reentry_required = false;

        const result = validateWorkItem(item);
        expect(result.errors).toContainEqual(
            expect.objectContaining({
                code: "GOV-DRIFT-001",
                path: "implementation_review.governance_reentry_required",
            })
        );
    });

    test("requires a non-ready task state for material drift after governance re-entry", async () => {
        const item = await loadValidFixture();
        item.implementation_review.classification = "NO_DRIFT";
        item.implementation_review.material_drift = "MATERIAL_DRIFT";
        item.implementation_review.governance_reentry_required = true;

        const result = validateWorkItem(item);
        expect(result.errors).toContainEqual(
            expect.objectContaining({
                code: "GOV-DRIFT-001",
                path: "implementation_review",
            })
        );
    });

    test("requires a safe task-local REVIEW.md artifact", async () => {
        const item = await loadValidFixture();
        item.implementation_review.artifact = "../REVIEW.md";

        const result = validateWorkItem(item);
        expect(result.errors.map((error) => error.code)).toContain(
            "GOV-REVIEW-001"
        );
    });

    test("requires the REVIEW.md artifact to exist as a task-local file", async () => {
        const directory = await mkdtemp(join(tmpdir(), "renivet-review-"));
        const item = await loadValidFixture();
        item.implementation_review.artifact = "MISSING.md";

        try {
            await Bun.write(join(directory, "work-item.yaml"), stringify(item));
            await Bun.write(
                join(directory, "CRITIQUE.md"),
                await Bun.file(
                    `${import.meta.dir}/fixtures/valid-l2/CRITIQUE.md`
                ).text()
            );

            const result = await validateWorkItemFile(directory);
            expect(result.errors.map((error) => error.code)).toContain(
                "GOV-REVIEW-001"
            );
        } finally {
            await rm(directory, { recursive: true, force: true });
        }
    });

    test("rejects a review artifact through a parent link outside the work-item folder", async () => {
        const directory = await mkdtemp(join(tmpdir(), "renivet-review-"));
        const outsideDirectory = await mkdtemp(
            join(tmpdir(), "renivet-review-outside-")
        );
        const item = await loadValidFixture();
        item.implementation_review.artifact = "linked-directory/REVIEW.md";

        try {
            await Bun.write(join(directory, "work-item.yaml"), stringify(item));
            await Bun.write(
                join(directory, "CRITIQUE.md"),
                await Bun.file(
                    `${import.meta.dir}/fixtures/valid-l2/CRITIQUE.md`
                ).text()
            );
            await Bun.write(
                join(outsideDirectory, "REVIEW.md"),
                "# Review outside the work-item folder\n"
            );
            await symlink(
                outsideDirectory,
                join(directory, "linked-directory"),
                process.platform === "win32" ? "junction" : "dir"
            );

            const result = await validateWorkItemFile(directory);
            expect(result.errors).toContainEqual(
                expect.objectContaining({
                    code: "GOV-REVIEW-001",
                    path: "implementation_review.artifact",
                })
            );
        } finally {
            await rm(directory, { recursive: true, force: true });
            await rm(outsideDirectory, { recursive: true, force: true });
        }
    });

    symlinkTest("rejects a task-local review artifact symlink", async () => {
        const directory = await mkdtemp(join(tmpdir(), "renivet-review-"));
        const item = await loadValidFixture();

        try {
            await Bun.write(join(directory, "work-item.yaml"), stringify(item));
            await Bun.write(
                join(directory, "CRITIQUE.md"),
                await Bun.file(
                    `${import.meta.dir}/fixtures/valid-l2/CRITIQUE.md`
                ).text()
            );
            await Bun.write(
                join(directory, "REVIEW_TARGET.md"),
                "# Review outside the declared artifact entry\n"
            );
            await symlink(
                "REVIEW_TARGET.md",
                join(directory, "REVIEW.md"),
                "file"
            );

            const result = await validateWorkItemFile(directory);
            expect(result.errors).toContainEqual(
                expect.objectContaining({
                    code: "GOV-REVIEW-001",
                    path: "implementation_review.artifact",
                })
            );
        } finally {
            await rm(directory, { recursive: true, force: true });
        }
    });
});
