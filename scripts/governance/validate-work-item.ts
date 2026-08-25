import { stat } from "node:fs/promises";
import { dirname, isAbsolute, resolve } from "node:path";
import { parse } from "yaml";
import {
    IMPLEMENTATION_DRIFT_LEVELS,
    RECONCILIATION_RESULTS,
    REVIEW_RESULTS,
    RISK_LEVELS,
    TEST_CATEGORIES,
    TEST_CLASSIFICATIONS,
    WORK_ITEM_STATES,
    type RiskLevel,
    type UnknownRecord,
    type ValidationError,
    type ValidationResult,
} from "./work-item-schema";

const ID_PREFIXES: Record<string, string> = {
    requirements: "REQ-",
    scenarios: "SCN-",
    invariants: "INV-",
    flows: "FLOW-",
    dependencies: "DEP-",
    integrations: "INT-",
    personas: "PER-",
    security_boundaries: "SEC-",
    business_rules: "BR-",
    decisions: "DEC-",
    test_expectations: "TEXP-",
};

const REQUIRED_ARRAYS = Object.keys(ID_PREFIXES);
const CRITIC_CATEGORIES = [
    "requirements_scenarios",
    "failure_recovery",
    "security_privacy",
    "state_data_consistency",
    "integrations_idempotency",
    "compatibility_migration",
    "observability_testability",
    "assumptions_dependencies",
];

function isRecord(value: unknown): value is UnknownRecord {
    return typeof value === "object" && value !== null && !Array.isArray(value);
}

function asRecords(value: unknown): UnknownRecord[] {
    return Array.isArray(value) ? value.filter(isRecord) : [];
}

function asStrings(value: unknown): string[] {
    return Array.isArray(value)
        ? value.filter((entry): entry is string => typeof entry === "string")
        : [];
}

function riskIndex(value: unknown): number {
    return RISK_LEVELS.indexOf(value as RiskLevel);
}

function add(
    errors: ValidationError[],
    code: string,
    path: string,
    message: string
) {
    errors.push({ code, path, message });
}

function requireString(
    value: unknown,
    path: string,
    errors: ValidationError[]
) {
    if (typeof value !== "string" || value.trim() === "") {
        add(errors, "GOV-SCHEMA-001", path, "A non-empty string is required.");
    }
}

function validateIds(item: UnknownRecord, errors: ValidationError[]) {
    for (const [collection, prefix] of Object.entries(ID_PREFIXES)) {
        const seen = new Set<string>();
        for (const [index, entry] of asRecords(item[collection]).entries()) {
            const id = entry.id;
            const path = `${collection}[${index}].id`;
            if (typeof id !== "string" || !id.startsWith(prefix)) {
                add(
                    errors,
                    "GOV-ID-001",
                    path,
                    `ID must start with ${prefix}.`
                );
            } else if (seen.has(id)) {
                add(errors, "GOV-ID-001", path, `Duplicate ID ${id}.`);
            } else {
                seen.add(id);
            }
        }
    }
}

function requireArray(
    value: unknown,
    path: string,
    errors: ValidationError[],
    code = "GOV-SCHEMA-001"
) {
    if (!Array.isArray(value)) {
        add(errors, code, path, "An array is required.");
    }
}

function requireReviewString(
    value: unknown,
    path: string,
    errors: ValidationError[]
) {
    if (typeof value !== "string" || !value.trim()) {
        add(errors, "GOV-REVIEW-001", path, "A non-empty string is required.");
    }
}

function requireReviewStringArray(
    value: unknown,
    path: string,
    errors: ValidationError[],
    nonEmpty = false
) {
    if (
        !Array.isArray(value) ||
        (nonEmpty && value.length === 0) ||
        value.some(
            (entry) => typeof entry !== "string" || !entry.trim()
        )
    ) {
        add(
            errors,
            "GOV-REVIEW-001",
            path,
            nonEmpty
                ? "A non-empty array of non-empty strings is required."
                : "An array of non-empty strings is required."
        );
    }
}

