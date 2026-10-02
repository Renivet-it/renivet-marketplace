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
    orders: null as Row[] | null,
    brands: null as Row[] | null,
    overrides: [] as Row[],
    alerts: [] as Row[],
    revokedClearances: [] as Row[],
    revokeSnapshots: [] as Row[],
    tdsUpserts: [] as Row[],
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
        listOrdersForFinanceWindow: async () => state.orders ?? [order()],
        listRefundsForPayoutWindow: async () => [],
        listPayoutOverrides: async () => state.overrides,
        listBrandsForPayout: async () => state.brands ?? [
            { brandId, brandName: "Brand One", payoutMethod: "razorpay_route" },
        ],
        listCarrierClaimsForFinanceWindow: async () => [],
        listRtoDispositionsForOrderIds: async () => [],
        listPayoutLineItems: async () => [],
        listCommissionRules: async () => state.commissionRules,
        getBrandTdsTracking: async () => null,
        upsertBrandTdsTracking: async (values: Row) => {
            state.tdsUpserts.push(values);
            return {};
        },
        replacePayoutLineItems: async (_cycleId: string, values: Row[]) => {
            state.replacedLineItems = values;
            return values;
        },
        updatePayoutCycle: async (id: string, values: Row) => {
            state.cycleUpdates.push(values);
            state.cycle = { ...state.cycle, ...values, id };
            return state.cycle;
        },
        getActivePayoutExecutionClearance: async () =>
            state.clearance && !state.clearance.revokedAt ? state.clearance : null,
        createPayoutExecutionClearance: async (values: Row) => {
            state.clearance = {
                id: `clearance-${state.revokedClearances.length + 1}`,
                clearedAt: new Date(),
                expiresAt: null,
                revokedAt: null,
                ...values,
            };
            return state.clearance;
        },
        revokeActivePayoutExecutionClearances: async (
            _cycleId: string,
            revokedBy: string,
            revocationReason: string
        ) => {
            state.revokeSnapshots.push({
                lineItemsWritten: state.replacedLineItems !== null,
                cycleUpdates: state.cycleUpdates.length,
            });
            if (!state.clearance || state.clearance.revokedAt) return [];
            const revoked = {
                ...state.clearance,
                revokedAt: new Date(),
                revokedBy,
                revocationReason,
            };
            state.revokedClearances.push(revoked);
            state.clearance = null;
            return [revoked];
        },
        addPayoutOverride: async (values: Row) => {
            state.overrideInserts.push(values);
            const row = { id: `override-${state.overrides.length + 1}`, ...values };
            state.overrides.push(row);
            return row;
        },
        getPayoutOverride: async (id: string) =>
            state.override ?? state.overrides.find((row) => row.id === id) ?? null,
        findLockedPayoutCycleForReferences: async (references: string[]) => {
            state.lockReferences.push(references);
            return state.lockedCycle;
        },
        updatePayoutOverride: async (id: string, values: Row) => {
            state.overrideUpdates.push(values);
            const stored = state.overrides.find((row) => row.id === id);
            if (stored) {
                Object.assign(stored, values);
                return stored;
            }
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
    auditAndAlert: async (event: Row) => {
        state.alerts.push(event);
        return {};
    },
}));

const payouts = await import("./payouts");

