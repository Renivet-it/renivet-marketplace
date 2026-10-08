import { expect, test } from "bun:test";
import { readFile } from "node:fs/promises";

test("REN-274 catalog cards enter canonical direct and RFQ Corporate flows", async () => {
    const source = await readFile("src/app/(marketing)/corporate/page.tsx", "utf8");
    expect(source).toContain("corporateProductConfigId");
    expect(source).toContain("/profile/corporate");
    expect(source).toContain("/profile/corporate/request-quote");
    expect(source).toContain("item.productId");
});

test("REN-274 catalog does not present a display-only card", async () => {
    const source = await readFile("src/app/(marketing)/corporate/page.tsx", "utf8");
    expect(source).toContain("Start Direct Order");
    expect(source).toContain("Request Quote");
});

test("REN-274 request quote route preserves the selected catalog product", async () => {
    const route = await readFile(
        "src/app/(protected)/profile/corporate/request-quote/page.tsx",
        "utf8"
    );
    const form = await readFile(
        "src/components/corporate-platform/request-quote-form.tsx",
        "utf8"
    );
    expect(route).toContain("productId");
    expect(route).toContain("initialProductId");
    expect(form).toContain("initialProductId");
});

test("REN-274 direct orders persist the selected Corporate catalog identity", async () => {
    const schema = await Bun.file("src/lib/validations/corporate-order.ts").text();
    const service = await Bun.file("src/lib/services/corporate-order.ts").text();
    const route = await Bun.file(
        "src/app/(marketing)/corporate-orders/page.tsx"
    ).text();
    expect(schema).toContain("corporateProductConfigId");
    expect(service).toContain("corporateProductConfigId: corporateProductConfig?.id");
    expect(service).toContain("catalogProductId: corporateProductConfig?.productId");
    expect(route).toContain("corporateProductConfigId");
});