function isSafeWorkItemArtifact(value: unknown): value is string {
    if (typeof value !== "string" || !value.trim() || isAbsolute(value)) {
        return false;
    }

    if (/^[a-zA-Z]:/.test(value)) {
        return false;
    }

    return value
        .split(/[\\/]+/)
        .every((segment) => segment && segment !== "." && segment !== "..");
}

function validateRecordContent(item: UnknownRecord, errors: ValidationError[]) {
    const stringFields: Record<string, string[]> = {
        requirements: ["description", "type"],
        scenarios: ["description"],
        invariants: ["description"],
        flows: ["description"],
        dependencies: ["description", "status"],
        integrations: ["system", "purpose"],
        personas: ["role", "applicability"],
        security_boundaries: ["description"],
        business_rules: ["description"],
        decisions: [
            "question",
            "class",
            "status",
            "recommendation",
            "confidence",
            "consequence",
        ],
    };

    for (const [collection, fields] of Object.entries(stringFields)) {
        for (const [index, entry] of asRecords(item[collection]).entries()) {
            for (const field of fields) {
                requireString(
                    entry[field],
                    `${collection}[${index}].${field}`,
                    errors
                );
            }
        }
    }

    for (const [index, flow] of asRecords(item.flows).entries()) {
        requireArray(
            flow.state_transitions,
            `flows[${index}].state_transitions`,
            errors
        );
    }
}

function ids(item: UnknownRecord, collection: string): Set<string> {
    return new Set(
        asRecords(item[collection])
            .map((entry) => entry.id)
            .filter((id): id is string => typeof id === "string")
    );
}

function requireReferences(
    values: string[],
    targets: Set<string>,
    path: string,
    errors: ValidationError[]
) {
    for (const value of values) {
        if (!targets.has(value)) {
            add(errors, "GOV-TRACE-001", path, `Unknown reference ${value}.`);
        }
    }
}

function validateTraceability(item: UnknownRecord, errors: ValidationError[]) {
    const requirementIds = ids(item, "requirements");
    const scenarioIds = ids(item, "scenarios");
    const invariantIds = ids(item, "invariants");
    const expectationIds = ids(item, "test_expectations");

    for (const [index, scenario] of asRecords(item.scenarios).entries()) {
        const refs = asStrings(scenario.requirement_ids);
        if (refs.length === 0) {
            add(
                errors,
                "GOV-TRACE-001",
                `scenarios[${index}].requirement_ids`,
                "Every scenario must reference at least one requirement."
            );
        }
        requireReferences(
            refs,
            requirementIds,
            `scenarios[${index}].requirement_ids`,
            errors
        );
    }

    const trace = isRecord(item.traceability) ? item.traceability : {};
    const requirementLinks = asRecords(trace.requirement_to_scenarios);
    const invariantLinks = asRecords(trace.scenario_to_invariants);
    const testLinks = asRecords(trace.scenario_to_test_expectations);

    for (const [index, link] of requirementLinks.entries()) {
        requireReferences(
            asStrings(link.requirement_id ? [link.requirement_id] : []),
            requirementIds,
            `traceability.requirement_to_scenarios[${index}].requirement_id`,
            errors
        );
        requireReferences(
            asStrings(link.scenario_ids),
            scenarioIds,
            `traceability.requirement_to_scenarios[${index}].scenario_ids`,
            errors
        );
    }

    for (const requirementId of requirementIds) {
        const linked = requirementLinks.some(
            (link) =>
                link.requirement_id === requirementId &&
                asStrings(link.scenario_ids).length > 0
        );
        if (!linked) {
            add(
                errors,
                "GOV-TRACE-001",
                "traceability.requirement_to_scenarios",
                `${requirementId} has no scenario trace.`
            );
        }
    }

    for (const [index, link] of invariantLinks.entries()) {
        requireReferences(
            asStrings(link.scenario_id ? [link.scenario_id] : []),
            scenarioIds,
            `traceability.scenario_to_invariants[${index}].scenario_id`,
            errors
        );
        requireReferences(
            asStrings(link.invariant_ids),
            invariantIds,
            `traceability.scenario_to_invariants[${index}].invariant_ids`,
            errors
        );
    }

    for (const [index, link] of testLinks.entries()) {
        requireReferences(
            asStrings(link.scenario_id ? [link.scenario_id] : []),
            scenarioIds,
            `traceability.scenario_to_test_expectations[${index}].scenario_id`,
            errors
        );
        const refs = asStrings(link.test_expectation_ids);
        if (refs.length === 0) {
            add(
                errors,
                "GOV-TRACE-001",
                `traceability.scenario_to_test_expectations[${index}]`,
                "Every scenario trace needs a test expectation."
            );
        }
        requireReferences(
            refs,
            expectationIds,
            `traceability.scenario_to_test_expectations[${index}].test_expectation_ids`,
            errors
        );
    }

    for (const scenarioId of scenarioIds) {
        if (!testLinks.some((link) => link.scenario_id === scenarioId)) {
            add(
                errors,
                "GOV-TRACE-001",
                "traceability.scenario_to_test_expectations",
                `${scenarioId} has no test-expectation trace.`
            );
        }
    }

    const finalRisk = isRecord(item.risk)
        ? riskIndex(item.risk.final_risk)
        : -1;
    if (finalRisk > 0) {
        for (const scenarioId of scenarioIds) {
            if (
                !invariantLinks.some((link) => link.scenario_id === scenarioId)
            ) {
                add(
                    errors,
                    "GOV-TRACE-001",
                    "traceability.scenario_to_invariants",
                    `${scenarioId} has no invariant trace.`
                );
            }
        }
        for (const invariantId of invariantIds) {
            if (
                !invariantLinks.some((link) =>
                    asStrings(link.invariant_ids).includes(invariantId)
                )
            ) {
                add(
                    errors,
                    "GOV-TRACE-001",
                    "traceability.scenario_to_invariants",
                    `${invariantId} has no scenario trace.`
                );
            }
        }
    }
}

