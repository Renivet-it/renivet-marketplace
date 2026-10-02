import { beforeEach, describe, expect, mock, test } from "bun:test";

// Route-level behaviour for the payout statement endpoint (REN-253 control 3).
// Auth, finance access, the query layer and the PDF renderer are mocked; nothing
// touches a database, Clerk or a payout provider.

const state = {
    userId: null as string | null,
    access: { canView: false, canManage: false },
    cycleReads: [] as string[],
    lineItemReads: [] as string[],
    cycle: null as Record<string, unknown> | null,
};

mock.module("@clerk/nextjs/server", () => ({
    auth: async () => ({ userId: state.userId }),
}));

mock.module("@/lib/redis/methods", () => ({
    userCache: { get: async () => ({ roles: [] }) },
}));

mock.module("@/lib/finance/access", () => ({
    getFinanceModuleAccess: async () => ({ ...state.access, isInherited: false }),
}));

mock.module("@/lib/db/queries/finance-compliance", () => ({
    financeComplianceQueries: {
        getPayoutCycle: async (cycleId: string) => {
            state.cycleReads.push(cycleId);
            return state.cycle;
        },
        listPayoutLineItems: async (cycleId: string) => {
            state.lineItemReads.push(cycleId);
            return [];
        },
    },
}));

mock.module("@/components/pdf/brand-payout-statement-template", () => ({
    BrandPayoutStatementTemplate: () => null,
}));

mock.module("@react-pdf/renderer", () => ({
    renderToStream: async () =>
        (async function* () {
            yield Buffer.from("%PDF-test");
        })(),
}));

const { GET } = await import("./route");

const context = {
    params: Promise.resolve({ cycleId: "cycle-1", brandId: "brand-1" }),
};

function request() {
    return new Request("http://localhost/api/finance/payouts/cycle-1/statement/brand-1") as never;
}

beforeEach(() => {
    state.userId = null;
    state.access = { canView: false, canManage: false };
    state.cycleReads = [];
    state.lineItemReads = [];
    state.cycle = null;
});

describe("REN-253 payout statement route", () => {
    test("an unauthenticated request gets 401 and no payout data is read", async () => {
        const response = await GET(request(), context);

        expect(response.status).toBe(401);
        expect(state.cycleReads).toHaveLength(0);
        expect(state.lineItemReads).toHaveLength(0);
    });

    test("a signed-in user without payouts finance access gets 403 and no payout data is read", async () => {
        state.userId = "brand-owner-1";

        const response = await GET(request(), context);

        expect(response.status).toBe(403);
        expect(state.cycleReads).toHaveLength(0);
        expect(state.lineItemReads).toHaveLength(0);
    });

    test("a user with payouts view access reaches the data layer (unknown cycle is 404)", async () => {
        state.userId = "finance-1";
        state.access = { canView: true, canManage: false };

        const response = await GET(request(), context);

        expect(response.status).toBe(404);
        expect(state.cycleReads).toEqual(["cycle-1"]);
    });

    test("a user with payouts manage access receives the PDF for a known cycle and brand", async () => {
        state.userId = "finance-2";
        state.access = { canView: false, canManage: true };
        state.cycle = {
            cycleKey: "2026-09-A",
            payoutDate: "2026-09-16",
            calculationSummary: { brands: [{ brandId: "brand-1", brandName: "Brand One" }] },
        };

        const response = await GET(request(), context);

        expect(response.status).toBe(200);
        expect(response.headers.get("Content-Type")).toBe("application/pdf");
        expect(response.headers.get("Content-Disposition")).toContain("2026-09-A-brand-1.pdf");
        expect(state.lineItemReads).toEqual(["cycle-1"]);
    });
});
