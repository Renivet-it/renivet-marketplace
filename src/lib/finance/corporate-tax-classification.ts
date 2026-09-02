export type CorporateTaxClassificationInput = {
    hsnCode?: string | null;
    gstRateBps?: number | null;
    sourceId?: string | null;
};

export function requireCorporateTaxClassification(
    input: CorporateTaxClassificationInput
) {
    const hsnCode = input.hsnCode?.trim() ?? "";
    const gstRateBps = input.gstRateBps;
    if (
        !hsnCode ||
        typeof gstRateBps !== "number" ||
        !Number.isInteger(gstRateBps) ||
        gstRateBps < 0
    ) {
        throw new Error("Corporate tax classification is required");
    }

    return {
        hsnCode,
        gstRateBps,
        ...(input.sourceId ? { sourceId: input.sourceId } : {}),
    };
}
