import { readFile } from "node:fs/promises";
import { test, expect } from "bun:test";

test("React PDF image dependency does not use legacy url.parse", async () => {
    const source = await readFile(
        new URL(
            "../../../node_modules/@react-pdf/image/lib/index.js",
            import.meta.url
        ),
        "utf8"
    );

    expect(source).not.toContain("url.parse(");
    expect(source).toContain("new URL(");
});
