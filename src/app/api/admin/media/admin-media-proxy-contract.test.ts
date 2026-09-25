import { expect, test } from "bun:test";

const source = await Bun.file(
    new URL("./[id]/route.ts", import.meta.url)
).text();

test("admin media proxy streams the upstream file without per-request image processing", () => {
    expect(source).toContain("return new NextResponse(upstream.body");
    expect(source).not.toContain("await upstream.arrayBuffer()");
    expect(source).not.toContain("sharp(");
});

test("admin media proxy accepts successful upstream responses without requiring an image content type", () => {
    expect(source).toContain("if (!upstream.ok || !upstream.body)");
    expect(source).not.toContain('!contentType?.startsWith("image/")');
});
