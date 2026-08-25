import { mkdtemp, rm } from "node:fs/promises";
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
});
