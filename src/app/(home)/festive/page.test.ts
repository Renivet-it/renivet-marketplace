import { describe, expect, test } from "bun:test";
import type { Metadata } from "next";

import { metadata } from "./page";

describe("festive page metadata", () => {
    test("uses festive-specific metadata for every social preview", () => {
        const expectedTitle = "Festive Collection | Renivet";
        const expectedDescription =
            "Shop Renivet's curated festive collection for thoughtful gifting.";

        expect(metadata.openGraph).toMatchObject({
            title: expectedTitle,
            description: expectedDescription,
        });
        expect(metadata.twitter).toMatchObject({
            card: "summary_large_image",
            title: expectedTitle,
            description: expectedDescription,
        } satisfies Metadata["twitter"]);
    });
});
