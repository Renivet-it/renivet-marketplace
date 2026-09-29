import { beforeEach, describe, expect, mock, test } from "bun:test";

// Runtime tests for the payout containment controls (Stage 3A C0). The query,
// audit and provider boundaries are mocked; nothing touches a database or Razorpay.

type Row = Record<string, any>;

const state = {
    cycle: null as Row | null,
    commissionRules: [] as Row[],
    clearance: null as Row | null,
    replacedLineItems: null as Row[] | null,
    cycleUpdates: [] as Row[],
    overrideInserts: [] as Row[],
    overrideUpdates: [] as Row[],
    override: null as Row | null,
    financeAudits: [] as Row[],
};

const brandId = "brand-1";
const deliveredAt = "2026-09-05T10:00:00.000Z";

function order() {
    return {
        id: "order-1",
        status: "delivered",
        paymentStatus: "paid",
        paymentId: "pay_1",
        paymentMethod: "upi",
        totalAmount: 100_000,
        shipments: [{ status: "delivered", updatedAt: deliveredAt }],
        items: [
            {
                quantity: 1,
                variant: null,
                product: {
                    brandId,
                    title: "Shirt",
                    price: 100_000,
                    categoryId: "category-1",
                    productTypeId: "type-1",
                    category: { commissionRate: 20 },
                },
            },
        ],
    };
}

function cycle(status: string, calculationSummary: Row = {}) {
    return {
        id: "cycle-1",
        cycleKey: "2026-09-A",
        cycleStart: "2026-09-01",
        cycleEnd: "2026-09-15",
        payoutDate: "2026-09-16",
        status,
        calculationSummary,
    };
}

mock.module("@/lib/db/queries/finance-compliance", () => ({
    financeComplianceQueries: {
        getPayoutCycle: async () => state.cycle,
        listPayoutCycles: async () => (state.cycle ? [state.cycle] : []),
        listOrdersForFinanceWindow: async () => [order()],
        listRefundsForPayoutWindow: async () => [],
        listPayoutOverrides: async () => [],
        listBrandsForPayout: async () => [
            { brandId, brandName: "Brand One", payoutMethod: "razorpay_route" },
        ],
        listCarrierClaimsForFinanceWindow: async () => [],
        listRtoDispositionsForOrderIds: async () => [],
        listPayoutLineItems: async () => [],
        listCommissionRules: async () => state.commissionRules,
        getBrandTdsTracking: async () => null,
        upsertBrandTdsTracking: async () => ({}),
        replacePayoutLineItems: async (_cycleId: string, values: Row[]) => {
            state.replacedLineItems = values;
            return values;
        },
        updatePayoutCycle: async (id: string, values: Row) => {
            state.cycleUpdates.push(values);
            state.cycle = { ...state.cycle, ...values, id };
            return state.cycle;
        },
        getActivePayoutExecutionClearance: async () => state.clearance,
        addPayoutOverride: async (values: Row) => {
            state.overrideInserts.push(values);
            return { id: "override-1", ...values };
        },
        getPayoutOverride: async () => state.override,
        updatePayoutOverride: async (id: string, values: Row) => {
            state.overrideUpdates.push(values);
            return { ...state.override, ...values, id };
        },
    },
}));

mock.module("@/lib/finance/audit", () => ({
    writeFinanceAuditEvent: async (event: Row) => {
        state.financeAudits.push(event);
        return event;
    },
}));

mock.module("@/lib/monitoring-sla/audit", () => ({
    auditAndAlert: async () => ({}),
}));

const payouts = await import("./payouts");

beforeEach(() => {
    state.cycle = null;
    state.commissionRules = [];
    state.clearance = null;
    state.replacedLineItems = null;
    state.cycleUpdates = [];
    state.overrideInserts = [];
    state.overrideUpdates = [];
    state.override = null;
    state.financeAudits = [];
});

describe("AQ-01 commission fallback removed", () => {
    test("a line with no matching commission rule is blocked even when its category has a legacy rate", async () => {
        state.cycle = cycle("calculated");

        await payouts.calculatePayoutCycle("cycle-1", "finance-1");

        const lines = state.replacedLineItems ?? [];
        const commissionLines = lines.filter((line) =>
            ["commission", "commission_blocked"].includes(line.lineType)
        );
        expect(commissionLines).toHaveLength(1);
        expect(commissionLines[0].lineType).toBe("commission_blocked");
        expect(commissionLines[0].amountPaise === 0).toBe(true);
        expect(commissionLines[0].metadata.commissionStatus).toBe("blocked_unconfigured");
        expect(JSON.stringify(lines)).not.toContain("category_fallback");
    });

    test("an approved commission rule is still applied", async () => {
        state.cycle = cycle("calculated");
        state.commissionRules = [
            {
                id: "rule-1",
                brandId,
                categoryId: null,
                productTypeId: null,
                ruleName: "Brand One approved",
                commissionPercentBps: 1500,
                holdbackPercentBps: 0,
                priority: 1,
                isActive: true,
                effectiveFrom: "2026-01-01",
                effectiveTo: null,
            },
        ];

        await payouts.calculatePayoutCycle("cycle-1", "finance-1");

        const commission = (state.replacedLineItems ?? []).find(
            (line) => line.lineType === "commission"
        );
        expect(commission?.amountPaise).toBe(-15_000);
        expect(commission?.metadata.ruleId).toBe("rule-1");
    });

    test("the execution gate blocks a cycle that contains a blocked commission line", async () => {
        state.cycle = cycle("calculated");
        await payouts.calculatePayoutCycle("cycle-1", "finance-1");
        const calculated = state.cycle!.calculationSummary;
        state.cycle = cycle("approved", {
            ...calculated,
            brands: calculated.brands.map((brand: Row) => ({
                ...brand,
                reviewStatus: "approved",
                executionStatus: "approved",
            })),
        });

        await expect(
            payouts.executePayoutCycle("cycle-1", "finance-2")
        ).rejects.toThrow("commission_validation_failed");
    });
});
