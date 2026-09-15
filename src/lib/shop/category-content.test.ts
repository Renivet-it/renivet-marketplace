import { describe, expect, test } from "bun:test";
import { getCategoryEditorialCopy } from "./category-content";

const words = (value: string) =>
    value.trim().split(/\s+/).filter(Boolean).length;

describe("REN-221 category editorial content", () => {
    test("uses a deterministic fallback between 150 and 300 words", () => {
        const copy = getCategoryEditorialCopy(undefined);
        expect(words(copy)).toBeGreaterThanOrEqual(150);
        expect(words(copy)).toBeLessThanOrEqual(300);
    });

    test("keeps valid category copy and rejects undersized copy", () => {
        const valid = Array.from(
            { length: 150 },
            (_, index) => `word${index}`
        ).join(" ");
        expect(getCategoryEditorialCopy(valid)).toBe(valid);
        expect(getCategoryEditorialCopy("Too short.")).not.toBe("Too short.");
    });
});
