import { beforeEach, describe, expect, mock, test } from "bun:test";
import { resolve } from "node:path";

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
    otherCycles: [] as Row[],
    // failure injection and interleaving hooks
    failFinanceAudit: null as null | ((event: Row) => boolean),
    failAlert: null as null | ((event: Row) => boolean),
    failTdsUpsert: false,
    failCycleWrite: null as null | ((values: Row) => boolean),
    beforeCycleWrite: null as null | ((values: Row) => Promise<void>),
    afterClaim: null as null | (() => Promise<void>),
    afterRevoke: null as null | (() => Promise<void>),
    onAlert: null as null | ((event: Row) => void),
    listBrandsCalls: 0,
    liveOverride: null as null | ((callNo: number, row: Row) => Row),
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
        // jsonb round trip: reads and writes never share object references with the code
        getPayoutCycle: async () => (state.cycle ? JSON.parse(JSON.stringify(state.cycle)) : state.cycle),
        listPayoutCycles: async () => (state.cycle ? [state.cycle] : []),
        listAllPayoutCycles: async () => [...(state.cycle ? [state.cycle] : []), ...state.otherCycles],
        listOrdersForFinanceWindow: async () => state.orders ?? [order()],
        listRefundsForPayoutWindow: async () => [],
        listPayoutOverrides: async () => state.overrides,
        listBrandsForPayout: async () => {
            state.listBrandsCalls += 1;
            const callNo = state.listBrandsCalls;
            return (state.brands ?? [
                { brandId, brandName: "Brand One", payoutMethod: "razorpay_route" },
            ]).map((row: Row) => {
                const live = { confidentialVerificationStatus: "approved", ...row };
                return state.liveOverride ? state.liveOverride(callNo, live) : live;
            });
        },
        listCarrierClaimsForFinanceWindow: async () => [],
        listRtoDispositionsForOrderIds: async () => [],
        listPayoutLineItems: async () => [],
        listCommissionRules: async () => state.commissionRules,
        getBrandTdsTracking: async (forBrand: string, financialYear: string) =>
            [...state.tdsUpserts]
                .reverse()
                .find((row) => row.brandId === forBrand && row.financialYear === financialYear) ?? null,
        upsertBrandTdsTracking: async (values: Row) => {
            if (state.failTdsUpsert) throw new Error("tds ledger unavailable");
            state.tdsUpserts.push(values);
            return {};
        },
        replacePayoutLineItems: async (_cycleId: string, values: Row[]) => {
            state.replacedLineItems = values;
            return values;
        },
        updatePayoutCycle: async (id: string, values: Row) => {
            state.cycleUpdates.push(values);
            state.cycle = { ...state.cycle, ...JSON.parse(JSON.stringify(values)), id };
            return JSON.parse(JSON.stringify(state.cycle));
        },
        updatePayoutCycleIf: async (
            id: string,
            condition: { statusIn: string[]; basisFingerprint?: string; calculationSummary?: Row | null },
            values: Row
        ) => {
            // Models the single conditional UPDATE: it applies or it does not, atomically.
            await state.beforeCycleWrite?.(values);
            if (state.failCycleWrite?.(values)) throw new Error("database unavailable");
            if (!state.cycle || state.cycle.id !== id) return undefined;
            if (!condition.statusIn.includes(state.cycle.status)) return undefined;
            if (
                condition.basisFingerprint !== undefined &&
                state.cycle.calculationSummary?.basisFingerprint !== condition.basisFingerprint
            ) {
                return undefined;
            }
            if (
                condition.calculationSummary !== undefined &&
                JSON.stringify(state.cycle.calculationSummary) !== JSON.stringify(condition.calculationSummary)
            ) {
                return undefined;
            }
            state.cycleUpdates.push(values);
            state.cycle = { ...state.cycle, ...JSON.parse(JSON.stringify(values)), id };
            if (values.status === "processing") await state.afterClaim?.();
            return JSON.parse(JSON.stringify(state.cycle));
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
            let result: Row[] = [];
            if (state.clearance && !state.clearance.revokedAt) {
                const revoked = {
                    ...state.clearance,
                    revokedAt: new Date(),
                    revokedBy,
                    revocationReason,
                };
                state.revokedClearances.push(revoked);
                state.clearance = null;
                result = [revoked];
            }
            await state.afterRevoke?.();
            return result;
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
        if (state.failFinanceAudit?.(event)) throw new Error("audit store down");
        state.financeAudits.push(event);
        return event;
    },
}));

mock.module("@/lib/monitoring-sla/audit", () => ({
    auditAndAlert: async (event: Row) => {
        state.onAlert?.(event);
        if (state.failAlert?.(event)) throw new Error("alert store down");
        state.alerts.push(event);
        return {};
    },
}));

const payouts = await import("./payouts");
const { computePayoutBasisFingerprint } = await import("./payout-basis");

