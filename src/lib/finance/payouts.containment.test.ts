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

describe("AQ-18 recalculation status guard", () => {
    for (const status of ["draft", "calculated"]) {
        test(`recalculates a ${status} cycle`, async () => {
            state.cycle = cycle(status);

            const updated = await payouts.calculatePayoutCycle("cycle-1", "finance-1");

            expect(updated.status).toBe("calculated");
            expect(state.replacedLineItems).not.toBeNull();
        });
    }

    for (const status of ["approved", "processing", "completed", "failed"]) {
        test(`rejects recalculation of a ${status} cycle without writing`, async () => {
            state.cycle = cycle(status);

            await expect(
                payouts.calculatePayoutCycle("cycle-1", "finance-1")
            ).rejects.toThrow(
                `Payout cycle recalculation blocked: cycle status is ${status}.`
            );
            expect(state.replacedLineItems).toBeNull();
            expect(state.cycleUpdates).toHaveLength(0);
        });
    }

    const overrideInput = {
        cycleId: "cycle-1",
        brandId,
        adjustmentType: "manual_correction",
        amountPaise: 5_000,
        reasonCode: "correction",
        notes: "Correct a shipping deduction",
        proofFileUrl: "https://files.example.com/proof.pdf",
        actorId: "finance-1",
        approverId: "finance-2",
    };

    test("rejects creating an override on a locked cycle before storing it", async () => {
        state.cycle = cycle("completed");

        await expect(payouts.createPayoutOverride(overrideInput)).rejects.toThrow(
            "Payout cycle recalculation blocked: cycle status is completed."
        );
        expect(state.overrideInserts).toHaveLength(0);
        expect(state.replacedLineItems).toBeNull();
    });

    test("creates and applies an override on a calculated cycle", async () => {
        state.cycle = cycle("calculated");

        await payouts.createPayoutOverride(overrideInput);

        expect(state.overrideInserts).toHaveLength(1);
        expect(state.replacedLineItems).not.toBeNull();
    });

    test("rejects approving an override on a locked cycle before updating it", async () => {
        state.cycle = cycle("approved");
        state.override = {
            id: "override-1",
            cycleId: "cycle-1",
            brandId,
            createdBy: "finance-1",
            approvedBy: null,
            reasonCode: "correction",
        };

        await expect(
            payouts.approvePayoutOverride("override-1", "finance-2")
        ).rejects.toThrow("Payout cycle recalculation blocked: cycle status is approved.");
        expect(state.overrideUpdates).toHaveLength(0);
        expect(state.replacedLineItems).toBeNull();
    });
});

const approvedRule = {
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
};

async function prepareExecutableCycle(clearedBy: string) {
    state.commissionRules = [approvedRule];
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
    state.clearance = {
        id: "clearance-1",
        cycleId: "cycle-1",
        clearedBy,
        evidenceReference: "BIZ-3-approval",
        transactionValidationReference: "txn-validation-1",
        transactionValidatedAt: new Date("2026-09-10T00:00:00.000Z"),
        clearedAt: new Date("2026-09-10T00:00:00.000Z"),
        expiresAt: null,
        revokedAt: null,
    };
}

describe("AQ-60a clearer is not the executor", () => {
    test("blocks execution by the admin who recorded the clearance before any payout", async () => {
        await prepareExecutableCycle("finance-2");
        const originalFetch = globalThis.fetch;
        let providerCalls = 0;
        globalThis.fetch = (async () => {
            providerCalls += 1;
            return new Response("{}");
        }) as unknown as typeof fetch;

        try {
            await expect(
                payouts.executePayoutCycle("cycle-1", "finance-2")
            ).rejects.toThrow("clearer_is_executor");
        } finally {
            globalThis.fetch = originalFetch;
        }
        expect(providerCalls).toBe(0);
        expect(state.cycle!.status).toBe("approved");
        expect(
            state.financeAudits.find(
                (event) => event.actionType === "payout_execution_gate_evaluated"
            )?.reason
        ).toBe("gate_blocked");
    });

    test("allows execution by a different admin", async () => {
        await prepareExecutableCycle("finance-2");

        const updated = await payouts.executePayoutCycle("cycle-1", "finance-3");

        expect(updated.executedBy).toBe("finance-3");
    });
});
