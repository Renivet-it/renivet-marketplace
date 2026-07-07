import { db } from "@/lib/db";
import { financeComplianceQueries } from "@/lib/db/queries/finance-compliance";
import { brands } from "@/lib/db/schema";
import { toCsv } from "@/lib/finance/reporting";
import { writeFinanceAuditEvent } from "@/lib/finance/audit";
import { eq } from "drizzle-orm";

function getFinancialYearParts(financialYear: string) {
    const match = /^FY(\d{4})-(\d{2})$/.exec(financialYear);
    if (!match) {
        throw new Error(`Invalid financial year: ${financialYear}`);
    }
    const startYear = Number(match[1]);
    return {
        startYear,
        endYear: startYear + 1,
    };
}

function getQuarterRange(financialYear: string, quarter: "Q1" | "Q2" | "Q3" | "Q4") {
    const { startYear, endYear } = getFinancialYearParts(financialYear);
    switch (quarter) {
        case "Q1":
            return { start: new Date(startYear, 3, 1), end: new Date(startYear, 5, 30, 23, 59, 59, 999) };
        case "Q2":
            return { start: new Date(startYear, 6, 1), end: new Date(startYear, 8, 30, 23, 59, 59, 999) };
        case "Q3":
            return { start: new Date(startYear, 9, 1), end: new Date(startYear, 11, 31, 23, 59, 59, 999) };
        case "Q4":
            return { start: new Date(endYear, 0, 1), end: new Date(endYear, 2, 31, 23, 59, 59, 999) };
    }
}

export function getCurrentFinancialYear(date = new Date()) {
    const year = date.getMonth() >= 3 ? date.getFullYear() : date.getFullYear() - 1;
    return `FY${year}-${String((year + 1) % 100).padStart(2, "0")}`;
}

export function getQuarterForDate(date = new Date()): "Q1" | "Q2" | "Q3" | "Q4" {
    const month = date.getMonth();
    if (month >= 3 && month <= 5) return "Q1";
    if (month >= 6 && month <= 8) return "Q2";
    if (month >= 9 && month <= 11) return "Q3";
    return "Q4";
}

export async function buildQuarterlyTdsExport(input?: {
    financialYear?: string;
    quarter?: "Q1" | "Q2" | "Q3" | "Q4";
}) {
    const financialYear = input?.financialYear ?? getCurrentFinancialYear();
    const quarter = input?.quarter ?? getQuarterForDate();
    const range = getQuarterRange(financialYear, quarter);
    const [cycles, brandRows] = await Promise.all([
        financeComplianceQueries.listPayoutCycles(),
        financeComplianceQueries.listBrandsForPayout(),
    ]);

    const brandMap = new Map(brandRows.map((row) => [row.brandId, row]));
    const rows: Array<Record<string, unknown>> = [];
    const quarterTotals = new Map<
        string,
        {
            brandName: string;
            pan: string;
            financialYear: string;
            quarter: string;
            totalCommissionPaise: number;
            totalTdsPaise: number;
        }
    >();

    for (const cycle of cycles) {
        const payoutDate = new Date(cycle.payoutDate);
        if (cycle.status !== "completed") continue;
        if (payoutDate < range.start || payoutDate > range.end) continue;

        const summary = cycle.calculationSummary as
            | {
                  brands?: Array<{
                      brandId: string;
                      brandName: string;
                      commissionPaise: number;
                      tdsPaise: number;
                  }>;
              }
            | undefined;

        for (const brandSummary of summary?.brands ?? []) {
            const brandMeta = brandMap.get(brandSummary.brandId);
            const quarterTotal = quarterTotals.get(brandSummary.brandId) ?? {
                brandName: brandSummary.brandName,
                pan: brandMeta?.pan ?? "",
                financialYear,
                quarter,
                totalCommissionPaise: 0,
                totalTdsPaise: 0,
            };

            quarterTotal.totalCommissionPaise += brandSummary.commissionPaise;
            quarterTotal.totalTdsPaise += brandSummary.tdsPaise;
            quarterTotals.set(brandSummary.brandId, quarterTotal);

            rows.push({
                rowType: "detail",
                brandId: brandSummary.brandId,
                brandName: brandSummary.brandName,
                pan: brandMeta?.pan ?? "",
                financialYear,
                quarter,
                payoutDate: cycle.payoutDate,
                cycleKey: cycle.cycleKey,
                commissionPaidInCyclePaise: brandSummary.commissionPaise,
                tdsDeductedInCyclePaise: brandSummary.tdsPaise,
                totalCommissionPaidInQuarterPaise: "",
                totalTdsDeductedInQuarterPaise: "",
            });
        }
    }

    for (const [brandId, total] of quarterTotals) {
        rows.push({
            rowType: "summary",
            brandId,
            brandName: total.brandName,
            pan: total.pan,
            financialYear,
            quarter,
            payoutDate: "",
            cycleKey: "",
            commissionPaidInCyclePaise: "",
            tdsDeductedInCyclePaise: "",
            totalCommissionPaidInQuarterPaise: total.totalCommissionPaise,
            totalTdsDeductedInQuarterPaise: total.totalTdsPaise,
        });
    }

    return {
        financialYear,
        quarter,
        rows,
        csv: toCsv(rows, [
            "rowType",
            "brandId",
            "brandName",
            "pan",
            "financialYear",
            "quarter",
            "payoutDate",
            "cycleKey",
            "commissionPaidInCyclePaise",
            "tdsDeductedInCyclePaise",
            "totalCommissionPaidInQuarterPaise",
            "totalTdsDeductedInQuarterPaise",
        ]),
    };
}

export async function runTdsFinancialYearRollover(actorId: string) {
    const financialYear = getCurrentFinancialYear();
    const activeBrands = await db.query.brands.findMany({
        where: eq(brands.isActive, true),
    });

    const rows = [];
    for (const brand of activeBrands) {
        rows.push(
            await financeComplianceQueries.upsertBrandTdsTracking({
                brandId: brand.id,
                financialYear,
                annualCommissionYtdPaise: 0,
                tdsDeductedYtdPaise: 0,
                thresholdCrossedAt: null,
                cumulativeCommissionPaise: 0,
                cumulativeTdsPaise: 0,
                thresholdPaise: 3_000_000,
                tdsRateBps: 100,
                lastAppliedCycleId: null,
            })
        );
    }

    await writeFinanceAuditEvent({
        actorId,
        actionType: "tds_financial_year_rollover.executed",
        entityType: "brand_tds_tracking",
        entityId: financialYear,
        metadata: {
            rowCount: rows.length,
        },
    });

    return {
        ok: true,
        financialYear,
        rowCount: rows.length,
    };
}
