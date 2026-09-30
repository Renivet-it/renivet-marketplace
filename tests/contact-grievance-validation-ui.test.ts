import { expect, test } from "bun:test";

test("contact grievance form renders flattened validation errors", async () => {
    const source = await Bun.file(
        "src/app/(home)/contact/page.tsx"
    ).text();

    expect(source).toContain("parsed.error.flatten().fieldErrors");
    expect(source).not.toContain("parsed.flatten().fieldErrors");
    expect(source).toContain("fieldErrors.description");
    expect(source).toContain('aria-invalid={Boolean(fieldErrors.description)}');
});
