import { expect, test } from "bun:test";
import { toSearchCandidateIds } from "./search-candidates";

test("accepts only unique product UUIDs from an upstream result", () => {
    const id = "f0ac4ce0-10cb-4499-b479-4c8f5c8ef8bc";
    expect(
        toSearchCandidateIds([
            { id },
            { id },
            { id: "undefined" },
            {},
            null,
            { id: "'; DROP TABLE products" },
        ])
    ).toEqual([id]);
    expect(toSearchCandidateIds({ results: [{ id }] })).toEqual([]);
});
