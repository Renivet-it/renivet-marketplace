import { describe, expect, test } from "bun:test";
import {
    buildSitemapEntries,
    getSitemapPageCount,
    getSitemapQueryWindows,
    loadSitemapShard,
    SITEMAP_PAGE_SIZE,
    type SitemapDataSource,
} from "./sitemap";

const BASE_URL = "https://www.renivet.com";
const UPDATED_AT = new Date("2026-09-12T10:00:00.000Z");

describe("buildSitemapEntries", () => {
    test("includes only canonical fixed and public database URLs with stored timestamps", () => {
        const entries = buildSitemapEntries({
            baseUrl: BASE_URL,
            products: [
                {
                    id: "product-live",
                    slug: "live-product",
                    updatedAt: UPDATED_AT,
                    isActive: true,
                    isAvailable: true,
                    isPublished: true,
                    isDeleted: false,
                    verificationStatus: "approved",
                    brandIsActive: true,
                },
                {
                    id: "product-draft",
                    slug: "draft-product",
                    updatedAt: UPDATED_AT,
                    isActive: true,
                    isAvailable: true,
                    isPublished: false,
                    isDeleted: false,
                    verificationStatus: "approved",
                    brandIsActive: true,
                },
                {
                    id: "product-deleted",
                    slug: "deleted-product",
                    updatedAt: UPDATED_AT,
                    isActive: true,
                    isAvailable: true,
                    isPublished: true,
                    isDeleted: true,
                    verificationStatus: "approved",
                    brandIsActive: true,
                },
                {
                    id: "product-unapproved",
                    slug: "unapproved-product",
                    updatedAt: UPDATED_AT,
                    isActive: true,
                    isAvailable: true,
                    isPublished: true,
                    isDeleted: false,
                    verificationStatus: "pending",
                    brandIsActive: true,
                },
                {
                    id: "product-inactive-brand",
                    slug: "inactive-brand-product",
                    updatedAt: UPDATED_AT,
                    isActive: true,
                    isAvailable: true,
                    isPublished: true,
                    isDeleted: false,
                    verificationStatus: "approved",
                    brandIsActive: false,
                },
            ],
            blogs: [
                {
                    id: "blog-published",
                    slug: "published-blog",
                    updatedAt: UPDATED_AT,
                    isPublished: true,
                },
                {
                    id: "blog-draft",
                    slug: "draft-blog",
                    updatedAt: UPDATED_AT,
                    isPublished: false,
                },
            ],
            brands: [
                {
                    id: "brand-active",
                    updatedAt: UPDATED_AT,
                    isActive: true,
                },
                {
                    id: "brand-inactive",
                    updatedAt: UPDATED_AT,
                    isActive: false,
                },
            ],
        });

        expect(entries).toEqual([
            {
                url: "https://www.renivet.com/",
                changeFrequency: "daily",
                priority: 1,
            },
            {
                url: "https://www.renivet.com/blogs/published-blog",
                lastModified: UPDATED_AT,
                changeFrequency: "monthly",
                priority: 0.6,
            },
            {
                url: "https://www.renivet.com/brands/brand-active",
                lastModified: UPDATED_AT,
                changeFrequency: "weekly",
                priority: 0.7,
            },
            {
                url: "https://www.renivet.com/festive",
                changeFrequency: "daily",
                priority: 0.9,
            },
            {
                url: "https://www.renivet.com/products/live-product",
                lastModified: UPDATED_AT,
                changeFrequency: "weekly",
                priority: 0.8,
            },
            {
                url: "https://www.renivet.com/shop",
                changeFrequency: "weekly",
                priority: 0.8,
            },
            {
                url: "https://www.renivet.com/swap-passport",
                changeFrequency: "daily",
                priority: 0.9,
            },
        ]);
    });

    test("sorts deterministically, deduplicates URLs, and never emits category query URLs", () => {
        const entries = buildSitemapEntries({
            baseUrl: BASE_URL,
            staticEntries: [
                {
                    url: "https://www.renivet.com/shop?categoryId=women",
                    changeFrequency: "weekly",
                    priority: 0.8,
                },
                {
                    url: "https://www.renivet.com/shop",
                    changeFrequency: "weekly",
                    priority: 0.8,
                },
            ],
            products: [
                {
                    id: "b",
                    slug: "zebra",
                    updatedAt: UPDATED_AT,
                    isActive: true,
                    isAvailable: true,
                    isPublished: true,
                    isDeleted: false,
                    verificationStatus: "approved",
                    brandIsActive: true,
                },
                {
                    id: "a",
                    slug: "ant",
                    updatedAt: UPDATED_AT,
                    isActive: true,
                    isAvailable: true,
                    isPublished: true,
                    isDeleted: false,
                    verificationStatus: "approved",
                    brandIsActive: true,
                },
                {
                    id: "duplicate",
                    slug: "ant",
                    updatedAt: new Date("2026-09-13T10:00:00.000Z"),
                    isActive: true,
                    isAvailable: true,
                    isPublished: true,
                    isDeleted: false,
                    verificationStatus: "approved",
                    brandIsActive: true,
                },
            ],
        });

        expect(entries.map((entry) => entry.url)).toEqual([
            "https://www.renivet.com/products/ant",
            "https://www.renivet.com/products/zebra",
            "https://www.renivet.com/shop",
        ]);
        expect(entries).not.toContainEqual(
            expect.objectContaining({
                url: "https://www.renivet.com/shop?categoryId=women",
            })
        );
    });

    test("accepts only an absolute HTTPS origin and encodes dynamic path identities", () => {
        expect(() =>
            buildSitemapEntries({
                baseUrl: "http://renivet.com",
                products: [],
            })
        ).toThrow("HTTPS origin");

        expect(
            buildSitemapEntries({
                baseUrl: "https://www.renivet.com/",
                staticEntries: [],
                products: [
                    {
                        id: "product",
                        slug: "summer sale?",
                        updatedAt: UPDATED_AT,
                        isActive: true,
                        isAvailable: true,
                        isPublished: true,
                        isDeleted: false,
                        verificationStatus: "approved",
                        brandIsActive: true,
                    },
                ],
            })
        ).toEqual([
            {
                url: "https://www.renivet.com/products/summer%20sale%3F",
                lastModified: UPDATED_AT,
                changeFrequency: "weekly",
                priority: 0.8,
            },
        ]);
    });
});

