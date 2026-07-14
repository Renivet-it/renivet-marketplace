export type TdsComputation = {
    deductiblePaise: number;
    postCycleCumulativePaise: number;
    thresholdCrossed: boolean;
    note: string;
};

export type CheckoutTaxLineInput = {
    lineId: string;
    hsnCode?: string | null;
    unitPricePaise: number;
    quantity: number;
    fallbackRateBps?: number;
};

export type CheckoutTaxLineResult = {
    lineId: string;
    hsnCode: string;
    subtotalPaise: number;
    discountPaise: number;
    taxableValuePaise: number;
    gstRateBps: number;
    taxPaise: number;
};

export function getFinancialYearForDate(value: Date) {
    const year = value.getMonth() >= 3 ? value.getFullYear() : value.getFullYear() - 1;
    const shortNextYear = String((year + 1) % 100).padStart(2, "0");
    return `FY${year}-${shortNextYear}`;
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
            thresholdCrossed: false,
            note: "TDS (1% u/s 194-O) applied on full cycle commission because the annual threshold is already crossed.",
        };
    }

    if (post < thresholdPaise) {
        return {
            deductiblePaise: 0,
            postCycleCumulativePaise: post,
            thresholdCrossed: false,
            note: `TDS: Nil (cumulative Rs. ${(post / 100).toFixed(2)} below Rs. 30000 threshold).`,
        };
    }

    const eligiblePaise = Math.max(post - thresholdPaise, 0);
    return {
        deductiblePaise: Math.round(eligiblePaise * rate),
        postCycleCumulativePaise: post,
        thresholdCrossed: current < thresholdPaise,
        note: "Threshold crossed in this cycle; TDS applied only on the commission above Rs. 30000.",
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

export function deriveGstRateBps(params: {
    hsnCode?: string | null;
    fallbackRateBps?: number;
    unitPricePaise: number;
}) {
    const normalizedHsn = params.hsnCode?.trim() ?? "";
    if (/^(61|62)/.test(normalizedHsn)) {
        return params.unitPricePaise <= 100_000 ? 500 : 1200;
    }

    return params.fallbackRateBps ?? 0;
}

export function computeCheckoutTaxLines(
    lines: CheckoutTaxLineInput[],
    opts: {
        totalDiscountPaise?: number;
        hsnRateByCode?: Map<string, number>;
    } = {}
): CheckoutTaxLineResult[] {
    const totalDiscountPaise = Math.max(0, opts.totalDiscountPaise ?? 0);
    const subtotals = lines.map((line) =>
        Math.max(0, Math.round(line.unitPricePaise * line.quantity))
    );
    const subtotalSum = subtotals.reduce((sum, value) => sum + value, 0);

    let assignedDiscountPaise = 0;

    return lines.map((line, index) => {
        const subtotalPaise = subtotals[index] ?? 0;
        const normalizedHsn = line.hsnCode?.trim() ?? "";
        const discountPaise =
            subtotalSum > 0
                ? index === lines.length - 1
                    ? Math.max(0, totalDiscountPaise - assignedDiscountPaise)
                    : Math.max(
                          0,
                          Math.round((totalDiscountPaise * subtotalPaise) / subtotalSum)
                      )
                : 0;

        assignedDiscountPaise += discountPaise;

        const taxableValuePaise = Math.max(0, subtotalPaise - discountPaise);
        const gstRateBps = deriveGstRateBps({
            hsnCode: normalizedHsn,
            fallbackRateBps: normalizedHsn
                ? opts.hsnRateByCode?.get(normalizedHsn) ?? line.fallbackRateBps ?? 0
                : line.fallbackRateBps ?? 0,
            unitPricePaise: line.unitPricePaise,
        });
        const taxPaise = Math.round(taxableValuePaise * (gstRateBps / 10_000));

        return {
            lineId: line.lineId,
            hsnCode: normalizedHsn,
            subtotalPaise,
            discountPaise,
            taxableValuePaise,
            gstRateBps,
            taxPaise,
        };
    });
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
