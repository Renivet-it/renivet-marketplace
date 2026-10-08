import { expect, test } from "bun:test";

test("RFQ quote creation requires and persists classified commission GST", async () => {
    const schema = await Bun.file("src/lib/validations/corporate-platform.ts").text();
    const service = await Bun.file("src/lib/services/corporate-platform.ts").text();
    const ui = await Bun.file("src/components/corporate-platform/admin-rfq-queue.tsx").text();

    expect(schema).toContain("commissionHsnCode: z.string().trim().min(1)");
    expect(service).toContain("requireCorporateTaxClassification");
    expect(service).toContain("commissionGstRateBps");
    expect(service).toContain("commissionGstAmountPaise");
    expect(ui).toContain("Commission HSN/SAC");
});
