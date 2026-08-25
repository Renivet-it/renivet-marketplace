import { describe, expect, test } from "bun:test";
import { parse } from "yaml";
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

    test("forces governance re-entry for material implementation drift", async () => {
        const item = await loadValidFixture();
        item.implementation_review = {
            classification: "MATERIAL_DRIFT",
            governance_reentry_required: true,
            evidence: ["Changed authentication boundary"],
        };

        const result = validateWorkItem(item);
        expect(result.errors.map((error) => error.code)).toContain(
            "GOV-DRIFT-001"
        );
    });
});
