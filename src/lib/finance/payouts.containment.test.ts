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
    lockedCycle: null as Row | null,
    lockReferences: [] as string[][],
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
        findLockedPayoutCycleForReferences: async (references: string[]) => {
            state.lockReferences.push(references);
            return state.lockedCycle;
        },
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
    state.lockedCycle = null;
    state.lockReferences = [];
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

describe("AQ-60b payout idempotency", () => {
    async function withProvider(run: (calls: Array<Record<string, string>>) => Promise<void>) {
        const calls: Array<Record<string, string>> = [];
        const originalFetch = globalThis.fetch;
        const originalAccount = process.env.RAZORPAY_PAYOUT_SOURCE_ACCOUNT_NUMBER;
        process.env.RAZORPAY_PAYOUT_SOURCE_ACCOUNT_NUMBER = "test-source-account";
        globalThis.fetch = (async (_url: string, init: RequestInit) => {
            calls.push(init.headers as Record<string, string>);
            return new Response(JSON.stringify({ id: "pout_1", status: "processing" }), {
                status: 200,
            });
        }) as unknown as typeof fetch;
        try {
            await run(calls);
        } finally {
            globalThis.fetch = originalFetch;
            if (originalAccount === undefined) {
                delete process.env.RAZORPAY_PAYOUT_SOURCE_ACCOUNT_NUMBER;
            } else {
                process.env.RAZORPAY_PAYOUT_SOURCE_ACCOUNT_NUMBER = originalAccount;
            }
        }
    }

    test("sends a deterministic X-Payout-Idempotency key derived from cycle and brand", async () => {
        const { buildPayoutIdempotencyKey } = await import("./payout-execution-gate");
        await prepareExecutableCycle("finance-2");

        await withProvider(async (calls) => {
            await payouts.executePayoutCycle("cycle-1", "finance-3");

            expect(calls).toHaveLength(1);
            expect(calls[0]["X-Payout-Idempotency"]).toBe(
                buildPayoutIdempotencyKey("cycle-1", brandId)
            );
        });
    });

    test("a concurrent replay of the same execution reuses the same key", async () => {
        await prepareExecutableCycle("finance-2");

        await withProvider(async (calls) => {
            // Both requests read the same approved cycle before either persists.
            await Promise.all([
                payouts.executePayoutCycle("cycle-1", "finance-3"),
                payouts.executePayoutCycle("cycle-1", "finance-3"),
            ]);

            expect(calls).toHaveLength(2);
            expect(new Set(calls.map((headers) => headers["X-Payout-Idempotency"])).size).toBe(1);
        });
    });

    test("a brand payout that was already sent is not re-sent", async () => {
        for (const executionStatus of ["processing", "submitted", "completed"]) {
            await prepareExecutableCycle("finance-2");
            const summary = state.cycle!.calculationSummary;
            state.cycle = cycle("approved", {
                ...summary,
                brands: summary.brands.map((brand: Row) => ({ ...brand, executionStatus })),
            });

            await withProvider(async (calls) => {
                await payouts.executePayoutCycle("cycle-1", "finance-3");
                expect(calls).toHaveLength(0);
            });
        }

        await prepareExecutableCycle("finance-2");
        const summary = state.cycle!.calculationSummary;
        state.cycle = cycle("approved", {
            ...summary,
            brands: summary.brands.map((brand: Row) => ({ ...brand, transactionId: "pout_1" })),
        });
        await withProvider(async (calls) => {
            await payouts.executePayoutCycle("cycle-1", "finance-3");
            expect(calls).toHaveLength(0);
        });
    });
});

