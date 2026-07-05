export type TdsComputation = {
    deductiblePaise: number;
    postCycleCumulativePaise: number;
    note: string;
};

export function getFinancialYearForDate(value: Date) {
    const year = value.getUTCMonth() >= 3 ? value.getUTCFullYear() : value.getUTCFullYear() - 1;
    return `${year}-${year + 1}`;
}

export function computeTdsDeduction(params: {
    cumulativeCommissionPaise: number;
    cycleCommissionPaise: number;
    thresholdPaise?: number;
    rateBps?: number;
}) : TdsComputation {
    const thresholdPaise = params.thresholdPaise ?? 3_000_000;
    const rateBps = params.rateBps ?? 100;
    const current = params.cumulativeCommissionPaise;
    const cycle = params.cycleCommissionPaise;
    const post = current + cycle;
    const rate = rateBps / 10_000;

    if (current >= thresholdPaise) {
        return {
            deductiblePaise: Math.round(cycle * rate),
            postCycleCumulativePaise: post,
            note: "Already above threshold; TDS applied on full cycle commission.",
        };
    }

    if (post <= thresholdPaise) {
        return {
            deductiblePaise: 0,
            postCycleCumulativePaise: post,
            note: "Below threshold; no TDS deduction applied.",
        };
    }

    const eligiblePaise = Math.max(post - thresholdPaise, 0);
    return {
        deductiblePaise: Math.round(eligiblePaise * rate),
        postCycleCumulativePaise: post,
        note: "Threshold crossed in this cycle; TDS applied only on eligible portion.",
    };
}

export function splitGstByState(params: {
    taxableValuePaise: number;
    gstRateBps: number;
    supplierState?: string | null;
    customerState?: string | null;
}) {
    const sameState =
        params.supplierState &&
        params.customerState &&
        params.supplierState.trim().toLowerCase() ===
            params.customerState.trim().toLowerCase();
    const totalTaxPaise = Math.round(
        params.taxableValuePaise * (params.gstRateBps / 10_000)
    );

    if (sameState) {
        const half = Math.round(totalTaxPaise / 2);
        return {
            cgstPaise: half,
            sgstPaise: totalTaxPaise - half,
            igstPaise: 0,
            totalTaxPaise,
        };
    }

    return {
        cgstPaise: 0,
        sgstPaise: 0,
        igstPaise: totalTaxPaise,
        totalTaxPaise,
    };
}

export function categorizeCodDiscrepancy(params: {
    expectedAmountPaise: number;
    remittedAmountPaise: number;
    remittanceDate?: Date | null;
    now?: Date;
}) {
    const now = params.now ?? new Date();
    const diff = params.remittedAmountPaise - params.expectedAmountPaise;
    const ageingDays = params.remittanceDate
        ? Math.max(
              0,
              Math.floor(
                  (now.getTime() - params.remittanceDate.getTime()) / (1000 * 60 * 60 * 24)
              )
          )
        : 0;

    if (params.remittedAmountPaise === 0) {
        return { status: ageingDays > 14 ? "missing" : "delayed", discrepancyAmountPaise: diff, ageingDays };
    }
    if (diff === 0) return { status: "matched", discrepancyAmountPaise: 0, ageingDays };
    if (diff < 0) return { status: "short", discrepancyAmountPaise: diff, ageingDays };
    return { status: "excess", discrepancyAmountPaise: diff, ageingDays };
}