export interface ValidationContext {
    branch?: string;
}

export function validateWorkItem(
    value: unknown,
    context: ValidationContext = {}
): ValidationResult {
    const errors: ValidationError[] = [];
    if (!isRecord(value)) {
        return {
            valid: false,
            errors: [
                {
                    code: "GOV-SCHEMA-001",
                    path: "$",
                    message: "Work item must be a YAML object.",
                },
            ],
        };
    }

    if (value.schema_version !== "1.0") {
        add(
            errors,
            "GOV-SCHEMA-001",
            "schema_version",
            'Supported schema version is "1.0".'
        );
    }

    const task = isRecord(value.task) ? value.task : {};
    requireString(task.id, "task.id", errors);
    requireString(task.title, "task.title", errors);
    requireString(task.source, "task.source", errors);
    requireString(task.branch, "task.branch", errors);
    if (
        context.branch &&
        typeof task.branch === "string" &&
        task.branch !== context.branch
    ) {
        add(
            errors,
            "GOV-BRANCH-001",
            "task.branch",
            `Recorded branch ${task.branch} does not match ${context.branch}.`
        );
    }
    if (!WORK_ITEM_STATES.includes(task.status as never)) {
        add(errors, "GOV-STATE-001", "task.status", "Invalid lifecycle state.");
    }

    for (const collection of REQUIRED_ARRAYS) {
        if (!Array.isArray(value[collection])) {
            add(
                errors,
                "GOV-SCHEMA-001",
                collection,
                "Required collection must be an array."
            );
        }
    }

    const risk = isRecord(value.risk) ? value.risk : {};
    const riskFields = [
        "initial_risk",
        "path_rule_risk",
        "semantic_risk",
        "final_risk",
    ];
    const levels = riskFields.map((field) => riskIndex(risk[field]));
    for (const [index, level] of levels.entries()) {
        if (level < 0) {
            add(
                errors,
                "GOV-RISK-001",
                `risk.${riskFields[index]}`,
                "Risk must be L0, L1, L2, or L3."
            );
        }
    }
    if (levels.every((level) => level >= 0)) {
        const expected = Math.max(levels[0], levels[1], levels[2]);
        if (levels[3] !== expected) {
            add(
                errors,
                "GOV-RISK-001",
                "risk.final_risk",
                `Final risk must equal MAX(initial, path-rule, semantic) = ${RISK_LEVELS[expected]}.`
            );
        }
    }

    validateIds(value, errors);
    validateRecordContent(value, errors);
    validateTraceability(value, errors);

    const finalRisk = riskIndex(risk.final_risk);
    if (finalRisk > 0 && asRecords(value.test_expectations).length === 0) {
        add(
            errors,
            "GOV-TEST-001",
            "test_expectations",
            "Non-L0 work requires test expectations."
        );
    }
    for (const [index, expectation] of asRecords(
        value.test_expectations
    ).entries()) {
        if (!TEST_CATEGORIES.includes(expectation.category as never)) {
            add(
                errors,
                "GOV-TEST-001",
                `test_expectations[${index}].category`,
                "Unknown test category."
            );
        }
        if (
            !TEST_CLASSIFICATIONS.includes(expectation.classification as never)
        ) {
            add(
                errors,
                "GOV-TEST-001",
                `test_expectations[${index}].classification`,
                "Unknown test classification."
            );
        }
        if (
            typeof expectation.reason !== "string" ||
            !expectation.reason.trim()
        ) {
            add(
                errors,
                "GOV-TEST-001",
                `test_expectations[${index}].reason`,
                "Every test classification requires a reason."
            );
        }
    }

    for (const [index, decision] of asRecords(value.decisions).entries()) {
        const isHighConsequence = decision.consequence === "high";
        if (
            isHighConsequence &&
            decision.human_confirmation_required !== true
        ) {
            add(
                errors,
                "GOV-DECISION-001",
                `decisions[${index}].human_confirmation_required`,
                "High-consequence decisions require human confirmation."
            );
        }
        if (
            task.status === "READY_FOR_DEV" &&
            decision.human_confirmation_required === true &&
            decision.status !== "resolved"
        ) {
            add(
                errors,
                "GOV-APPROVAL-001",
                `decisions[${index}].status`,
                "READY_FOR_DEV cannot contain an unresolved required decision."
            );
        }
    }

    const critic = isRecord(value.critic) ? value.critic : {};
    if (finalRisk >= 2 && critic.required !== true) {
        add(
            errors,
            "GOV-CRITIC-001",
            "critic.required",
            "L2/L3 work requires an independent Critic."
        );
    }
    if (finalRisk >= 2 && critic.completed !== true) {
        add(
            errors,
            "GOV-CRITIC-001",
            "critic.completed",
            "L2/L3 Critic review must be completed."
        );
    }
    if (finalRisk >= 2) {
        requireString(critic.artifact, "critic.artifact", errors);
        requireString(critic.reviewer, "critic.reviewer", errors);
        requireArray(
            critic.findings,
            "critic.findings",
            errors,
            "GOV-CRITIC-001"
        );
        if (critic.fresh_context !== true || critic.read_only !== true) {
            add(
                errors,
                "GOV-CRITIC-001",
                "critic",
                "L2/L3 Critic requires fresh-context and read-only attestation."
            );
        }
        const reviewed = asStrings(critic.categories_reviewed);
        const missingCategories = CRITIC_CATEGORIES.filter(
            (category) => !reviewed.includes(category)
        );
        if (missingCategories.length > 0) {
            add(
                errors,
                "GOV-CRITIC-001",
                "critic.categories_reviewed",
                `Critic must cover: ${missingCategories.join(", ")}.`
            );
        }
        if (!isSafeWorkItemArtifact(critic.artifact)) {
            add(
                errors,
                "GOV-CRITIC-001",
                "critic.artifact",
                "Critic artifact must be a non-empty relative path contained in the work-item folder."
            );
        }
    }

    const implementationReview = isRecord(value.implementation_review)
        ? value.implementation_review
        : undefined;
    if (
        Object.prototype.hasOwnProperty.call(value, "implementation_review") &&
        !implementationReview
    ) {
        add(
            errors,
            "GOV-REVIEW-001",
            "implementation_review",
            "Implementation review must be an object."
        );
    }
    if (implementationReview) {
        requireReviewString(
            implementationReview.artifact,
            "implementation_review.artifact",
            errors
        );
        if (!isSafeWorkItemArtifact(implementationReview.artifact)) {
            add(
                errors,
                "GOV-REVIEW-001",
                "implementation_review.artifact",
                "Review artifact must be a non-empty relative path contained in the work-item folder."
            );
        }
        if (!REVIEW_RESULTS.includes(implementationReview.result as never)) {
            add(
                errors,
                "GOV-REVIEW-001",
                "implementation_review.result",
                "Implementation review result is invalid."
            );
        }
        requireReviewString(
            implementationReview.base_branch,
            "implementation_review.base_branch",
            errors
        );
        for (const field of ["base_commit", "head_commit"]) {
            if (
                typeof implementationReview[field] !== "string" ||
                !/^[0-9a-f]{40}$/i.test(implementationReview[field])
            ) {
                add(
                    errors,
                    "GOV-REVIEW-001",
                    `implementation_review.${field}`,
                    "A 40-character hexadecimal commit is required."
                );
            }
        }
        if (
            implementationReview.pr_url !== null &&
            typeof implementationReview.pr_url !== "string"
        ) {
            add(
                errors,
                "GOV-REVIEW-001",
                "implementation_review.pr_url",
                "A string or null is required."
            );
        }
        if (
            !IMPLEMENTATION_DRIFT_LEVELS.includes(
                implementationReview.material_drift as never
            )
        ) {
            add(
                errors,
                "GOV-REVIEW-001",
                "implementation_review.material_drift",
                "Implementation review drift level is invalid."
            );
        }
        const reconciliation = isRecord(implementationReview.reconciliation)
            ? implementationReview.reconciliation
            : undefined;
        for (const field of [
            "requirements",
            "scenarios",
            "invariants",
            "architecture",
            "security",
            "test_coverage",
            "scope",
        ]) {
            if (
                !reconciliation ||
                !RECONCILIATION_RESULTS.includes(reconciliation[field] as never)
            ) {
                add(
                    errors,
                    "GOV-REVIEW-001",
                    `implementation_review.reconciliation.${field}`,
                    "A valid reconciliation result is required."
                );
            }
        }
        requireReviewStringArray(
            implementationReview.blocking_findings,
            "implementation_review.blocking_findings",
            errors
        );
        requireReviewStringArray(
            implementationReview.required_actions,
            "implementation_review.required_actions",
            errors
        );
        requireReviewStringArray(
            implementationReview.evidence,
            "implementation_review.evidence",
            errors,
            true
        );

        const blockers = asStrings(implementationReview.blocking_findings);
        const actions = asStrings(implementationReview.required_actions);
        const passed = implementationReview.result === "REVIEW_PASSED";
        if (
            passed &&
            (implementationReview.material_drift !== "NO_DRIFT" ||
                blockers.length > 0 ||
                actions.length > 0)
        ) {
            add(
                errors,
                "GOV-REVIEW-001",
                "implementation_review",
                "A passed review cannot contain drift, blockers, or required actions."
            );
        }
        if (
            implementationReview.material_drift === "MATERIAL_DRIFT" &&
            implementationReview.governance_reentry_required !== true
        ) {
            add(
                errors,
                "GOV-DRIFT-001",
                "implementation_review.governance_reentry_required",
                "Material drift requires governance re-entry."
            );
        }
        if (
            implementationReview.material_drift === "MATERIAL_DRIFT" &&
            task.status === "READY_FOR_DEV"
        ) {
            add(
                errors,
                "GOV-DRIFT-001",
                "implementation_review",
                "Material drift cannot remain READY_FOR_DEV."
            );
        }
    }

    if (task.status === "READY_FOR_DEV") {
        const approval = isRecord(value.approval) ? value.approval : {};
        const requiredCollections = [
            "requirements",
            "scenarios",
            "test_expectations",
        ];
        if (finalRisk >= 2) {
            requiredCollections.push("invariants", "flows");
        }
        for (const collection of requiredCollections) {
            if (asRecords(value[collection]).length === 0) {
                add(
                    errors,
                    "GOV-COMPLETENESS-001",
                    collection,
                    `READY_FOR_DEV requires at least one ${collection} record.`
                );
            }
        }
        if (approval.state !== "APPROVED") {
            add(
                errors,
                "GOV-APPROVAL-001",
                "approval.state",
                "READY_FOR_DEV requires APPROVED governance state."
            );
        }
        if (asStrings(approval.design_blockers).length > 0) {
            add(
                errors,
                "GOV-APPROVAL-001",
                "approval.design_blockers",
                "READY_FOR_DEV cannot contain design blockers."
            );
        }
        if (!Array.isArray(approval.design_blockers)) {
            add(
                errors,
                "GOV-APPROVAL-001",
                "approval.design_blockers",
                "READY_FOR_DEV requires an explicit design_blockers array."
            );
        }
        requireString(approval.approved_by, "approval.approved_by", errors);
        for (const [index, dependency] of asRecords(
            value.dependencies
        ).entries()) {
            if (dependency.status !== "resolved") {
                add(
                    errors,
                    "GOV-DEPENDENCY-001",
                    `dependencies[${index}].status`,
                    "READY_FOR_DEV requires resolved dependencies."
                );
            }
        }
    }

    return { valid: errors.length === 0, errors };
}