describe("AQ-61 RTO fault writes go through the payout lock", () => {
    test("rejects a fault-owner write for a case in a locked payout cycle", async () => {
        const rto = await import("./rto-attribution");
        state.lockedCycle = { cycle: cycle("approved") };

        expect(
            await rto.checkRtoAttributionWritable({
                orderId: "order-1",
                rtoId: "rto-1",
                previousFaultOwner: "carrier",
                nextFaultOwner: "brand",
                notes: "Brand packed the wrong address label",
            })
        ).toEqual({
            ok: false,
            code: "CONFLICT",
            message: "RTO attribution is locked because this case is in an approved payout cycle.",
        });
        expect(state.lockReferences[0]).toEqual(["rto-1", "order-1"]);
    });

    test("checks the order reference when creating a new disposition", async () => {
        const rto = await import("./rto-attribution");
        state.lockedCycle = { cycle: cycle("completed") };

        const result = await rto.checkRtoAttributionWritable({
            orderId: "order-1",
            nextFaultOwner: "brand",
        });

        expect(result.ok).toBe(false);
        expect(state.lockReferences[0]).toContain("order-1");
    });

    test("allows an unlocked write and audits it", async () => {
        const rto = await import("./rto-attribution");

        expect(
            await rto.checkRtoAttributionWritable({
                orderId: "order-1",
                rtoId: "rto-1",
                previousFaultOwner: "carrier",
                nextFaultOwner: "brand",
                notes: "Brand packed the wrong address label",
            })
        ).toEqual({ ok: true });

        await rto.recordRtoAttributionAudit({
            actorId: "ops-1",
            rtoId: "rto-1",
            reason: "Brand packed the wrong address label",
            before: { faultOwner: "carrier", notes: null },
            after: { faultOwner: "brand", notes: "Brand packed the wrong address label" },
        });
        expect(state.financeAudits).toContainEqual(
            expect.objectContaining({
                actorId: "ops-1",
                actionType: "rto_attribution_set",
                entityType: "rto_disposition",
                entityId: "rto-1",
                beforeValue: { faultOwner: "carrier", notes: null },
            })
        );
    });

    test("requires notes to reclassify an existing fault owner", async () => {
        const rto = await import("./rto-attribution");

        expect(
            await rto.checkRtoAttributionWritable({
                orderId: "order-1",
                rtoId: "rto-1",
                previousFaultOwner: "carrier",
                nextFaultOwner: "brand",
            })
        ).toMatchObject({ ok: false, code: "BAD_REQUEST" });
    });

    test("only a new disposition or a changed fault owner needs the check", async () => {
        const { rtoFaultOwnerChanges } = await import("./rto-attribution");

        expect(rtoFaultOwnerChanges({ existing: null, nextFaultOwner: "unknown" })).toBe(true);
        expect(
            rtoFaultOwnerChanges({ existing: { faultOwner: "carrier" }, nextFaultOwner: "brand" })
        ).toBe(true);
        expect(
            rtoFaultOwnerChanges({ existing: { faultOwner: "brand" }, nextFaultOwner: "brand" })
        ).toBe(false);
    });

    test("every RTO fault-owner writer checks the lock before writing and audits after", async () => {
        const writers = [
            ["../trpc/routes/general/order-ops.ts", "upsertRtoDisposition:", ".insert(ctx.schemas.rtoDispositions)"],
            ["../../app/(protected)/dashboard/general/order-ops/page.tsx", "async function saveRtoDisposition", ".insert(rtoDispositions)"],
            ["../trpc/routes/general/returnReplace.ts", "setRtoAttribution:", ".update(rtoDispositions)"],
        ] as const;

        for (const [path, start, write] of writers) {
            const source = await Bun.file(new URL(path, import.meta.url)).text();
            const begin = source.indexOf(start);
            const check = source.indexOf("checkRtoAttributionWritable(", begin);
            const writeAt = source.indexOf(write, begin);
            const audit = source.indexOf("recordRtoAttributionAudit(", begin);

            expect(begin).toBeGreaterThanOrEqual(0);
            expect(check).toBeGreaterThan(begin);
            expect(check).toBeLessThan(writeAt);
            expect(audit).toBeGreaterThan(writeAt);
        }
    });
});
