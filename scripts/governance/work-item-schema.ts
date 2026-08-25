export const RISK_LEVELS = ["L0", "L1", "L2", "L3"] as const;
export type RiskLevel = (typeof RISK_LEVELS)[number];

export const WORK_ITEM_STATES = [
    "DRAFT",
    "IN_REVIEW",
    "BLOCKED",
    "READY_FOR_DEV",
] as const;

export const TEST_CATEGORIES = [
    "unit",
    "component",
    "api",
    "integration",
    "e2e",
    "ui_ux",
    "business_uat",
    "security",
    "accessibility",
    "performance",
    "regression",
    "exploratory",
    "external_integration",
] as const;

export const TEST_CLASSIFICATIONS = [
    "REQUIRED",
    "OPTIONAL",
    "NOT_APPLICABLE",
] as const;

export interface ValidationError {
    code: string;
    path: string;
    message: string;
}

export interface ValidationResult {
    valid: boolean;
    errors: ValidationError[];
}

export type UnknownRecord = Record<string, unknown>;