// The payout basis the operator would be shown for the cycle as it stands.
function currentBasis() {
    const row = state.cycle;
    if (!row) return "no-cycle";
    return computePayoutBasisFingerprint(row.id, row.calculationSummary?.brands ?? []);
}
const executeNow = (
    cycleId: string,
    actorId: string,
    brandId?: string,
    expectedBasis: string = currentBasis()
) => payouts.executePayoutCycle(cycleId, actorId, brandId, expectedBasis);
const approveNow = (
    cycleId: string,
    actorId: string,
    brandId?: string,
    expectedBasis: string = currentBasis()
) => payouts.approvePayoutCycle(cycleId, actorId, brandId, expectedBasis);
const clearNow = (
    input: Omit<Parameters<typeof payouts.recordPayoutExecutionClearance>[0], "expectedBasis"> & {
        expectedBasis?: string;
    }
) => payouts.recordPayoutExecutionClearance({ ...input, expectedBasis: input.expectedBasis ?? currentBasis() });

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
    state.otherCycles = [];
    state.failFinanceAudit = null;
    state.failAlert = null;
    state.failTdsUpsert = false;
    state.failCycleWrite = null;
    state.beforeCycleWrite = null;
    state.afterRevoke = null;
    state.afterClaim = null;
    state.onAlert = null;
    state.listBrandsCalls = 0;
    state.liveOverride = null;
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
            executeNow("cycle-1", "finance-2")
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
        metadata: { basisFingerprint: currentBasis() },
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
                executeNow("cycle-1", "finance-2")
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
            const updated = await executeNow("cycle-1", "finance-3");

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
            await executeNow("cycle-1", "finance-3");

            expect(calls).toHaveLength(1);
            expect(calls[0]["X-Payout-Idempotency"]).toBe(
                buildPayoutIdempotencyKey("cycle-1", brandId)
            );
        });
    });

    test("REN-253 C-1: a concurrent replay of the same execution reaches the provider once", async () => {
        await prepareExecutableCycle("finance-2");

        await withProvider(async (calls) => {
            // Both requests read the same approved cycle; only the claim holder may call.
            const results = await Promise.allSettled([
                executeNow("cycle-1", "finance-3"),
                executeNow("cycle-1", "finance-3"),
            ]);

            expect(calls).toHaveLength(1);
            expect(results.filter((result) => result.status === "fulfilled")).toHaveLength(1);
            const rejected = results.find((result) => result.status === "rejected") as
                | PromiseRejectedResult
                | undefined;
            expect(String(rejected?.reason?.message)).toContain("already claimed");
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
                await executeNow("cycle-1", "finance-3");
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
            await executeNow("cycle-1", "finance-3");
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

        await approveNow("cycle-1", "finance-2", brandA);

        expect(state.cycle!.status).toBe("calculated");
        expect(brandSummary(brandA).reviewStatus).toBe("approved");
    });

    test("an override that changes an approved brand drops its approval and blocks payment", async () => {
        await calculateTwoBrandCycle();
        await approveNow("cycle-1", "finance-2", brandA);
        const approvedAmount = brandSummary(brandA).netPayablePaise;

        await createAndApproveOverride(overrideForA, "finance-2");

        const changed = brandSummary(brandA);
        expect(changed.netPayablePaise).toBe(approvedAmount + 5_000);
        expect(changed.reviewStatus).toBe("pending");
        expect(changed.executionStatus).toBe("pending_review");
        expect(changed.approvedBy).toBeNull();
        expect(changed.approvedAt).toBeNull();

        // Approving the other brand must not complete the cycle while A is unapproved.
        await approveNow("cycle-1", "finance-2", brandB);
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
        metadata: { basisFingerprint: currentBasis() },
        };

        await withRazorpay(providerAccepts, async (bodies) => {
            await expect(
                executeNow("cycle-1", "finance-3")
            ).rejects.toThrow("Payout execution blocked: cycle status is calculated.");
            expect(bodies).toHaveLength(0);

            // Only a fresh approval of the changed amount makes it payable, and only that
            // amount is sent.
            await approveNow("cycle-1", "finance-4", brandA);
            expect(state.cycle!.status).toBe("approved");
            expect(brandSummary(brandA).approvedBy).toBe("finance-4");
            await executeNow("cycle-1", "finance-3");
            expect(bodies.map((body) => body.amount).sort()).toEqual(
                [approvedAmount, approvedAmount + 5_000].sort()
            );
        });
    });

    test("a recalculation that does not change the amount keeps the approval", async () => {
        await calculateTwoBrandCycle();
        await approveNow("cycle-1", "finance-2", brandA);

        await payouts.calculatePayoutCycle("cycle-1", "finance-1");

        const kept = brandSummary(brandA);
        expect(kept.reviewStatus).toBe("approved");
        expect(kept.executionStatus).toBe("approved");
        expect(kept.approvedBy).toBe("finance-2");
    });

    test("only the brand whose amount changed loses its approval", async () => {
        await calculateTwoBrandCycle();
        await approveNow("cycle-1", "finance-2", brandA);
        await approveNow("cycle-1", "finance-2", brandB);
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
        await approveNow("cycle-1", "finance-2", brandA);
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
                // the applied override is also a new contributing reference
                changedFields: ["netPayablePaise", "overrideNetPaise", "referencesDigest"],
            },
        ]);
    });
});