// An override is recorded by the maker and applied only when a different admin approves
// it (REN-253 F-2): this helper performs both steps.
async function createAndApproveOverride(
    input: Parameters<typeof payouts.createPayoutOverride>[0],
    approverId: string
) {
    const row = await payouts.createPayoutOverride(input);
    await payouts.approvePayoutOverride(row.id, approverId);
    return row;
}

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
    state.orders = null;
    state.brands = null;
    state.overrides = [];
    state.alerts = [];
    state.revokedClearances = [];
    state.revokeSnapshots = [];
    state.tdsUpserts = [];
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
    };

    test("rejects creating an override on a locked cycle before storing it", async () => {
        state.cycle = cycle("completed");

        await expect(payouts.createPayoutOverride(overrideInput)).rejects.toThrow(
            "Payout cycle recalculation blocked: cycle status is completed."
        );
        expect(state.overrideInserts).toHaveLength(0);
        expect(state.replacedLineItems).toBeNull();
    });

    test("records an override on a calculated cycle without applying it, then a different admin approves and applies it", async () => {
        state.cycle = cycle("calculated");

        const row = await payouts.createPayoutOverride(overrideInput);

        expect(state.overrideInserts).toHaveLength(1);
        expect(state.overrideInserts[0].approvedBy).toBeNull();
        expect(state.replacedLineItems).toBeNull();

        await payouts.approvePayoutOverride(row.id, "finance-2");

        expect(state.replacedLineItems).not.toBeNull();
        expect(state.overrideUpdates).toEqual([{ approvedBy: "finance-2" }]);
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

        // A configured source account is part of the execution contract (F-5): without it
        // execution is refused, so this test supplies one.
        await withRazorpay(providerAccepts, async () => {
            const updated = await payouts.executePayoutCycle("cycle-1", "finance-3");

            expect(updated.executedBy).toBe("finance-3");
        });
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

const brandA = "11111111-1111-4111-8111-111111111111";
const brandB = "22222222-2222-4222-8222-222222222222";
const accountX = "111100001111";
const accountY = "999900009999";

function orderForBrand(orderId: string, forBrand: string, price: number) {
    const base = order();
    base.id = orderId;
    base.paymentId = `pay_${orderId}`;
    base.items[0].product.brandId = forBrand;
    base.items[0].product.price = price;
    return base;
}

function ruleForBrand(forBrand: string) {
    return { ...approvedRule, id: `rule-${forBrand}`, brandId: forBrand };
}

function brandSummary(name: string) {
    return state.cycle!.calculationSummary.brands.find((item: Row) => item.brandId === name);
}

async function withRazorpay(
    respond: (call: number) => Response,
    run: (bodies: Row[]) => Promise<void>
) {
    const bodies: Row[] = [];
    const originalFetch = globalThis.fetch;
    const originalAccount = process.env.RAZORPAY_PAYOUT_SOURCE_ACCOUNT_NUMBER;
    process.env.RAZORPAY_PAYOUT_SOURCE_ACCOUNT_NUMBER = "test-source-account";
    globalThis.fetch = (async (_url: string, init: RequestInit) => {
        bodies.push(JSON.parse(String(init.body)));
        return respond(bodies.length);
    }) as unknown as typeof fetch;
    try {
        await run(bodies);
    } finally {
        globalThis.fetch = originalFetch;
        if (originalAccount === undefined) {
            delete process.env.RAZORPAY_PAYOUT_SOURCE_ACCOUNT_NUMBER;
        } else {
            process.env.RAZORPAY_PAYOUT_SOURCE_ACCOUNT_NUMBER = originalAccount;
        }
    }
}

const providerAccepts = () =>
    new Response(JSON.stringify({ id: "pout_1", status: "processing" }), { status: 200 });

async function calculateTwoBrandCycle() {
    state.brands = [
        {
            brandId: brandA,
            brandName: "Brand A",
            payoutMethod: "razorpay_route",
            bankAccountHolderName: "Brand A Pvt Ltd",
            bankAccountNumber: accountX,
            bankIfscCode: "HDFC0000001",
        },
        {
            brandId: brandB,
            brandName: "Brand B",
            payoutMethod: "razorpay_route",
            bankAccountHolderName: "Brand B Pvt Ltd",
            bankAccountNumber: "222200002222",
            bankIfscCode: "HDFC0000002",
        },
    ];
    state.orders = [
        orderForBrand("order-a", brandA, 100_000),
        orderForBrand("order-b", brandB, 100_000),
    ];
    state.commissionRules = [ruleForBrand(brandA), ruleForBrand(brandB)];
    state.cycle = cycle("draft");
    await payouts.calculatePayoutCycle("cycle-1", "finance-1");
}

describe("REN-253 F-1 an approved amount never stays approved after it changes", () => {
    const overrideForA = {
        cycleId: "cycle-1",
        brandId: brandA,
        adjustmentType: "manual_correction",
        amountPaise: 5_000,
        reasonCode: "correction",
        notes: "Correct a shipping deduction",
        proofFileUrl: "https://files.example.com/proof.pdf",
        actorId: "finance-1",
    };

    test("a partially approved cycle is still calculated, so recalculation is reachable", async () => {
        await calculateTwoBrandCycle();

        await payouts.approvePayoutCycle("cycle-1", "finance-2", brandA);

        expect(state.cycle!.status).toBe("calculated");
        expect(brandSummary(brandA).reviewStatus).toBe("approved");
    });

    test("an override that changes an approved brand drops its approval and blocks payment", async () => {
        await calculateTwoBrandCycle();
        await payouts.approvePayoutCycle("cycle-1", "finance-2", brandA);
        const approvedAmount = brandSummary(brandA).netPayablePaise;

        await createAndApproveOverride(overrideForA, "finance-2");

        const changed = brandSummary(brandA);
        expect(changed.netPayablePaise).toBe(approvedAmount + 5_000);
        expect(changed.reviewStatus).toBe("pending");
        expect(changed.executionStatus).toBe("pending_review");
        expect(changed.approvedBy).toBeNull();
        expect(changed.approvedAt).toBeNull();

        // Approving the other brand must not complete the cycle while A is unapproved.
        await payouts.approvePayoutCycle("cycle-1", "finance-2", brandB);
        expect(state.cycle!.status).toBe("calculated");
        state.clearance = {
            id: "clearance-1",
            cycleId: "cycle-1",
            clearedBy: "finance-2",
            evidenceReference: "BIZ-3-approval",
            transactionValidationReference: "txn-validation-1",
            transactionValidatedAt: new Date("2026-09-10T00:00:00.000Z"),
            clearedAt: new Date("2026-09-10T00:00:00.000Z"),
            expiresAt: null,
            revokedAt: null,
        };

        await withRazorpay(providerAccepts, async (bodies) => {
            await expect(
                payouts.executePayoutCycle("cycle-1", "finance-3")
            ).rejects.toThrow("Payout execution blocked: cycle status is calculated.");
            expect(bodies).toHaveLength(0);

            // Only a fresh approval of the changed amount makes it payable, and only that
            // amount is sent.
            await payouts.approvePayoutCycle("cycle-1", "finance-4", brandA);
            expect(state.cycle!.status).toBe("approved");
            expect(brandSummary(brandA).approvedBy).toBe("finance-4");
            await payouts.executePayoutCycle("cycle-1", "finance-3");
            expect(bodies.map((body) => body.amount).sort()).toEqual(
                [approvedAmount, approvedAmount + 5_000].sort()
            );
        });
    });

    test("a recalculation that does not change the amount keeps the approval", async () => {
        await calculateTwoBrandCycle();
        await payouts.approvePayoutCycle("cycle-1", "finance-2", brandA);

        await payouts.calculatePayoutCycle("cycle-1", "finance-1");

        const kept = brandSummary(brandA);
        expect(kept.reviewStatus).toBe("approved");
        expect(kept.executionStatus).toBe("approved");
        expect(kept.approvedBy).toBe("finance-2");
    });

    test("only the brand whose amount changed loses its approval", async () => {
        await calculateTwoBrandCycle();
        await payouts.approvePayoutCycle("cycle-1", "finance-2", brandA);
        await payouts.approvePayoutCycle("cycle-1", "finance-2", brandB);
        // Both brands approved makes the cycle "approved", so make B the only change by
        // calculating against a state where the cycle is still "calculated".
        state.cycle = { ...state.cycle!, status: "calculated" };
        state.orders = [
            orderForBrand("order-a", brandA, 100_000),
            orderForBrand("order-b", brandB, 250_000),
        ];

        await payouts.calculatePayoutCycle("cycle-1", "finance-1");

        expect(brandSummary(brandA).reviewStatus).toBe("approved");
        expect(brandSummary(brandB).reviewStatus).toBe("pending");
        expect(brandSummary(brandB).approvedBy).toBeNull();
    });

    test("the invalidation is recorded in the calculation audit metadata", async () => {
        await calculateTwoBrandCycle();
        await payouts.approvePayoutCycle("cycle-1", "finance-2", brandA);
        const approvedAmount = brandSummary(brandA).netPayablePaise;
        state.alerts = [];

        await createAndApproveOverride(overrideForA, "finance-2");

        const calculated = state.alerts.find(
            (event) => event.actionType === "payout_cycle_calculated"
        );
        expect(calculated?.metadata.invalidatedApprovals).toEqual([
            {
                brandId: brandA,
                previousNetPayablePaise: approvedAmount,
                netPayablePaise: approvedAmount + 5_000,
                changedFields: ["netPayablePaise", "overrideNetPaise"],
            },
        ]);
    });
});

describe("REN-253 N-1 an approval is bound to the payee as well as the amount", () => {
    test("a changed bank account with the same amount drops the approval and cannot be paid under it", async () => {
        await calculateTwoBrandCycle();
        await payouts.approvePayoutCycle("cycle-1", "finance-2", brandA);
        const approvedAmount = brandSummary(brandA).netPayablePaise;
        expect(brandSummary(brandA).metadata.bankAccountNumber).toBe(accountX);

        state.brands![0] = { ...state.brands![0], bankAccountNumber: accountY };
        state.alerts = [];
        await payouts.calculatePayoutCycle("cycle-1", "finance-1");

        const changed = brandSummary(brandA);
        expect(changed.netPayablePaise).toBe(approvedAmount);
        expect(changed.metadata.bankAccountNumber).toBe(accountY);
        expect(changed.reviewStatus).toBe("pending");
        expect(changed.executionStatus).toBe("pending_review");
        expect(changed.approvedBy).toBeNull();
        expect(changed.approvedAt).toBeNull();
        expect(
            state.alerts.find((event) => event.actionType === "payout_cycle_calculated")
                ?.metadata.invalidatedApprovals
        ).toEqual([
            {
                brandId: brandA,
                previousNetPayablePaise: approvedAmount,
                netPayablePaise: approvedAmount,
                changedFields: ["bankAccountNumber"],
            },
        ]);

        // The old approval of account X cannot authorize a payment to account Y.
        await payouts.approvePayoutCycle("cycle-1", "finance-2", brandB);
        expect(state.cycle!.status).toBe("calculated");
        await payouts.recordPayoutExecutionClearance({
            cycleId: "cycle-1",
            actorId: "finance-2",
            evidenceReference: "BIZ-3-approval",
            transactionValidationReference: "txn-validation-1",
            transactionValidatedAt: new Date("2026-09-10T00:00:00.000Z"),
        });

        await withRazorpay(providerAccepts, async (bodies) => {
            await expect(
                payouts.executePayoutCycle("cycle-1", "finance-3")
            ).rejects.toThrow("Payout execution blocked: cycle status is calculated.");
            expect(bodies).toHaveLength(0);

            await payouts.approvePayoutCycle("cycle-1", "finance-4", brandA);
            expect(brandSummary(brandA).approvedBy).toBe("finance-4");
            await payouts.executePayoutCycle("cycle-1", "finance-3");

            const accounts = bodies.map(
                (body) => body.fund_account.bank_account.account_number
            );
            expect(accounts).toContain(accountY);
            expect(accounts).not.toContain(accountX);
            const paidToA = bodies.find((body) => body.reference_id.endsWith(brandA));
            expect(paidToA?.fund_account.bank_account.account_number).toBe(accountY);
            expect(paidToA?.amount).toBe(approvedAmount);
        });
    });

    const payeeChanges = [
        ["bankIfscCode", { bankIfscCode: "ICIC0000009" }],
        ["bankAccountHolderName", { bankAccountHolderName: "Someone Else" }],
        ["payoutMethod", { payoutMethod: "manual_neft" }],
    ] as const;

    for (const [field, change] of payeeChanges) {
        test(`a changed ${field} drops the approval`, async () => {
            await calculateTwoBrandCycle();
            await payouts.approvePayoutCycle("cycle-1", "finance-2", brandA);
            await payouts.approvePayoutCycle("cycle-1", "finance-2", brandB);
            state.cycle = { ...state.cycle!, status: "calculated" };

            state.brands![0] = { ...state.brands![0], ...change };
            state.alerts = [];
            await payouts.calculatePayoutCycle("cycle-1", "finance-1");

            expect(brandSummary(brandA).reviewStatus).toBe("pending");
            expect(brandSummary(brandA).approvedBy).toBeNull();
            expect(brandSummary(brandB).reviewStatus).toBe("approved");
            expect(
                state.alerts.find((event) => event.actionType === "payout_cycle_calculated")
                    ?.metadata.invalidatedApprovals[0].changedFields
            ).toEqual([field]);
        });
    }
});

describe("REN-253 F-3 recalculation revokes the BIZ-3 clearance of a changed payout basis", () => {
    const tenPercentRule = { ...approvedRule, commissionPercentBps: 1000 };
    const clearanceInput = {
        cycleId: "cycle-1",
        actorId: "finance-2",
        evidenceReference: "BIZ-3-approval",
        transactionValidationReference: "txn-validation-1",
        transactionValidatedAt: new Date("2026-09-10T00:00:00.000Z"),
    };

    async function clearAtFirstAmount() {
        state.commissionRules = [tenPercentRule];
        state.cycle = cycle("draft");
        await payouts.calculatePayoutCycle("cycle-1", "finance-1");
        expect(brandSummary(brandId).netPayablePaise).toBe(89_900);
        return payouts.recordPayoutExecutionClearance(clearanceInput);
    }

    test("a clearance of 89,900 cannot pay 899,000 after recalculation", async () => {
        const oldClearance = await clearAtFirstAmount();
        state.financeAudits = [];
        state.alerts = [];
        state.replacedLineItems = null;
        state.cycleUpdates = [];
        state.revokeSnapshots = [];

        state.orders = [order(), orderForBrand("order-2", brandId, 900_000)];
        await payouts.calculatePayoutCycle("cycle-1", "finance-1");

        expect(brandSummary(brandId).netPayablePaise).toBe(899_000);
        // The old clearance is revoked, with who and why, before the new amounts land.
        expect(state.clearance).toBeNull();
        expect(state.revokedClearances).toHaveLength(1);
        expect(state.revokedClearances[0].id).toBe(oldClearance.id);
        expect(state.revokedClearances[0].revokedBy).toBe("finance-1");
        expect(state.revokedClearances[0].revocationReason).toBe("payout_basis_recalculated");
        expect(state.revokeSnapshots).toEqual([{ lineItemsWritten: false, cycleUpdates: 0 }]);
        const revocationAudit = state.financeAudits.find(
            (event) => event.actionType === "payout_execution_clearance_revoked"
        );
        expect(revocationAudit?.entityId).toBe(oldClearance.id);
        expect(revocationAudit?.reason).toBe("biz_3_clearance_revoked_by_recalculation");
        expect(revocationAudit?.actorId).toBe("finance-1");
        expect(
            state.alerts.find((event) => event.actionType === "payout_cycle_calculated")
                ?.metadata.revokedClearanceIds
        ).toEqual([oldClearance.id]);

        await payouts.approvePayoutCycle("cycle-1", "finance-1");
        await withRazorpay(providerAccepts, async (bodies) => {
            // No active clearance is left for the cycle.
            await expect(
                payouts.executePayoutCycle("cycle-1", "finance-3")
            ).rejects.toThrow("human_clearance_missing");
            expect(bodies).toHaveLength(0);
            expect(state.cycle!.status).toBe("approved");

            // A fresh clearance of the new basis pays the new amount, once.
            await payouts.recordPayoutExecutionClearance(clearanceInput);
            await payouts.executePayoutCycle("cycle-1", "finance-3");
            expect(bodies.map((body) => body.amount)).toEqual([899_000]);
        });
    });

    test("a recalculation that leaves the payout basis unchanged keeps the clearance", async () => {
        const clearance = await clearAtFirstAmount();
        state.financeAudits = [];

        await payouts.calculatePayoutCycle("cycle-1", "finance-1");

        expect(state.clearance?.id).toBe(clearance.id);
        expect(state.revokedClearances).toHaveLength(0);
        expect(
            state.financeAudits.some(
                (event) => event.actionType === "payout_execution_clearance_revoked"
            )
        ).toBe(false);
    });

    test("a changed payee with the same amount revokes the clearance", async () => {
        await calculateTwoBrandCycle();
        const clearance = await payouts.recordPayoutExecutionClearance(clearanceInput);

        state.brands![0] = { ...state.brands![0], bankAccountNumber: accountY };
        await payouts.calculatePayoutCycle("cycle-1", "finance-1");

        expect(state.clearance).toBeNull();
        expect(state.revokedClearances.map((row) => row.id)).toEqual([clearance.id]);
    });

    test("an applied override revokes the clearance", async () => {
        const clearance = await clearAtFirstAmount();

        await createAndApproveOverride(
            {
                cycleId: "cycle-1",
                brandId,
                adjustmentType: "manual_correction",
                amountPaise: 5_000,
                reasonCode: "correction",
                notes: "Correct a shipping deduction",
                proofFileUrl: "https://files.example.com/proof.pdf",
                actorId: "finance-1",
            },
            "finance-2"
        );

        expect(brandSummary(brandId).netPayablePaise).toBe(94_900);
        expect(state.revokedClearances.map((row) => row.id)).toEqual([clearance.id]);
    });

    test("a brand entering the cycle revokes the clearance", async () => {
        const clearance = await clearAtFirstAmount();

        state.brands = [
            { brandId, brandName: "Brand One", payoutMethod: "razorpay_route" },
            { brandId: brandB, brandName: "Brand B", payoutMethod: "razorpay_route" },
        ];
        state.orders = [order(), orderForBrand("order-b", brandB, 100_000)];
        state.commissionRules = [tenPercentRule, ruleForBrand(brandB)];
        await payouts.calculatePayoutCycle("cycle-1", "finance-1");

        expect(brandSummary(brandId).netPayablePaise).toBe(89_900);
        expect(state.revokedClearances.map((row) => row.id)).toEqual([clearance.id]);
    });
});

describe("REN-253 F-4 ordinary approval cannot reopen an executed cycle", () => {
    for (const status of ["failed", "processing", "completed"]) {
        test(`rejects approving a ${status} cycle without writing`, async () => {
            state.cycle = cycle(status, { brands: [] });

            await expect(
                payouts.approvePayoutCycle("cycle-1", "finance-1")
            ).rejects.toThrow(`Payout cycle approval blocked: cycle status is ${status}.`);
            await expect(
                payouts.approvePayoutCycle("cycle-1", "finance-1", brandId)
            ).rejects.toThrow(`Payout cycle approval blocked: cycle status is ${status}.`);
            expect(state.cycleUpdates).toHaveLength(0);
        });
    }

    test("approving a draft cycle still asks for calculation first", async () => {
        state.cycle = cycle("draft");

        await expect(
            payouts.approvePayoutCycle("cycle-1", "finance-1")
        ).rejects.toThrow("Run calculation before approval.");
    });

    test("a calculated cycle can be approved and an approved cycle can be executed", async () => {
        await prepareExecutableCycle("finance-2");
        expect(state.cycle!.status).toBe("approved");

        await withRazorpay(providerAccepts, async (bodies) => {
            const updated = await payouts.executePayoutCycle("cycle-1", "finance-3");

            expect(bodies).toHaveLength(1);
            expect(updated.status).toBe("completed");
        });
    });

    test("a provider failure does not become a second payout through ordinary re-approval", async () => {
        await prepareExecutableCycle("finance-2");

        await withRazorpay(
            (call) =>
                call === 1 ? new Response("gateway timeout", { status: 504 }) : providerAccepts(),
            async (bodies) => {
                await payouts.executePayoutCycle("cycle-1", "finance-3");
                expect(state.cycle!.status).toBe("failed");
                expect(bodies).toHaveLength(1);

                await expect(
                    payouts.approvePayoutCycle("cycle-1", "finance-2")
                ).rejects.toThrow("Payout cycle approval blocked: cycle status is failed.");
                await expect(
                    payouts.executePayoutCycle("cycle-1", "finance-3")
                ).rejects.toThrow("Payout execution blocked: cycle status is failed.");

                expect(state.cycle!.status).toBe("failed");
                expect(bodies).toHaveLength(1);
            }
        );
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

describe("REN-253 F-2 the maker never supplies the override checker", () => {
    const overrideBase = {
        cycleId: "cycle-1",
        brandId: brandA,
        adjustmentType: "manual_correction",
        amountPaise: 5_000,
        reasonCode: "correction",
        notes: "Correct a shipping deduction",
        proofFileUrl: "https://files.example.com/proof.pdf",
        actorId: "finance-1",
    };

    async function clearedPartiallyApprovedCycle() {
        await calculateTwoBrandCycle();
        await payouts.approvePayoutCycle("cycle-1", "finance-2", brandA);
        expect(state.cycle!.status).toBe("calculated");
        return payouts.recordPayoutExecutionClearance({
            cycleId: "cycle-1",
            actorId: "finance-2",
            evidenceReference: "BIZ-3-approval",
            transactionValidationReference: "txn-validation-1",
            transactionValidatedAt: new Date("2026-09-10T00:00:00.000Z"),
        });
    }

    test("a recorded override is unapproved, applies no amount and revokes no clearance", async () => {
        const clearance = await clearedPartiallyApprovedCycle();
        const before = brandSummary(brandA).netPayablePaise;
        state.replacedLineItems = null;

        const row = await payouts.createPayoutOverride(overrideBase);

        expect(row.approvedBy).toBeNull();
        expect(state.overrideInserts[0].createdBy).toBe("finance-1");
        expect(state.replacedLineItems).toBeNull();
        expect(brandSummary(brandA).netPayablePaise).toBe(before);
        expect(brandSummary(brandA).reviewStatus).toBe("approved");
        expect(state.revokedClearances).toHaveLength(0);
        expect(state.clearance?.id).toBe(clearance.id);
    });

    test("an approver smuggled in with the request is ignored", async () => {
        await calculateTwoBrandCycle();
        state.replacedLineItems = null;

        const row = await payouts.createPayoutOverride({
            ...overrideBase,
            approverId: "any-user-id-that-never-acted",
        } as typeof overrideBase);

        expect(row.approvedBy).toBeNull();
        expect(state.overrideInserts[0].approvedBy).toBeNull();
        expect(state.replacedLineItems).toBeNull();
    });

    test("the creator cannot approve their own override", async () => {
        await calculateTwoBrandCycle();
        const row = await payouts.createPayoutOverride(overrideBase);
        state.overrideUpdates = [];

        await expect(payouts.approvePayoutOverride(row.id, "finance-1")).rejects.toThrow(
            "The same admin cannot approve this override."
        );
        expect(state.overrideUpdates).toHaveLength(0);
    });

    test("a different admin's approval applies the override, drops the approval and revokes the clearance", async () => {
        const clearance = await clearedPartiallyApprovedCycle();
        const before = brandSummary(brandA).netPayablePaise;
        const row = await payouts.createPayoutOverride(overrideBase);

        await payouts.approvePayoutOverride(row.id, "finance-3");

        expect(state.overrides[0].approvedBy).toBe("finance-3");
        expect(brandSummary(brandA).netPayablePaise).toBe(before + 5_000);
        expect(brandSummary(brandA).reviewStatus).toBe("pending");
        expect(state.revokedClearances.map((item) => item.id)).toEqual([clearance.id]);
    });

    test("an override that is already approved cannot be approved again", async () => {
        await calculateTwoBrandCycle();
        const row = await payouts.createPayoutOverride(overrideBase);
        await payouts.approvePayoutOverride(row.id, "finance-2");
        state.overrideUpdates = [];

        await expect(payouts.approvePayoutOverride(row.id, "finance-3")).rejects.toThrow(
            "This override is already approved."
        );
        expect(state.overrideUpdates).toHaveLength(0);
    });

    test("neither the router input nor the workspace form carries an approver field", async () => {
        const router = await Bun.file(
            new URL("../trpc/routes/general/finance.ts", import.meta.url)
        ).text();
        const begin = router.indexOf("createPayoutOverride: adminProcedure");
        const end = router.indexOf("approvePayoutOverride: adminProcedure", begin);
        expect(begin).toBeGreaterThanOrEqual(0);
        expect(router.slice(begin, end)).not.toContain("approverId");

        const ui = await Bun.file(
            new URL(
                "../../components/dashboard/general/finance/payouts-workspace.tsx",
                import.meta.url
            )
        ).text();
        expect(ui).not.toContain("approverId");
    });
});

describe("REN-253 F-5 a missing payout source account fails closed", () => {
    async function withoutSourceAccount(
        value: string | undefined,
        run: (providerCalls: () => number) => Promise<void>
    ) {
        let calls = 0;
        const originalFetch = globalThis.fetch;
        const originalAccount = process.env.RAZORPAY_PAYOUT_SOURCE_ACCOUNT_NUMBER;
        if (value === undefined) delete process.env.RAZORPAY_PAYOUT_SOURCE_ACCOUNT_NUMBER;
        else process.env.RAZORPAY_PAYOUT_SOURCE_ACCOUNT_NUMBER = value;
        globalThis.fetch = (async () => {
            calls += 1;
            return providerAccepts();
        }) as unknown as typeof fetch;
        try {
            await run(() => calls);
        } finally {
            globalThis.fetch = originalFetch;
            if (originalAccount === undefined) {
                delete process.env.RAZORPAY_PAYOUT_SOURCE_ACCOUNT_NUMBER;
            } else {
                process.env.RAZORPAY_PAYOUT_SOURCE_ACCOUNT_NUMBER = originalAccount;
            }
        }
    }

    for (const [label, value] of [
        ["unset", undefined],
        ["empty", ""],
        ["whitespace only", "   "],
    ] as const) {
        test(`execution is refused before any state change when the source account is ${label}`, async () => {
            await prepareExecutableCycle("finance-2");
            const cycleWritesBefore = state.cycleUpdates.length;
            state.alerts = [];
            state.financeAudits = [];

            await withoutSourceAccount(value, async (providerCalls) => {
                await expect(
                    payouts.executePayoutCycle("cycle-1", "finance-3")
                ).rejects.toThrow(
                    "Payout execution blocked: RAZORPAY_PAYOUT_SOURCE_ACCOUNT_NUMBER is not configured."
                );
                expect(providerCalls()).toBe(0);
            });

            expect(state.cycle!.status).toBe("approved");
            expect(brandSummary(brandId).executionStatus).toBe("approved");
            expect(brandSummary(brandId).transactionId ?? null).toBeNull();
            expect(state.cycleUpdates).toHaveLength(cycleWritesBefore);
            expect(state.tdsUpserts).toHaveLength(0);
            expect(
                state.alerts.filter((event) => event.actionType === "brand_payout_executed")
            ).toHaveLength(0);
            expect(
                state.financeAudits.filter(
                    (event) => event.actionType === "tds_deduction.applied"
                )
            ).toHaveLength(0);
            const blocked = state.financeAudits.find(
                (event) => event.actionType === "payout_execution_blocked_unconfigured"
            );
            expect(blocked?.afterValue.missing).toEqual(["RAZORPAY_PAYOUT_SOURCE_ACCOUNT_NUMBER"]);
            expect(blocked?.afterValue.brandIds).toEqual([brandId]);
        });
    }

    test("a refused configuration is not terminal: the cycle can be executed once configured", async () => {
        await prepareExecutableCycle("finance-2");

        await withoutSourceAccount(undefined, async () => {
            await expect(payouts.executePayoutCycle("cycle-1", "finance-3")).rejects.toThrow(
                "is not configured"
            );
        });
        await withoutSourceAccount("test-source-account", async (providerCalls) => {
            await payouts.executePayoutCycle("cycle-1", "finance-3");
            expect(providerCalls()).toBe(1);
        });

        expect(brandSummary(brandId).executionStatus).toBe("completed");
    });

    test("a cycle with only manual NEFT brands still produces instructions without a source account", async () => {
        state.brands = [
            {
                brandId,
                brandName: "Brand One",
                payoutMethod: "manual_neft",
                bankAccountHolderName: "Brand One Pvt Ltd",
                bankAccountNumber: accountX,
                bankIfscCode: "HDFC0000001",
            },
        ];
        await prepareExecutableCycle("finance-2");

        await withoutSourceAccount(undefined, async (providerCalls) => {
            await payouts.executePayoutCycle("cycle-1", "finance-3");
            expect(providerCalls()).toBe(0);
        });

        expect(brandSummary(brandId).executionStatus).toBe("awaiting_manual_confirmation");
        expect(brandSummary(brandId).transactionId ?? null).toBeNull();
    });

    test("a mixed cycle is refused whole: no manual instruction is generated either", async () => {
        await calculateTwoBrandCycle();
        brandSummary(brandB).payoutMethod = "manual_neft";
        await payouts.approvePayoutCycle("cycle-1", "finance-2");
        await payouts.recordPayoutExecutionClearance({
            cycleId: "cycle-1",
            actorId: "finance-2",
            evidenceReference: "BIZ-3-approval",
            transactionValidationReference: "txn-validation-1",
            transactionValidatedAt: new Date("2026-09-10T00:00:00.000Z"),
        });
        expect(state.cycle!.status).toBe("approved");

        await withoutSourceAccount(undefined, async (providerCalls) => {
            await expect(payouts.executePayoutCycle("cycle-1", "finance-3")).rejects.toThrow(
                "is not configured"
            );
            expect(providerCalls()).toBe(0);
        });

        expect(brandSummary(brandB).executionStatus).toBe("approved");
        expect(state.cycle!.status).toBe("approved");
    });

    test("the success-shaped manual fallback is gone from the provider adapter", async () => {
        const source = await Bun.file(new URL("./payouts.ts", import.meta.url)).text();
        expect(source).not.toContain("queued_manual_fallback");
        expect(source).toContain("export class PayoutConfigurationError");
    });
});
