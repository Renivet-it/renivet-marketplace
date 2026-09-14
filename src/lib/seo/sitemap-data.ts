import { db } from "@/lib/db";
import { blogs, brands, products } from "@/lib/db/schema";
import {
    buildSitemapEntries,
    getSitemapPageCount,
    type SitemapDataSource,
} from "@/lib/seo/sitemap";
import { and, asc, eq, sql } from "drizzle-orm";

export const SITEMAP_BASE_URL = "https://www.renivet.com";

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

export const sitemapDataSource: SitemapDataSource = {
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

export async function getSitemapPageCountFromDatabase() {
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
