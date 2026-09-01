export type CorporateCustomizationTaxTreatment =
    | "included_in_product_supply"
    | "separate_supply"
    | "not_yet_classified";

export type CorporateCustomizationInput = {
    name: string;
    description?: string | null;
    amountPaise: number;
    quantity?: number;
    basis?: "per_order" | "per_unit";
    productionInstruction?: string | null;
    artworkReference?: Record<string, unknown> | null;
    taxTreatment: CorporateCustomizationTaxTreatment;
    hsnCode?: string | null;
    displayOrder: number;
    metadata?: Record<string, unknown>;
};

export function buildCorporateCustomizationRows(
    rows: CorporateCustomizationInput[],
    legacyAmountPaise = 0
): CorporateCustomizationInput[] {
    if (rows.length > 0) return rows.map((row) => ({ ...row }));
    if (legacyAmountPaise <= 0) return [];
    return [
        {
            name: "Legacy Customization",
            amountPaise: legacyAmountPaise,
            quantity: 1,
            basis: "per_order",
            taxTreatment: "not_yet_classified",
            displayOrder: 1,
            metadata: { legacy: true },
        },
    ];
}

export function calculateCorporateCustomizationTax(
    rows: CorporateCustomizationInput[],
    parentGstRateBps: number,
    separateSupplyRatesByHsn: Record<string, number>
) {
    const calculatedRows = rows.map((row) => {
        const gstRateBps =
            row.taxTreatment === "included_in_product_supply"
                ? parentGstRateBps
                : separateSupplyRatesByHsn[row.hsnCode ?? ""];
        if (!Number.isInteger(gstRateBps) || gstRateBps < 0) {
            throw new Error(
                `An approved HSN/SAC classification is required for separate customization: ${row.name}`
            );
        }
        return {
            ...row,
            gstRateBps,
            gstPaise: Math.round((row.amountPaise * gstRateBps) / 10_000),
        };
    });

    return {
        rows: calculatedRows,
        gstPaise: calculatedRows.reduce((sum, row) => sum + row.gstPaise, 0),
    };
}
