import { describe, expect, test } from "bun:test";
import {
    buildCommissionRuleMetadata,
    validateCommissionRuleForm,
} from "./commission-rule-form";

describe("commission rule form contract", () => {
    test("requires the approved rule fields and commission basis", () => {
        expect(validateCommissionRuleForm({
            ruleName: "",
            commissionPercentBps: "",
            priority: "0",
            effectiveFrom: "",
            commissionBasis: "",
        })).toEqual({
            ruleName: "Rule name is required",
            commissionPercentBps: "Commission rate is required",
            effectiveFrom: "Effective from is required",
            commissionBasis: "Commission basis is required",
        });
    });

    test("serializes editable metadata without exposing holdback", () => {
        expect(buildCommissionRuleMetadata({
            notes: "Approved by finance",
            sourceStatus: "agreement_version",
            agreementVersionId: "agr-1",
            approverName: "Akshay",
            provisional: true,
            commissionBasis: "net_merchandise_value",
        })).toEqual({
            notes: "Approved by finance",
            sourceStatus: "agreement_version",
            agreementVersionId: "agr-1",
            approverName: "Akshay",
            provisional: true,
            commissionBasis: "net_merchandise_value",
        });
    });
});
