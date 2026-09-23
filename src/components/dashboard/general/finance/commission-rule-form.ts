export type CommissionRuleFormValues = {
    ruleName: string;
    commissionPercentBps: string;
    priority: string;
    effectiveFrom: string;
    commissionBasis: string;
    notes?: string;
    sourceStatus?: "agreement_version" | "no_source_document_on_file";
    agreementVersionId?: string;
    approverName?: string;
    provisional?: boolean;
};

export function validateCommissionRuleForm(
    values: Pick<CommissionRuleFormValues, "ruleName" | "commissionPercentBps" | "priority" | "effectiveFrom" | "commissionBasis">
) {
    const errors: Record<string, string> = {};
    if (!values.ruleName.trim()) errors.ruleName = "Rule name is required";
    if (!values.commissionPercentBps.trim()) {
        errors.commissionPercentBps = "Commission rate is required";
    } else if (!/^\d+$/.test(values.commissionPercentBps.trim())) {
        errors.commissionPercentBps = "Commission rate must be whole-number basis points";
    }
    if (!values.effectiveFrom.trim()) errors.effectiveFrom = "Effective from is required";
    if (!values.commissionBasis.trim()) errors.commissionBasis = "Commission basis is required";
    return errors;
}

export function buildCommissionRuleMetadata(values: Pick<CommissionRuleFormValues, "notes" | "sourceStatus" | "agreementVersionId" | "approverName" | "provisional" | "commissionBasis">): {
    notes?: string;
    sourceStatus?: "agreement_version" | "no_source_document_on_file";
    agreementVersionId?: string;
    approverName: string;
    provisional: boolean;
    commissionBasis: string;
} {
    return {
        ...(values.notes?.trim() ? { notes: values.notes.trim() } : {}),
        ...(values.sourceStatus ? { sourceStatus: values.sourceStatus } : {}),
        ...(values.agreementVersionId?.trim() ? { agreementVersionId: values.agreementVersionId.trim() } : {}),
        approverName: values.approverName?.trim() || "Akshay",
        provisional: values.provisional ?? true,
        commissionBasis: values.commissionBasis.trim(),
    };
}
