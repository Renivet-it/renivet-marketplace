import { describe, expect, test } from "bun:test";
import type { Metadata } from "next";

import { FESTIVE_CAMPAIGN } from "@/lib/seo/festive-campaign";
import { metadata } from "./page";

describe("festive page metadata", () => {
    test("uses festive-specific metadata for every social preview", () => {
        const expectedTitle = FESTIVE_CAMPAIGN.social.title;
        const expectedDescription = FESTIVE_CAMPAIGN.social.description;

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
