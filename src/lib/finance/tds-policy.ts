export const SECTION_194_O_THRESHOLD_PAISE = 50_000_000;
export const LEGACY_SECTION_194_O_THRESHOLD_PAISE = 3_000_000;

export function getSection194OThresholdPaise(entityType?: string | null) {
    return entityType === "individual" || entityType === "huf"
        ? SECTION_194_O_THRESHOLD_PAISE
        : 0;
}

type TdsTrackingAuditRow = {
    brandId: string;
    financialYear: string;
    thresholdPaise: number;
    annualSalesYtdPaise: number;
    tdsDeductedYtdPaise: number;
    thresholdCrossedAt: Date | null;
    lastAppliedCycleId: string | null;
};

export function auditBrandTdsTrackingRows(rows: TdsTrackingAuditRow[]) {
    const rowsRequiringFinanceReview = rows
        .filter(
            (row) => row.thresholdPaise === LEGACY_SECTION_194_O_THRESHOLD_PAISE
        )
        .map((row) => ({
            brandId: row.brandId,
            financialYear: row.financialYear,
            thresholdPaise: row.thresholdPaise,
            annualSalesYtdPaise: row.annualSalesYtdPaise,
            tdsDeductedYtdPaise: row.tdsDeductedYtdPaise,
            thresholdCrossedAt: row.thresholdCrossedAt,
            lastAppliedCycleId: row.lastAppliedCycleId,
            reviewReason:
                "Tracking row uses the legacy threshold; historical withholding must be reconciled by finance before any correction.",
        }));

    return {
        financialYear: rows[0]?.financialYear ?? null,
        approvedThresholdPaise: SECTION_194_O_THRESHOLD_PAISE,
        legacyThresholdPaise: LEGACY_SECTION_194_O_THRESHOLD_PAISE,
        totalRows: rows.length,
        legacyRows: rowsRequiringFinanceReview.length,
        rowsRequiringFinanceReview,
    };
}
