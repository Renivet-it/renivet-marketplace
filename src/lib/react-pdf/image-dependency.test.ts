import { readFile } from "node:fs/promises";
import { test, expect } from "bun:test";

test("React PDF image dependency does not use legacy url.parse", async () => {
    const dependencyUrls = [
        new URL(
            "../../../node_modules/@react-pdf/image/lib/index.js",
            import.meta.url
        ),
        new URL(
            "../../../../../node_modules/@react-pdf/image/lib/index.js",
            import.meta.url
        ),
    ];
    let source: string | undefined;
    for (const dependencyUrl of dependencyUrls) {
        try {
            source = await readFile(dependencyUrl, "utf8");
            break;
        } catch {
            // Continue to the repository-level dependency installation for worktrees.
        }
    }
    if (!source) throw new Error("@react-pdf/image is not installed");

    expect(source).not.toContain("url.parse(");
    expect(source).toContain("new URL(");
});