describe("REN-253 N-1 an approval is bound to the payee as well as the amount", () => {
    test("a changed bank account with the same amount drops the approval and cannot be paid under it", async () => {
        await calculateTwoBrandCycle();
        await approveNow("cycle-1", "finance-2", brandA);
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
        await approveNow("cycle-1", "finance-2", brandB);
        expect(state.cycle!.status).toBe("calculated");
        await clearNow({
            cycleId: "cycle-1",
            actorId: "finance-2",
            evidenceReference: "BIZ-3-approval",
            transactionValidationReference: "txn-validation-1",
            transactionValidatedAt: new Date("2026-09-10T00:00:00.000Z"),
        });

        await withRazorpay(providerAccepts, async (bodies) => {
            await expect(
                executeNow("cycle-1", "finance-3")
            ).rejects.toThrow("Payout execution blocked: cycle status is calculated.");
            expect(bodies).toHaveLength(0);

            await approveNow("cycle-1", "finance-4", brandA);
            expect(brandSummary(brandA).approvedBy).toBe("finance-4");
            await executeNow("cycle-1", "finance-3");

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
            await approveNow("cycle-1", "finance-2", brandA);
            await approveNow("cycle-1", "finance-2", brandB);
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
        return clearNow(clearanceInput);
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
        expect(state.revokeSnapshots).toEqual([{ lineItemsWritten: false, cycleUpdates: 1 }]);
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

        await approveNow("cycle-1", "finance-1");
        await withRazorpay(providerAccepts, async (bodies) => {
            // No active clearance is left for the cycle.
            await expect(
                executeNow("cycle-1", "finance-3")
            ).rejects.toThrow("human_clearance_missing");
            expect(bodies).toHaveLength(0);
            expect(state.cycle!.status).toBe("approved");

            // A fresh clearance of the new basis pays the new amount, once.
            await clearNow(clearanceInput);
            await executeNow("cycle-1", "finance-3");
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
        const clearance = await clearNow(clearanceInput);

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
                approveNow("cycle-1", "finance-1")
            ).rejects.toThrow(`Payout cycle approval blocked: cycle status is ${status}.`);
            await expect(
                approveNow("cycle-1", "finance-1", brandId)
            ).rejects.toThrow(`Payout cycle approval blocked: cycle status is ${status}.`);
            expect(state.cycleUpdates).toHaveLength(0);
        });
    }

    test("approving a draft cycle still asks for calculation first", async () => {
        state.cycle = cycle("draft");

        await expect(
            approveNow("cycle-1", "finance-1")
        ).rejects.toThrow("Run calculation before approval.");
    });

    test("a calculated cycle can be approved and an approved cycle can be executed", async () => {
        await prepareExecutableCycle("finance-2");
        expect(state.cycle!.status).toBe("approved");

        await withRazorpay(providerAccepts, async (bodies) => {
            const updated = await executeNow("cycle-1", "finance-3");

            expect(bodies).toHaveLength(1);
            expect(updated.status).toBe("completed");
        });
    });

    test("a provider failure does not become a second payout through ordinary re-approval", async () => {
        await prepareExecutableCycle("finance-2");

        await withRazorpay(
            (call) =>
                call === 1 ? new Response("invalid account", { status: 422 }) : providerAccepts(),
            async (bodies) => {
                await executeNow("cycle-1", "finance-3");
                expect(state.cycle!.status).toBe("failed");
                expect(bodies).toHaveLength(1);

                await expect(
                    approveNow("cycle-1", "finance-2")
                ).rejects.toThrow("Payout cycle approval blocked: cycle status is failed.");
                await expect(
                    executeNow("cycle-1", "finance-3")
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
        await approveNow("cycle-1", "finance-2", brandA);
        expect(state.cycle!.status).toBe("calculated");
        return clearNow({
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
                    executeNow("cycle-1", "finance-3")
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
            await expect(executeNow("cycle-1", "finance-3")).rejects.toThrow(
                "is not configured"
            );
        });
        await withoutSourceAccount("test-source-account", async (providerCalls) => {
            await executeNow("cycle-1", "finance-3");
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
            await executeNow("cycle-1", "finance-3");
            expect(providerCalls()).toBe(0);
        });

        expect(brandSummary(brandId).executionStatus).toBe("awaiting_manual_confirmation");
        expect(brandSummary(brandId).transactionId ?? null).toBeNull();
    });

    test("a mixed cycle is refused whole: no manual instruction is generated either", async () => {
        await calculateTwoBrandCycle();
        brandSummary(brandB).payoutMethod = "manual_neft";
        state.cycle!.calculationSummary.basisFingerprint = currentBasis();
        await approveNow("cycle-1", "finance-2");
        await clearNow({
            cycleId: "cycle-1",
            actorId: "finance-2",
            evidenceReference: "BIZ-3-approval",
            transactionValidationReference: "txn-validation-1",
            transactionValidatedAt: new Date("2026-09-10T00:00:00.000Z"),
        });
        expect(state.cycle!.status).toBe("approved");

        await withoutSourceAccount(undefined, async (providerCalls) => {
            await expect(executeNow("cycle-1", "finance-3")).rejects.toThrow(
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

// ---------------------------------------------------------------------------------------
// REN-253 night remediation: N-2 outcome safety, execution claim, basis binding, G-8.
// ---------------------------------------------------------------------------------------

const copy = <T>(value: T): T => JSON.parse(JSON.stringify(value));

async function prepareExecutableTwoBrandCycle() {
    await calculateTwoBrandCycle();
    await approveNow("cycle-1", "finance-2");
    await clearNow({
        cycleId: "cycle-1",
        actorId: "finance-2",
        evidenceReference: "BIZ-3-approval",
        transactionValidationReference: "txn-validation-1",
        transactionValidatedAt: new Date("2026-09-10T00:00:00.000Z"),
    });
    expect(state.cycle!.status).toBe("approved");
}

function startSecondCycle(firstCycle: Row, payoutDate = "2026-09-17") {
    state.otherCycles = [copy(firstCycle)];
    state.cycle = {
        ...cycle("calculated"),
        id: "cycle-2",
        cycleKey: "2026-09-B",
        payoutDate,
    };
    state.clearance = null;
    state.replacedLineItems = null;
}

describe("REN-253 N-2 provider outcome is classified separately from bookkeeping", () => {
    test("provider rejection: the brand failed, definitely not paid, and says so", async () => {
        await prepareExecutableCycle("finance-2");

        await withRazorpay(
            () => new Response("invalid account", { status: 422 }),
            async (bodies) => {
                await executeNow("cycle-1", "finance-3");
                expect(bodies).toHaveLength(1);
            }
        );

        const brand = brandSummary(brandId);
        expect(brand.executionStatus).toBe("failed");
        expect(brand.transactionId ?? null).toBeNull();
        expect(brand.metadata.providerOutcome).toBe("rejected");
        expect(brand.metadata.providerStatus).toBe(422);
        expect(state.cycle!.status).toBe("failed");
        expect(state.tdsUpserts).toHaveLength(0);
    });

    test("provider acceptance: the transaction is persisted before any bookkeeping runs", async () => {
        await prepareExecutableCycle("finance-2");
        let persistedAtAlert: Row | null = null;
        state.onAlert = (event) => {
            if (event.actionType === "brand_payout_executed") {
                persistedAtAlert = copy(brandSummary(brandId));
            }
        };

        await withRazorpay(providerAccepts, async (bodies) => {
            await executeNow("cycle-1", "finance-3");
            expect(bodies).toHaveLength(1);
        });

        expect(persistedAtAlert).not.toBeNull();
        expect(persistedAtAlert!.executionStatus).toBe("completed");
        expect(persistedAtAlert!.transactionId).toBe("pout_1");
        expect(brandSummary(brandId).metadata.providerOutcome).toBe("accepted");
        expect(state.cycle!.status).toBe("completed");
    });

    test("provider acceptance + audit/alert failure: still paid, never an ordinary failed payout", async () => {
        await prepareExecutableCycle("finance-2");
        state.failAlert = (event) => event.actionType === "brand_payout_executed";

        await withRazorpay(providerAccepts, async (bodies) => {
            await executeNow("cycle-1", "finance-3");
            expect(bodies).toHaveLength(1);
        });

        const brand = brandSummary(brandId);
        expect(brand.executionStatus).toBe("completed");
        expect(brand.transactionId).toBe("pout_1");
        expect(state.cycle!.status).toBe("completed");
        expect(brand.metadata.bookkeepingPending.map((item: Row) => item.step)).toContain("executed_alert");
        expect(state.alerts.some((event) => event.actionType === "brand_payout_failed")).toBe(false);
    });

    test("provider acceptance + TDS audit failure: still paid, marker recorded, other bookkeeping continues", async () => {
        await prepareExecutableCycle("finance-2");
        state.failFinanceAudit = (event) => event.actionType === "tds_deduction.applied";

        await withRazorpay(providerAccepts, async () => {
            await executeNow("cycle-1", "finance-3");
        });

        const brand = brandSummary(brandId);
        expect(brand.executionStatus).toBe("completed");
        expect(brand.transactionId).toBe("pout_1");
        expect(state.cycle!.status).toBe("completed");
        expect(brand.metadata.bookkeepingPending.map((item: Row) => item.step)).toEqual(["tds_audit"]);
        expect(state.tdsUpserts).toHaveLength(1);
    });

    test("provider acceptance + TDS ledger failure: still paid, the failure is recorded and not retried into a second payout", async () => {
        await prepareExecutableCycle("finance-2");
        state.failTdsUpsert = true;

        await withRazorpay(providerAccepts, async (bodies) => {
            await executeNow("cycle-1", "finance-3");
            expect(bodies).toHaveLength(1);
        });

        const brand = brandSummary(brandId);
        expect(brand.executionStatus).toBe("completed");
        expect(brand.transactionId).toBe("pout_1");
        expect(state.cycle!.status).toBe("completed");
        expect(
            brand.metadata.bookkeepingPending.map((item: Row) => item.step)
        ).toContain("tds_ledger");
    });

    test("provider acceptance + persistence failure: unresolved, not failed, not retried, not replayable", async () => {
        await prepareExecutableCycle("finance-2");
        state.failCycleWrite = (values) =>
            values.calculationSummary?.brands?.some((brand: Row) => brand.executionStatus === "completed") ?? false;

        await withRazorpay(providerAccepts, async (bodies) => {
            await expect(executeNow("cycle-1", "finance-3")).rejects.toThrow(
                /transaction pout_1.*unresolved/
            );
            expect(bodies).toHaveLength(1);

            state.failCycleWrite = null;
            // The durable pre-call record marks the brand unresolved: it is `processing`,
            // never `failed`, and carries no invented transaction.
            const brand = brandSummary(brandId);
            expect(brand.executionStatus).toBe("processing");
            expect(brand.transactionId ?? null).toBeNull();
            expect(brand.metadata.providerCall.state).toBe("started");
            expect(state.cycle!.status).toBe("processing");

            // Replay: execution is refused locally and the provider is not called again.
            await expect(executeNow("cycle-1", "finance-3")).rejects.toThrow(
                "Payout execution blocked: cycle status is processing."
            );
            expect(bodies).toHaveLength(1);
        });
    });

    test("crash before the provider call: nothing was sent, the cycle stays claimed and cannot be replayed", async () => {
        await prepareExecutableCycle("finance-2");
        state.failCycleWrite = (values) =>
            values.calculationSummary?.brands?.some((brand: Row) => brand.executionStatus === "processing") ?? false;

        await withRazorpay(providerAccepts, async (bodies) => {
            await expect(executeNow("cycle-1", "finance-3")).rejects.toThrow("database unavailable");
            expect(bodies).toHaveLength(0);

            state.failCycleWrite = null;
            await expect(executeNow("cycle-1", "finance-3")).rejects.toThrow(
                "Payout execution blocked: cycle status is processing."
            );
            expect(bodies).toHaveLength(0);
        });
    });

    for (const [label, respond] of [
        ["HTTP 504", () => new Response("gateway timeout", { status: 504 })],
        ["HTTP 500", () => new Response("error", { status: 500 })],
        ["HTTP 409", () => new Response("conflict", { status: 409 })],
        ["a network error", () => {
            throw new Error("socket hang up");
        }],
        ["an unreadable 2xx body", () => new Response("<html>ok</html>", { status: 200 })],
        ["a 2xx body without a payout id", () => new Response(JSON.stringify({ status: "queued" }), { status: 200 })],
    ] as const) {
        test(`unknown outcome (${label}): unresolved, never failed, never a synthetic transaction, execution halts`, async () => {
            await prepareExecutableTwoBrandCycle();

            await withRazorpay(respond as () => Response, async (bodies) => {
                await executeNow("cycle-1", "finance-3");
                // the first brand's outcome is unknown, so no further provider call is made
                expect(bodies).toHaveLength(1);
            });

            const first = state.cycle!.calculationSummary.brands.find(
                (brand: Row) => brand.metadata.providerOutcome === "unknown"
            );
            expect(first.executionStatus).toBe("processing");
            expect(first.transactionId ?? null).toBeNull();
            expect(first.metadata.unresolvedReason).toBeTruthy();
            const others = state.cycle!.calculationSummary.brands.filter((brand: Row) => brand !== first);
            expect(others.every((brand: Row) => brand.executionStatus === "approved")).toBe(true);
            expect(state.cycle!.status).toBe("processing");
            expect(state.tdsUpserts).toHaveLength(0);
            expect(state.alerts.some((event) => event.actionType === "brand_payout_unresolved")).toBe(true);
        });
    }
});

describe("REN-253 N-2 a later cycle cannot repay an accepted or unresolved payout", () => {
    async function executeFirstCycle(respond: () => Response) {
        await prepareExecutableCycle("finance-2");
        await withRazorpay(respond, async () => {
            await executeNow("cycle-1", "finance-3");
        });
        return copy(state.cycle!);
    }

    test("after an accepted payout the same orders are excluded, even with an earlier payout date", async () => {
        const first = await executeFirstCycle(providerAccepts);
        expect(brandSummary(brandId).transactionId).toBe("pout_1");
        startSecondCycle(first, "2026-09-10");

        await payouts.calculatePayoutCycle("cycle-2", "finance-1");

        expect(state.cycle!.calculationSummary.brands).toHaveLength(0);
        expect(state.cycle!.calculationSummary.eligibilityDiagnostics).toContainEqual({
            orderId: "order-1",
            disposition: "excluded",
            reason: "prior_cycle_settled",
        });
    });

    test("a brand whose first cycle is failed but holds a transaction id (older record) is still treated as paid", async () => {
        const first = await executeFirstCycle(providerAccepts);
        first.status = "failed";
        first.calculationSummary.brands[0].executionStatus = "failed";
        startSecondCycle(first);

        await payouts.calculatePayoutCycle("cycle-2", "finance-1");

        expect(state.cycle!.calculationSummary.brands).toHaveLength(0);
    });

    test("after an unresolved payout the same orders are held", async () => {
        const first = await executeFirstCycle(() => new Response("timeout", { status: 504 }));
        expect(brandSummary(brandId).metadata.providerOutcome).toBe("unknown");
        startSecondCycle(first);

        await payouts.calculatePayoutCycle("cycle-2", "finance-1");

        expect(state.cycle!.calculationSummary.brands).toHaveLength(0);
        expect(state.cycle!.calculationSummary.eligibilityDiagnostics).toContainEqual({
            orderId: "order-1",
            disposition: "held",
            reason: "prior_payout_unresolved",
        });
    });

    test("a failure with no recorded rejection (older record) is unresolved, not payable again", async () => {
        const first = await executeFirstCycle(() => new Response("bad", { status: 422 }));
        delete first.calculationSummary.brands[0].metadata.providerOutcome;
        startSecondCycle(first);

        await payouts.calculatePayoutCycle("cycle-2", "finance-1");

        expect(state.cycle!.calculationSummary.brands).toHaveLength(0);
        expect(
            state.cycle!.calculationSummary.eligibilityDiagnostics.map((item: Row) => item.reason)
        ).toContain("prior_payout_unresolved");
    });

    test("a payout the provider definitely rejected is released: a new cycle pays it under its own key", async () => {
        const first = await executeFirstCycle(() => new Response("bad", { status: 422 }));
        startSecondCycle(first);

        await payouts.calculatePayoutCycle("cycle-2", "finance-1");

        expect(state.cycle!.calculationSummary.brands).toHaveLength(1);
        expect(brandSummary(brandId).netPayablePaise).toBe(84_900);
    });

    test("a manual NEFT instruction awaiting confirmation holds the orders", async () => {
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
        await executeNow("cycle-1", "finance-3");
        expect(brandSummary(brandId).executionStatus).toBe("awaiting_manual_confirmation");
        startSecondCycle(copy(state.cycle!));

        await payouts.calculatePayoutCycle("cycle-2", "finance-1");

        expect(state.cycle!.calculationSummary.brands).toHaveLength(0);
        expect(
            state.cycle!.calculationSummary.eligibilityDiagnostics.map((item: Row) => item.reason)
        ).toContain("prior_payout_in_flight");
    });

    test("only the paid brand's orders are excluded; another brand in the same window stays payable", async () => {
        await prepareExecutableTwoBrandCycle();
        // brand A is already paid in another cycle for its own order
        const other = copy(state.cycle!);
        other.id = "cycle-0";
        other.calculationSummary.brands = other.calculationSummary.brands
            .filter((brand: Row) => brand.brandId === brandA)
            .map((brand: Row) => ({ ...brand, executionStatus: "completed", transactionId: "pout_0" }));
        state.otherCycles = [other];
        state.cycle = cycle("calculated");

        await payouts.calculatePayoutCycle("cycle-1", "finance-1");

        const brandIds = state.cycle!.calculationSummary.brands.map((brand: Row) => brand.brandId);
        expect(brandIds).toEqual([brandB]);
    });

    test("execution refuses a cycle whose orders another cycle already paid (two cycles calculated before either executed)", async () => {
        const first = await executeFirstCycle(providerAccepts);
        state.otherCycles = [copy(first)];
        const second = copy(first);
        second.id = "cycle-2";
        second.cycleKey = "2026-09-B";
        second.status = "approved";
        second.calculationSummary.brands = second.calculationSummary.brands.map((brand: Row) => ({
            ...brand,
            executionStatus: "approved",
            reviewStatus: "approved",
            transactionId: null,
        }));
        second.calculationSummary.basisFingerprint = computePayoutBasisFingerprint(
            "cycle-2",
            second.calculationSummary.brands
        );
        state.cycle = second;
        state.clearance = {
            id: "clearance-2",
            cycleId: "cycle-2",
            clearedBy: "finance-2",
            evidenceReference: "BIZ-3-approval",
            transactionValidationReference: "txn-validation-1",
            transactionValidatedAt: new Date("2026-09-10T00:00:00.000Z"),
            clearedAt: new Date("2026-09-10T00:00:00.000Z"),
            expiresAt: null,
            revokedAt: null,
            metadata: { basisFingerprint: currentBasis() },
        };

        await withRazorpay(providerAccepts, async (bodies) => {
            await expect(executeNow("cycle-2", "finance-3")).rejects.toThrow(
                "already paid, in flight or unresolved in another cycle"
            );
            expect(bodies).toHaveLength(0);
        });
        expect(state.cycle!.status).toBe("approved");
    });
});

describe("REN-253 C-1 atomic execution claim", () => {
    test("two concurrent executions: one claim, one provider call, the other is refused", async () => {
        await prepareExecutableCycle("finance-2");

        await withRazorpay(providerAccepts, async (bodies) => {
            const results = await Promise.allSettled([
                executeNow("cycle-1", "finance-3"),
                executeNow("cycle-1", "finance-4"),
            ]);

            expect(bodies).toHaveLength(1);
            expect(results.filter((result) => result.status === "fulfilled")).toHaveLength(1);
            expect(results.filter((result) => result.status === "rejected")).toHaveLength(1);
        });
        expect(brandSummary(brandId).transactionId).toBe("pout_1");
    });

    test("five concurrent executions still reach the provider once", async () => {
        await prepareExecutableCycle("finance-2");

        await withRazorpay(providerAccepts, async (bodies) => {
            const results = await Promise.allSettled(
                [3, 4, 5, 6, 7].map((n) => executeNow("cycle-1", `finance-${n}`))
            );

            expect(bodies).toHaveLength(1);
            expect(results.filter((result) => result.status === "fulfilled")).toHaveLength(1);
        });
    });

    test("the claim is a conditional status write: approved -> processing, nothing else", async () => {
        await prepareExecutableCycle("finance-2");
        const attempted: Row[] = [];
        const original = state.beforeCycleWrite;
        state.beforeCycleWrite = async (values) => {
            attempted.push({ status: values.status, statusBeforeWrite: state.cycle!.status });
            await original?.(values);
        };

        await withRazorpay(providerAccepts, async () => {
            await executeNow("cycle-1", "finance-3");
        });

        expect(attempted[0]).toEqual({ status: "processing", statusBeforeWrite: "approved" });
        expect(state.cycle!.executedBy).toBe("finance-3");
    });

    for (const status of ["processing", "completed", "failed", "calculated", "draft"]) {
        test(`a cycle that is ${status} cannot be claimed and reaches no provider`, async () => {
            await prepareExecutableCycle("finance-2");
            state.cycle = { ...state.cycle!, status };

            await withRazorpay(providerAccepts, async (bodies) => {
                await expect(executeNow("cycle-1", "finance-3")).rejects.toThrow(
                    `Payout execution blocked: cycle status is ${status}.`
                );
                expect(bodies).toHaveLength(0);
            });
        });
    }

    test("a recalculation that lands between the read and the claim defeats the claim", async () => {
        await prepareExecutableCycle("finance-2");
        const original = state.beforeCycleWrite;
        state.beforeCycleWrite = async (values) => {
            if (values.status === "processing") {
                // another writer replaces the summary (new basis) just before the claim
                state.cycle!.calculationSummary = {
                    ...state.cycle!.calculationSummary,
                    basisFingerprint: "a-different-basis",
                };
            }
            await original?.(values);
        };

        await withRazorpay(providerAccepts, async (bodies) => {
            await expect(executeNow("cycle-1", "finance-3")).rejects.toThrow("already claimed");
            expect(bodies).toHaveLength(0);
        });
        expect(state.cycle!.status).toBe("approved");
    });
});

describe("REN-253 G-1/G-2/G-4 the payout basis is bound to approval and clearance", () => {
    test("a recorded clearance stores the basis it was shown", async () => {
        await calculateTwoBrandCycle();
        const basis = currentBasis();

        const row = await clearNow({
            cycleId: "cycle-1",
            actorId: "finance-2",
            evidenceReference: "BIZ-3-approval",
            transactionValidationReference: "txn-validation-1",
            transactionValidatedAt: new Date("2026-09-10T00:00:00.000Z"),
        });

        expect(row.metadata.basisFingerprint).toBe(basis);
        expect(state.financeAudits.find((event) => event.actionType === "payout_execution_clearance_recorded")
            ?.afterValue.basisFingerprint).toBe(basis);
    });

    test("the same basis is allowed through to the provider", async () => {
        await prepareExecutableCycle("finance-2");

        await withRazorpay(providerAccepts, async (bodies) => {
            await executeNow("cycle-1", "finance-3");
            expect(bodies).toHaveLength(1);
        });
    });

    const tampering: Array<[string, (brand: Row) => void]> = [
        ["amount changed", (brand) => (brand.netPayablePaise += 1)],
        ["a component changed", (brand) => (brand.commissionPaise += 1)],
        ["the override component changed", (brand) => (brand.overrideNetPaise += 1)],
        ["TDS changed", (brand) => (brand.tdsPaise += 1)],
        [
            "order membership changed with identical totals",
            (brand) => {
                const sale = brand.lineItems.find((line: Row) => line.lineType === "sale");
                sale.referenceId = "order-OTHER";
            },
        ],
        ["payee account changed", (brand) => (brand.metadata.bankAccountNumber = "999900009999")],
        ["payee IFSC changed", (brand) => (brand.metadata.bankIfscCode = "ICIC0000002")],
        ["payee holder name changed", (brand) => (brand.metadata.bankAccountHolderName = "Other")],
        ["payout method changed", (brand) => (brand.payoutMethod = "manual_neft")],
        ["verification state changed", (brand) => (brand.metadata.confidentialVerificationStatus = "pending")],
    ];
    for (const [label, tamper] of tampering) {
        test(`${label} after clearance: execution is rejected before any claim or provider call`, async () => {
            state.brands = [
                {
                    brandId,
                    brandName: "Brand One",
                    payoutMethod: "razorpay_route",
                    bankAccountHolderName: "Brand One Pvt Ltd",
                    bankAccountNumber: accountX,
                    bankIfscCode: "HDFC0000001",
                },
            ];
            await prepareExecutableCycle("finance-2");
            tamper(brandSummary(brandId));

            await withRazorpay(providerAccepts, async (bodies) => {
                // `currentBasis()` is what a freshly loaded screen would send, so only the
                // clearance binding can stop this.
                await expect(executeNow("cycle-1", "finance-3")).rejects.toThrow(
                    "clearance_basis_mismatch"
                );
                expect(bodies).toHaveLength(0);
            });
            expect(state.cycle!.status).toBe("approved");
        });
    }

    test("a clearance recorded before basis binding (no stored basis) is refused", async () => {
        await prepareExecutableCycle("finance-2");
        delete state.clearance!.metadata;

        await withRazorpay(providerAccepts, async (bodies) => {
            await expect(executeNow("cycle-1", "finance-3")).rejects.toThrow("clearance_basis_missing");
            expect(bodies).toHaveLength(0);
        });
    });

    test("G-4 stale screens: approve, clear and execute with a basis that has since changed are rejected", async () => {
        await calculateTwoBrandCycle();
        const stale = currentBasis();
        state.orders = [orderForBrand("order-a", brandA, 100_000), orderForBrand("order-b", brandB, 200_000)];
        await payouts.calculatePayoutCycle("cycle-1", "finance-1");
        expect(currentBasis()).not.toBe(stale);

        await expect(payouts.approvePayoutCycle("cycle-1", "finance-2", brandA, stale)).rejects.toThrow(
            "the payout basis changed since this screen was loaded"
        );
        await expect(
            clearNow({
                cycleId: "cycle-1",
                actorId: "finance-2",
                evidenceReference: "BIZ-3-approval",
                transactionValidationReference: "txn-validation-1",
                transactionValidatedAt: new Date("2026-09-10T00:00:00.000Z"),
                expectedBasis: stale,
            })
        ).rejects.toThrow("the payout basis changed since this screen was loaded");
        expect(brandSummary(brandA).reviewStatus).toBe("pending");
        expect(state.clearance).toBeNull();

        await approveNow("cycle-1", "finance-2");
        await clearNow({
            cycleId: "cycle-1",
            actorId: "finance-2",
            evidenceReference: "BIZ-3-approval",
            transactionValidationReference: "txn-validation-1",
            transactionValidatedAt: new Date("2026-09-10T00:00:00.000Z"),
        });
        await withRazorpay(providerAccepts, async (bodies) => {
            await expect(payouts.executePayoutCycle("cycle-1", "finance-3", undefined, stale)).rejects.toThrow(
                "the payout basis changed since this screen was loaded"
            );
            expect(bodies).toHaveLength(0);
        });
    });

    test("an empty basis is never accepted", async () => {
        await calculateTwoBrandCycle();
        await expect(payouts.approvePayoutCycle("cycle-1", "finance-2", undefined, "")).rejects.toThrow(
            "the payout basis changed"
        );
    });

    test("G-2: a clearance recorded between the revoke and the new amounts cannot execute them", async () => {
        state.commissionRules = [{ ...approvedRule, commissionPercentBps: 1000 }];
        state.cycle = cycle("draft");
        await payouts.calculatePayoutCycle("cycle-1", "finance-1");
        const oldBasis = currentBasis();
        state.orders = [order(), orderForBrand("order-2", brandId, 900_000)];
        state.brands = null;
        // another admin attempts to record a clearance of the OLD basis while the recalculation runs
        state.afterRevoke = async () => {
            state.afterRevoke = null;
            await expect(payouts.recordPayoutExecutionClearance({
                cycleId: "cycle-1",
                actorId: "finance-2",
                evidenceReference: "BIZ-3-approval",
                transactionValidationReference: "txn-validation-1",
                transactionValidatedAt: new Date("2026-09-10T00:00:00.000Z"),
                expectedBasis: oldBasis,
            })).rejects.toThrow("basis changed");
        };

        await payouts.calculatePayoutCycle("cycle-1", "finance-1");
        expect(brandSummary(brandId).netPayablePaise).toBe(899_000);
        // The old-basis clearance cannot be recorded after the new summary wins the CAS.
        expect(state.clearance).toBeNull();
        await approveNow("cycle-1", "finance-1");

        // ...and no stale clearance can authorise the new amounts.
        await withRazorpay(providerAccepts, async (bodies) => {
            await expect(executeNow("cycle-1", "finance-3")).rejects.toThrow("human_clearance_missing");
            expect(bodies).toHaveLength(0);
        });
    });

    test("G-5: an approval read before a recalculation cannot overwrite the recalculated cycle", async () => {
        await calculateTwoBrandCycle();
        state.orders = [orderForBrand("order-a", brandA, 100_000), orderForBrand("order-b", brandB, 200_000)];
        let recalculated = false;
        state.beforeCycleWrite = async (values) => {
            if (!recalculated && values.approvedBy === "finance-2") {
                recalculated = true;
                state.beforeCycleWrite = null;
                await payouts.calculatePayoutCycle("cycle-1", "finance-1");
            }
        };
        const staleBasis = currentBasis();

        await expect(payouts.approvePayoutCycle("cycle-1", "finance-2", brandA, staleBasis)).rejects.toThrow(
            "changed state or basis while it was being written"
        );

        expect(recalculated).toBe(true);
        expect(brandSummary(brandB).netPayablePaise).toBeGreaterThan(0);
        expect(brandSummary(brandA).reviewStatus).toBe("pending");
        expect(currentBasis()).not.toBe(staleBasis);
    });

    test("a recalculation that loses a race with an approval does not overwrite the approved cycle", async () => {
        await calculateTwoBrandCycle();
        state.beforeCycleWrite = async (values) => {
            if (values.status === "calculated") {
                state.beforeCycleWrite = null;
                state.cycle = { ...state.cycle!, status: "approved" };
            }
        };
        state.replacedLineItems = null;

        await expect(payouts.calculatePayoutCycle("cycle-1", "finance-1")).rejects.toThrow(
            "changed state or basis while it was being written"
        );
        expect(state.cycle!.status).toBe("approved");
        expect(state.replacedLineItems).toBeNull();
    });
});

describe("REN-253 G-8 the current payee verification is enforced at execution", () => {
    function singleBrandRow(overrides: Row = {}) {
        return {
            brandId,
            brandName: "Brand One",
            payoutMethod: "razorpay_route",
            bankAccountHolderName: "Brand One Pvt Ltd",
            bankAccountNumber: accountX,
            bankIfscCode: "HDFC0000001",
            confidentialVerificationStatus: "approved",
            ...overrides,
        };
    }

    test("verified at calculation, still verified at execution: execution proceeds", async () => {
        state.brands = [singleBrandRow()];
        await prepareExecutableCycle("finance-2");
        expect(brandSummary(brandId).metadata.confidentialVerificationStatus).toBe("approved");

        await withRazorpay(providerAccepts, async (bodies) => {
            await executeNow("cycle-1", "finance-3");
            expect(bodies).toHaveLength(1);
        });
        expect(brandSummary(brandId).executionStatus).toBe("completed");
    });

    for (const status of ["pending", "rejected", "idle"]) {
        test(`verified at calculation, ${status} at execution: rejected before the claim and before the provider`, async () => {
            state.brands = [singleBrandRow()];
            await prepareExecutableCycle("finance-2");
            state.brands = [singleBrandRow({ confidentialVerificationStatus: status })];
            state.financeAudits = [];

            await withRazorpay(providerAccepts, async (bodies) => {
                await expect(executeNow("cycle-1", "finance-3")).rejects.toThrow(
                    `payee_not_verified:${status}`
                );
                expect(bodies).toHaveLength(0);
            });

            expect(state.cycle!.status).toBe("approved");
            expect(brandSummary(brandId).executionStatus).toBe("approved");
            const blocked = state.financeAudits.find(
                (event) => event.actionType === "payout_execution_blocked_payee_ineligible"
            );
            expect(blocked?.afterValue.brands[0].reasons).toEqual([`payee_not_verified:${status}`]);
            expect(JSON.stringify(blocked)).not.toContain(accountX);
        });
    }

    test("verified at calculation, bank details changed and verification reset: rejected", async () => {
        state.brands = [singleBrandRow()];
        await prepareExecutableCycle("finance-2");
        state.brands = [
            singleBrandRow({ bankAccountNumber: "999900009999", confidentialVerificationStatus: "pending" }),
        ];

        await withRazorpay(providerAccepts, async (bodies) => {
            await expect(executeNow("cycle-1", "finance-3")).rejects.toThrow(
                /payee_not_verified:pending; bank_details_changed:bankAccountNumber/
            );
            expect(bodies).toHaveLength(0);
        });
    });

    test("bank details changed while verification still reads approved: rejected (no silent payee swap)", async () => {
        state.brands = [singleBrandRow()];
        await prepareExecutableCycle("finance-2");
        state.brands = [singleBrandRow({ bankIfscCode: "ICIC0000002", bankAccountHolderName: "Other" })];

        await withRazorpay(providerAccepts, async (bodies) => {
            await expect(executeNow("cycle-1", "finance-3")).rejects.toThrow(
                "bank_details_changed:bankIfscCode,bankAccountHolderName"
            );
            expect(bodies).toHaveLength(0);
        });
    });

    test("the payout method changed at the brand: rejected", async () => {
        state.brands = [singleBrandRow()];
        await prepareExecutableCycle("finance-2");
        state.brands = [singleBrandRow({ payoutMethod: "manual_neft" })];

        await withRazorpay(providerAccepts, async (bodies) => {
            await expect(executeNow("cycle-1", "finance-3")).rejects.toThrow("payout_method_changed");
            expect(bodies).toHaveLength(0);
        });
    });

    test("a brand that is no longer active is rejected", async () => {
        state.brands = [singleBrandRow()];
        await prepareExecutableCycle("finance-2");
        state.brands = [];

        await withRazorpay(providerAccepts, async (bodies) => {
            await expect(executeNow("cycle-1", "finance-3")).rejects.toThrow("brand_not_active_or_missing");
            expect(bodies).toHaveLength(0);
        });
    });

    test("verification flips after the pre-flight but before the provider call: the call is not made", async () => {
        state.brands = [singleBrandRow()];
        await prepareExecutableCycle("finance-2");
        state.listBrandsCalls = 0;
        // call 1 is the pre-flight; call 2 is the re-read immediately before the provider
        state.liveOverride = (callNo, row) =>
            callNo >= 2 ? { ...row, confidentialVerificationStatus: "pending" } : row;

        await withRazorpay(providerAccepts, async (bodies) => {
            await executeNow("cycle-1", "finance-3");
            expect(bodies).toHaveLength(0);
        });

        expect(brandSummary(brandId).executionStatus).toBe("approved");
        expect(brandSummary(brandId).transactionId ?? null).toBeNull();
        expect(
            state.cycle!.calculationSummary.executions.some(
                (item: Row) => item.status === "blocked" && item.reason === "payee_not_eligible_at_execution"
            )
        ).toBe(true);
        expect(state.cycle!.status).toBe("approved");
    });

    test("verified at calculation, pending before approval: the recalculation drops the approval and revokes the clearance", async () => {
        state.brands = [singleBrandRow()];
        await calculateTwoBrandCycleWith(singleBrandRow);
        await approveNow("cycle-1", "finance-2");
        const clearance = await clearNow({
            cycleId: "cycle-1",
            actorId: "finance-2",
            evidenceReference: "BIZ-3-approval",
            transactionValidationReference: "txn-validation-1",
            transactionValidatedAt: new Date("2026-09-10T00:00:00.000Z"),
        });
        state.cycle = { ...state.cycle!, status: "calculated" };
        state.brands = [singleBrandRow({ confidentialVerificationStatus: "pending" })];

        await payouts.calculatePayoutCycle("cycle-1", "finance-1");

        expect(brandSummary(brandId).metadata.confidentialVerificationStatus).toBe("pending");
        expect(brandSummary(brandId).reviewStatus).toBe("pending");
        expect(state.revokedClearances.map((row) => row.id)).toEqual([clearance.id]);
    });
});

describe("REN-260 C0-R3 bounded remediation", () => {
    test("refreshes overlap state after claiming and refuses before the provider", async () => {
        await prepareExecutableCycle("finance-2");
        const sale = brandSummary(brandId).lineItems.find((line: Row) => line.lineType === "sale");
        state.afterClaim = async () => {
            state.afterClaim = null;
            state.otherCycles = [
                {
                    id: "cycle-2",
                    status: "processing",
                    calculationSummary: {
                        brands: [{ brandId, executionStatus: "processing", lineItems: [sale] }],
                    },
                },
            ];
        };

        await withRazorpay(providerAccepts, async (bodies) => {
            await expect(executeNow("cycle-1", "finance-3")).rejects.toThrow(
                "already paid, in flight or unresolved"
            );
            expect(bodies).toHaveLength(0);
        });
        expect(state.cycle!.status).toBe("approved");
        expect(state.financeAudits.some((event) => event.reason === "orders_already_paid_in_flight_or_unresolved_in_another_cycle")).toBe(true);
    });

    test("keeps processing when the post-claim overlap release loses its CAS", async () => {
        await prepareExecutableCycle("finance-2");
        const sale = brandSummary(brandId).lineItems.find((line: Row) => line.lineType === "sale");
        state.afterClaim = async () => {
            state.afterClaim = null;
            state.otherCycles = [{
                id: "cycle-2",
                status: "processing",
                calculationSummary: { brands: [{ brandId, executionStatus: "processing", lineItems: [sale] }] },
            }];
        };
        state.failCycleWrite = (values) => values.status === "approved" && state.cycle?.status === "processing";

        await withRazorpay(providerAccepts, async (bodies) => {
            await expect(executeNow("cycle-1", "finance-3")).rejects.toThrow(
                "already paid, in flight or unresolved"
            );
            expect(bodies).toHaveLength(0);
        });
        expect(state.cycle!.status).toBe("processing");
    });

    test("manual completion requires evidence, a current basis, and a distinct confirmer", async () => {
        state.brands = [{
            brandId,
            brandName: "Brand One",
            payoutMethod: "manual_neft",
            bankAccountHolderName: "Brand One Pvt Ltd",
            bankAccountNumber: accountX,
            bankIfscCode: "HDFC0000001",
        }];
        await prepareExecutableCycle("finance-2");
        await payouts.executePayoutCycle("cycle-1", "finance-3", undefined, currentBasis());
        const basis = currentBasis();

        const updated = await payouts.completeManualBrandPayout({
            cycleId: "cycle-1",
            brandId,
            actorId: "finance-4",
            transactionId: "utr-20261004-001",
            expectedBasis: basis,
            evidenceReference: "bank-statement-20261004-001",
        });

        expect(updated.status).toBe("completed");
        expect(brandSummary(brandId).metadata.manualCompletion).toMatchObject({
            confirmerId: "finance-4",
            evidenceReference: "bank-statement-20261004-001",
            transactionId: "utr-20261004-001",
        });
    });

    test("manual completion rejects provider-shaped or duplicate transaction references", async () => {
        state.brands = [{ brandId, brandName: "Brand One", payoutMethod: "manual_neft" }];
        await prepareExecutableCycle("finance-2");
        await payouts.executePayoutCycle("cycle-1", "finance-3", undefined, currentBasis());

        await expect(
            payouts.completeManualBrandPayout({
                cycleId: "cycle-1",
                brandId,
                actorId: "finance-4",
                transactionId: "pout_provider-shaped",
                expectedBasis: currentBasis(),
                evidenceReference: "bank-statement-1",
            })
        ).rejects.toThrow("provider-shaped");

        state.otherCycles = [{
            id: "cycle-2",
            status: "completed",
            calculationSummary: {
                brands: [{ brandId, transactionId: "utr-duplicate-1" }],
            },
        }];
        await expect(
            payouts.completeManualBrandPayout({
                cycleId: "cycle-1",
                brandId,
                actorId: "finance-4",
                transactionId: "utr-duplicate-1",
                expectedBasis: currentBasis(),
                evidenceReference: "bank-statement-1",
            })
        ).rejects.toThrow("already used");
    });

    test("manual completion refuses a stale summary instead of marking the brand complete", async () => {
        state.brands = [{ brandId, brandName: "Brand One", payoutMethod: "manual_neft" }];
        await prepareExecutableCycle("finance-2");
        await payouts.executePayoutCycle("cycle-1", "finance-3", undefined, currentBasis());
        const basis = currentBasis();
        state.beforeCycleWrite = async (values) => {
            if (values.calculationSummary?.brands?.some((brand: Row) => brand.executionStatus === "completed")) {
                state.cycle!.calculationSummary = {
                    ...state.cycle!.calculationSummary,
                    basisFingerprint: "concurrent-summary-change",
                };
            }
        };

        await expect(
            payouts.completeManualBrandPayout({
                cycleId: "cycle-1",
                brandId,
                actorId: "finance-4",
                transactionId: "utr-stale-001",
                expectedBasis: basis,
                evidenceReference: "bank-statement-stale-001",
            })
        ).rejects.toThrow("changed state or basis");
        expect(brandSummary(brandId).executionStatus).toBe("awaiting_manual_confirmation");
    });
});

async function calculateTwoBrandCycleWith(row: () => Row) {
    state.brands = [row()];
    state.commissionRules = [approvedRule];
    state.cycle = cycle("draft");
    await payouts.calculatePayoutCycle("cycle-1", "finance-1");
}

describe("REN-253 no alternate payout path bypasses the controls", () => {
    test("the provider payout endpoint is called from exactly one place, behind the claim", async () => {
        const glob = new Bun.Glob("src/**/*.{ts,tsx}");
        const root = resolve(import.meta.dir, "../../../");
        const callers: string[] = [];
        for await (const file of glob.scan({ cwd: root })) {
            if (/\.test\.tsx?$/.test(file)) continue;
            const text = await Bun.file(`${root}/${file}`).text();
            if (text.includes("/v1/payouts")) callers.push(file.replace(/\\/g, "/"));
        }
        expect(callers).toEqual(["src/lib/finance/payouts.ts"]);

        const source = await Bun.file(new URL("./payouts.ts", import.meta.url)).text();
        expect(source.split("createRazorpayPayout({").length - 1).toBe(1);
        const execute = source.slice(
            source.indexOf("export async function executePayoutCycle("),
            source.indexOf("export async function completeManualBrandPayout(")
        );
        const claim = execute.indexOf("updatePayoutCycleIf(");
        const call = execute.indexOf("createRazorpayPayout({");
        expect(claim).toBeGreaterThan(-1);
        expect(call).toBeGreaterThan(claim);
    }, 15000);

    test("no synthetic transaction id is ever assigned; transaction ids come from the provider or a manual confirmation", async () => {
        const source = await Bun.file(new URL("./payouts.ts", import.meta.url)).text();
        expect(source).not.toContain("payout.reference_id");
        const assignments = source.match(/\.transactionId = [^;]+;/g) ?? [];
        expect(assignments).toEqual([
            ".transactionId = transactionId;",
            ".transactionId = transactionId;",
        ]);
        expect(source).toContain("const transactionId = String(payout.id);");
    });

    test("every write that completes a cycle goes through the persisted-state helpers", async () => {
        const source = await Bun.file(new URL("./payouts.ts", import.meta.url)).text();
        expect((source.match(/financeComplianceQueries\.updatePayoutCycle\(/g) ?? []).length).toBe(1);
        expect(source).toContain("condition: { statusIn: [\"processing\"] }");
    });
});
