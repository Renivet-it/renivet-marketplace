export function resolveCorporateDocumentDate(
    primary?: string | Date | null,
    fallback?: string | Date | null
) {
    for (const candidate of [primary, fallback]) {
        if (!candidate) continue;
        const parsed = candidate instanceof Date ? candidate : new Date(candidate);
        if (!Number.isNaN(parsed.getTime())) return parsed;
    }
    throw new Error("CORPORATE_DOCUMENT_DATE_INVALID");
}

export function assertCorporateTaxData(
    customerGstin: string | null | undefined,
    lines: Array<{ hsnCode?: string | null; taxable?: boolean }>
) {
    if (getCorporateTaxDataMissingFields(customerGstin, lines).length > 0) {
        throw new Error("CORPORATE_DOCUMENT_TAX_DATA_INCOMPLETE");
    }
}

export function getCorporateTaxDataMissingFields(
    customerGstin: string | null | undefined,
    lines: Array<{ hsnCode?: string | null; taxable?: boolean }>
) {
    const missing: string[] = [];
    if (!customerGstin?.trim()) missing.push("customer_gstin");
    if (lines.some((line) => line.taxable !== false && !line.hsnCode?.trim())) {
        missing.push("hsn_code");
    }
    return missing;
}
