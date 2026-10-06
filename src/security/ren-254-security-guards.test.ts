import { describe, expect, test } from "bun:test";

const read = (path: string) => Bun.file(new URL(path, import.meta.url)).text();

describe("REN-254 security guard contracts", () => {
  test("strips site permissions from brand role writes", async () => {
    const source = await read("../lib/trpc/routes/brands/roles.ts");
    expect(source).toContain('sitePermissions: "0"');
  });

  test("denies unsafe order deletion and scopes cart deletion to session user", async () => {
    const source = await read("../lib/trpc/routes/general/orders.ts");
    expect(source).toContain("Order deletion is not available through this API.");
    expect(source).toContain("dropActiveItemsFromCart");
    expect(source).toContain("ctx.user.id");
  });

  test("derives invite identity from Clerk and atomically bounds uses", async () => {
    const action = await read("../actions/brand-invite-accept.ts");
    const query = await read("../lib/db/queries/brand-invite.ts");
    expect(action).toContain("const { userId: memberId } = await auth()");
    expect(action).not.toContain("memberId: string");
    expect(query).toContain("lt(brandInvites.uses, brandInvites.maxUses)");
  });

  test("guards direct messaging actions", async () => {
    const email = await read("../actions/sendBulkEmail.ts");
    const whatsapp = await read("../actions/whatsapp/send-marketing-notification.ts");
    expect(email).toContain("requireEmailMessagingAccess");
    expect(whatsapp).toContain("requireWhatsAppMessagingAccess");
  });

  test("anonymizes deleted Clerk users without deleting rows", async () => {
    const source = await read("../app/api/webhooks/clerk/route.ts");
    expect(source).toContain('firstName: "Deleted User"');
    expect(source).toContain("deleted+${id}@invalid.renivet");
    expect(source).not.toContain("db.delete(users)");
  });

  test("protects return and replace mutations with finance access and status guards", async () => {
    const source = await read("../lib/trpc/routes/general/returnReplace.ts");
    expect(source).toContain('requireRefundModuleAccess(ctx as AuthenticatedContext, "manage")');
    expect(source).toContain('eq(orderReturnRequests.status, "pending")');
    expect(source).toContain('eq(orderReturnRequests.status, "approved")');
  });
});
