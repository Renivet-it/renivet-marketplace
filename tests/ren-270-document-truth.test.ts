import { expect, test } from "bun:test";
import { readFile } from "node:fs/promises";

test("REN-270 quote refresh never fabricates uploaded document URLs", async () => {
    const source = await readFile(
        "src/components/corporate-orders/corporate-order-page.tsx",
        "utf8"
    );
    expect(source).not.toContain("https://example.com/pending-artwork");
    expect(source).not.toContain("https://example.com/pending-sheet");
    expect(source).toContain("const { artworkFile, sheetFile } = await uploadRequiredFiles()");
});
