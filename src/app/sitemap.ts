import { db } from "@/lib/db";
import { blogs, brands, products } from "@/lib/db/schema";
import {
    buildSitemapEntries,
    getSitemapPageCount,
    loadSitemapShard,
    type SitemapDataSource,
} from "@/lib/seo/sitemap";
import { and, asc, eq, sql } from "drizzle-orm";
import type { MetadataRoute } from "next";

export const dynamic = "force-dynamic";

const SITEMAP_BASE_URL = "https://www.renivet.com";

const publicProductPredicate = and(
    eq(products.isActive, true),
    eq(products.isAvailable, true),
    eq(products.isPublished, true),
    eq(products.isDeleted, false),
    eq(products.verificationStatus, "approved"),
    sql`EXISTS (
        SELECT 1
        FROM brands
        WHERE brands.id = ${products.brandId}
          AND brands.is_active = true
    )`
);

const sitemapDataSource: SitemapDataSource = {
    countProducts: () => db.$count(products, publicProductPredicate),
    countBlogs: () => db.$count(blogs, eq(blogs.isPublished, true)),
    countBrands: () => db.$count(brands, eq(brands.isActive, true)),
    async findProducts({ limit, offset }) {
        const rows = await db
            .select({
                id: products.id,
                slug: products.slug,
                updatedAt: products.updatedAt,
                isActive: products.isActive,
                isAvailable: products.isAvailable,
                isPublished: products.isPublished,
                isDeleted: products.isDeleted,
                verificationStatus: products.verificationStatus,
            })
            .from(products)
            .where(publicProductPredicate)
            .orderBy(asc(products.slug), asc(products.id))
            .limit(limit)
            .offset(offset);

        return rows.map((product) => ({ ...product, brandIsActive: true }));
    },
    findBlogs: ({ limit, offset }) =>
        db
            .select({
                id: blogs.id,
                slug: blogs.slug,
                updatedAt: blogs.updatedAt,
                isPublished: blogs.isPublished,
            })
            .from(blogs)
            .where(eq(blogs.isPublished, true))
            .orderBy(asc(blogs.slug), asc(blogs.id))
            .limit(limit)
            .offset(offset),
    findBrands: ({ limit, offset }) =>
        db
            .select({
                id: brands.id,
                updatedAt: brands.updatedAt,
                isActive: brands.isActive,
            })
            .from(brands)
            .where(eq(brands.isActive, true))
            .orderBy(asc(brands.id))
            .limit(limit)
            .offset(offset),
};

async function getSitemapPageCountFromDatabase() {
    const [productCount, blogCount, brandCount] = await Promise.all([
        sitemapDataSource.countProducts(),
        sitemapDataSource.countBlogs(),
        sitemapDataSource.countBrands(),
    ]);
    const staticEntryCount = buildSitemapEntries({
        baseUrl: SITEMAP_BASE_URL,
    }).length;

    return getSitemapPageCount(
        staticEntryCount + productCount + blogCount + brandCount
    );
}

export async function generateSitemaps() {
    const pageCount = await getSitemapPageCountFromDatabase();

    return pageCount > 1
        ? Array.from({ length: pageCount }, (_, id) => ({ id }))
        : [];
}

export default async function sitemap({
    id,
}: {
    id?: string;
} = {}): Promise<MetadataRoute.Sitemap> {
    const pageId = id === undefined ? 0 : Number(id);

    if (!Number.isSafeInteger(pageId) || pageId < 0) {
        throw new RangeError(
            "Sitemap shard id must be a non-negative integer."
        );
    }

    return loadSitemapShard({
        baseUrl: SITEMAP_BASE_URL,
        pageId,
        source: sitemapDataSource,
    });
}