describe("sitemap shard helpers", () => {
    test.each([
        [0, 1],
        [49_999, 1],
        [50_000, 1],
        [50_001, 2],
    ])("uses a maximum of 50,000 URLs for %i entries", (entryCount, pages) => {
        expect(SITEMAP_PAGE_SIZE).toBe(50_000);
        expect(getSitemapPageCount(entryCount)).toBe(pages);
    });

    test("calculates bounded offset and limit windows for each live content type", () => {
        expect(
            getSitemapQueryWindows({
                pageId: 1,
                staticEntryCount: 4,
                productCount: 60_000,
                blogCount: 20_000,
                brandCount: 1,
            })
        ).toEqual({
            products: { offset: 49_996, limit: 10_004 },
            blogs: { offset: 0, limit: 20_000 },
            brands: { offset: 0, limit: 1 },
            static: { offset: 4, limit: 0 },
        });
    });
});

describe("loadSitemapShard", () => {
    test("counts first and fetches only the selected stable bounded slices", async () => {
        const calls: Array<{ type: string; limit?: number; offset?: number }> =
            [];
        const source: SitemapDataSource = {
            countProducts: async () => 50_000,
            countBlogs: async () => 3,
            countBrands: async () => 1,
            findProducts: async ({ limit, offset }) => {
                calls.push({ type: "products", limit, offset });
                return [];
            },
            findBlogs: async ({ limit, offset }) => {
                calls.push({ type: "blogs", limit, offset });
                return [];
            },
            findBrands: async ({ limit, offset }) => {
                calls.push({ type: "brands", limit, offset });
                return [];
            },
        };

        await loadSitemapShard({ baseUrl: BASE_URL, pageId: 1, source });

        expect(calls).toEqual([
            { type: "products", limit: 4, offset: 49_996 },
            { type: "blogs", limit: 3, offset: 0 },
            { type: "brands", limit: 1, offset: 0 },
        ]);
    });

    test("fails instead of returning a partial sitemap when a database query fails", async () => {
        const source: SitemapDataSource = {
            countProducts: async () => 1,
            countBlogs: async () => 0,
            countBrands: async () => 0,
            findProducts: async () => {
                throw new Error("database unavailable");
            },
            findBlogs: async () => [],
            findBrands: async () => [],
        };

        await expect(
            loadSitemapShard({ baseUrl: BASE_URL, pageId: 0, source })
        ).rejects.toThrow("database unavailable");
    });
});
