import { expect, test } from "bun:test";
import { readFile } from "node:fs/promises";

test("product queries do not log undefined search values on every catalog read", async () => {
    const source = await readFile(
        new URL("../src/lib/db/queries/product.ts", import.meta.url),
        "utf8"
    );

    expect(source).not.toContain('"[getProducts] search:",');
});
