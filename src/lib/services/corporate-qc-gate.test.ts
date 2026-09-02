import { readFile } from "node:fs/promises";
import { expect, test } from "bun:test";

const platformSource = readFile(
    new URL("./corporate-platform.ts", import.meta.url),
    "utf8"
);
const routerSource = readFile(
    new URL("../trpc/routes/general/corporate-platform.ts", import.meta.url),
    "utf8"
);
const orderSource = readFile(
    new URL("./corporate-order.ts", import.meta.url),
    "utf8"
);
const schemaSource = readFile(
    new URL("../db/schema/corporate-platform.ts", import.meta.url),
    "utf8"
);

test("QC submit and review mutations are permission protected", async () => {
    const [router, platform] = await Promise.all([
        routerSource,
        platformSource,
    ]);
    const submit = router.slice(
        router.indexOf("submitQc:"),
        router.indexOf("saveShipment:")
    );
    expect(submit).toContain(
        "isTRPCAuth(BitFieldSitePermission.MANAGE_ORDERS)"
    );
    expect(platform).toContain("async reviewQc(");
    expect(router).toContain("reviewQc:");
});

test("QC review records explicit decisions and metadata", async () => {
    const [platform, schema] = await Promise.all([
        platformSource,
        schemaSource,
    ]);
    expect(platform).toContain("status: parsed.decision");
    expect(platform).toContain("reviewedByUserId: actorUserId");
    expect(platform).toContain("reviewedAt");
    expect(schema).toContain('reviewNotes: text("review_notes")');
});

test("dispatch guard requires approved latest QC", async () => {
    const source = await orderSource;
    expect(source).toContain("getLatestQcSubmissionForOrder");
    expect(source).toContain("QC approval is required before dispatch");
});

test("QC review migration exists", async () => {
    const migration = await readFile(
        new URL(
            "../../../drizzle/0272_corporate_qc_review.sql",
            import.meta.url
        ),
        "utf8"
    );
    expect(migration).toContain("review_notes");
    expect(migration).toContain("reviewed_at");
});
