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
