import { expect, test } from "bun:test";
import { getBrandSearchTerms } from "./brand-search-query";

test("keeps the non-brand terms when redirecting a brand product search", () => {
    expect(
        getBrandSearchTerms("Bamboology t shirt", "Bamboology", "bamboology")
    ).toBe("t shirt");
});

test("does not add an empty search constraint for a brand-only search", () => {
    expect(
        getBrandSearchTerms("Bamboology", "Bamboology", "bamboology")
    ).toBeUndefined();
});
