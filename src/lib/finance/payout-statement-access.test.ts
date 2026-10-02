import { beforeEach, describe, expect, mock, test } from "bun:test";

const state = {
    userId: null as string | null,
    access: { canView: false, canManage: false },
    accessRequests: [] as Array<Record<string, unknown>>,
};

mock.module("@clerk/nextjs/server", () => ({
    auth: async () => ({ userId: state.userId }),
}));

mock.module("@/lib/redis/methods", () => ({
    userCache: { get: async () => ({ roles: [] }) },
}));

mock.module("@/lib/finance/access", () => ({
    getFinanceModuleAccess: async (params: Record<string, unknown>) => {
        state.accessRequests.push(params);
        return { ...state.access, isInherited: false };
    },
}));

const { authorizePayoutStatementDownload } = await import("./payout-statement-access");

beforeEach(() => {
    state.userId = null;
    state.access = { canView: false, canManage: false };
    state.accessRequests = [];
});

describe("AQ-59 payout statement access", () => {
    test("rejects an unauthenticated request with 401", async () => {
        expect(await authorizePayoutStatementDownload()).toEqual({
            ok: false,
            status: 401,
            error: "Unauthorized",
        });
        expect(state.accessRequests).toHaveLength(0);
    });

    test("rejects a signed-in user without payouts finance access with 403", async () => {
        state.userId = "brand-owner-1";

        expect(await authorizePayoutStatementDownload()).toEqual({
            ok: false,
            status: 403,
            error: "Forbidden",
        });
        expect(state.accessRequests[0]?.moduleKey).toBe("payouts");
    });

    test("allows a user with payouts view or manage access", async () => {
        state.userId = "finance-1";
        state.access = { canView: true, canManage: false };
        expect(await authorizePayoutStatementDownload()).toEqual({
            ok: true,
            userId: "finance-1",
        });

        state.access = { canView: false, canManage: true };
        expect((await authorizePayoutStatementDownload()).ok).toBe(true);
    });

    test("the statement route authorizes before reading any payout data", async () => {
        const source = await Bun.file(
            new URL(
                "../../app/api/finance/payouts/[cycleId]/statement/[brandId]/route.tsx",
                import.meta.url
            )
        ).text();
        const handler = source.indexOf("export async function GET");
        const authorize = source.indexOf("authorizePayoutStatementDownload()", handler);
        const firstRead = source.indexOf("financeComplianceQueries.", handler);

        expect(authorize).toBeGreaterThan(handler);
        expect(authorize).toBeLessThan(firstRead);
        expect(source).toContain("status: access.status");
    });
});
