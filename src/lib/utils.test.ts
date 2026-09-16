import {
    generateProductSlug,
    generateProductSlugCandidate,
} from "./utils";
import { describe, expect, test } from "bun:test";

describe("product slug generation", () => {
    test("creates a readable brand-title base without timestamp or randomness", () => {
        expect(generateProductSlug("Handwoven Silk Saree", "SUI")).toBe(
            "sui-handwoven-silk-saree"
        );
    });

    test("adds a short deterministic numeric suffix for collisions", () => {
        expect(
            generateProductSlugCandidate("sui-handwoven-silk-saree", 2)
        ).toBe("sui-handwoven-silk-saree-2");
        expect(
            generateProductSlugCandidate("sui-handwoven-silk-saree", 2)
        ).toBe("sui-handwoven-silk-saree-2");
    });

    test("does not add a suffix to the first candidate", () => {
        expect(
            generateProductSlugCandidate("sui-handwoven-silk-saree", 1)
        ).toBe("sui-handwoven-silk-saree");
    });

    test("rejects an empty slug base", () => {
        expect(() => generateProductSlugCandidate("", 1)).toThrow(
            "Product slug base must contain at least 3 characters"
        );
    });
});
