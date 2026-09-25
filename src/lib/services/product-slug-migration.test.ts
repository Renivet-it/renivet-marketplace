import { describe, expect, test } from "bun:test";
import { buildSlugMigrationManifest } from "./product-slug-migration";

const row = (
    overrides: Partial<
        Parameters<typeof buildSlugMigrationManifest>[0][number]
    > = {}
) => ({
    id: "00000000-0000-0000-0000-000000000001",
    title: "Organic Shirt",
    slug: "terra-luna-organic-shirt-1745403913594-zgp3u",
    brandName: "Terra Luna",
    createdAt: new Date("2025-01-01T00:00:00.000Z"),
    updatedAt: new Date("2025-01-02T00:00:00.000Z"),
    isPublic: true,
    ...overrides,
});

describe("product slug migration manifest", () => {
    test("uses the exact product slug helper and marks public base collisions for review", () => {
        const result = buildSlugMigrationManifest([
            row(),
            row({
                id: "00000000-0000-0000-0000-000000000002",
                slug: "terra-luna-organic-shirt-1745403913595-zgp3v",
                createdAt: new Date("2025-01-03T00:00:00.000Z"),
            }),
        ]);

        expect(result.counts.eligible).toBe(2);
        expect(result.counts.conflicts).toBe(1);
        expect(
            result.manifest.entries.every((entry) => entry.requiresManualReview)
        ).toBe(true);
        expect(
            result.manifest.entries.map((entry) => entry.proposedSlug)
        ).toEqual(["terra-luna-organic-shirt", "terra-luna-organic-shirt-2"]);
    });

    test("excludes non-public legacy products without changing clean slugs", () => {
        const result = buildSlugMigrationManifest([
            row({ isPublic: false }),
            row({
                id: "00000000-0000-0000-0000-000000000002",
                slug: "terra-luna-clean-shirt",
            }),
        ]);

        expect(result.counts.legacy).toBe(1);
        expect(result.counts.eligible).toBe(0);
        expect(result.counts.nonPublic).toBe(1);
        expect(result.manifest.entries).toHaveLength(0);
    });

    test("reports Unicode-sensitive candidates for exact JavaScript validation", () => {
        const result = buildSlugMigrationManifest([
            row({ title: "Café Shirt" }),
        ]);
        expect(result.counts.unicodeSensitive).toBe(1);
        expect(result.manifest.entries[0]?.proposedSlug).toBe(
            "terra-luna-cafe-shirt"
        );
    });
});