export async function validateWorkItemFile(
    path: string,
    context: ValidationContext = {}
): Promise<ValidationResult> {
    let target = resolve(path);
    try {
        if ((await stat(target)).isDirectory()) {
            target = resolve(target, "work-item.yaml");
        }
        const contents = await Bun.file(target).text();
        const item = parse(contents);
        const result = validateWorkItem(item, context);
        if (!isRecord(item)) {
            return result;
        }

        if (
            isRecord(item.risk) &&
            isRecord(item.critic) &&
            riskIndex(item.risk.final_risk) >= 2 &&
            isSafeWorkItemArtifact(item.critic.artifact)
        ) {
            const artifactPath = resolve(dirname(target), item.critic.artifact);
            try {
                if ((await stat(artifactPath)).isDirectory()) {
                    throw new Error("Critic artifact must be a file.");
                }
            } catch (error) {
                add(
                    result.errors,
                    "GOV-CRITIC-001",
                    "critic.artifact",
                    error instanceof Error
                        ? `Critic artifact is unavailable: ${error.message}`
                        : "Critic artifact is unavailable."
                );
                result.valid = false;
            }
        }

        const implementationReview = isRecord(item.implementation_review)
            ? item.implementation_review
            : undefined;
        if (implementationReview && isSafeWorkItemArtifact(implementationReview.artifact)) {
            const artifactPath = resolve(
                dirname(target),
                implementationReview.artifact
            );
            try {
                if (!(await stat(artifactPath)).isFile()) {
                    throw new Error("Review artifact must be a file.");
                }
            } catch (error) {
                add(
                    result.errors,
                    "GOV-REVIEW-001",
                    "implementation_review.artifact",
                    error instanceof Error
                        ? `Review artifact is unavailable: ${error.message}`
                        : "Review artifact is unavailable."
                );
                result.valid = false;
            }
        }

        return result;
    } catch (error) {
        return {
            valid: false,
            errors: [
                {
                    code: "GOV-YAML-001",
                    path: target,
                    message:
                        error instanceof Error
                            ? error.message
                            : "Unable to read YAML.",
                },
            ],
        };
    }
}

if (import.meta.main) {
    const target = Bun.argv[2];
    if (!target) {
        console.error(
            "Usage: bun run scripts/governance/validate-work-item.ts <work-item.yaml>"
        );
        process.exit(2);
    }

    const result = await validateWorkItemFile(target, {
        branch: process.env.GITHUB_HEAD_REF || process.env.GOVERNANCE_BRANCH,
    });
    if (!result.valid) {
        for (const error of result.errors) {
            console.error(`${error.code} ${error.path}: ${error.message}`);
        }
        process.exit(1);
    }
    console.log(`Governance validation passed: ${resolve(target)}`);
}
