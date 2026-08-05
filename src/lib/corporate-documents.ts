export type CorporateDocumentPrefix = "PI" | "RV" | "RPO" | "CINV" | "DC";

export function corporateFinancialYear(value: string | Date = new Date()) {
    const date = new Date(value);
    const calendarYear = date.getFullYear();
    const startYear = date.getMonth() >= 3 ? calendarYear : calendarYear - 1;

    return `${String(startYear).slice(-2)}${String(startYear + 1).slice(-2)}`;
}

export function corporateDocumentNumber(
    prefix: CorporateDocumentPrefix,
    sequence: number,
    date: string | Date = new Date()
) {
    return `${prefix}/${corporateFinancialYear(date)}/${String(sequence).padStart(5, "0")}`;
}

export function corporateReceiptVoucherNumber(
    sequence: number,
    date: string | Date = new Date()
) {
    return corporateDocumentNumber("RV", sequence, date);
}

export const RENIVET_CORPORATE_SELLER_NAME = "Renivet";
export const RENIVET_CORPORATE_SIGNATORY = "Renivet";
