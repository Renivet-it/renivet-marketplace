import { db } from "@/lib/db";
import { blogs, brands, categories, products } from "@/lib/db/schema";
import { getAbsoluteURL } from "@/lib/utils";
import { and, eq } from "drizzle-orm";
import type { MetadataRoute } from "next";

const STATIC_ROUTES = [
    ["/", "daily", 1],
    ["/shop", "daily", 0.9],
    ["/festive", "daily", 0.9],
    ["/swap-passport", "weekly", 0.8],
    ["/about", "monthly", 0.6],
    ["/contact", "monthly", 0.4],
    ["/blogs", "weekly", 0.7],
] as const;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
    const [productRows, blogRows, brandRows, categoryRows] = await Promise.all([
        db.query.products.findMany({
            columns: { slug: true, updatedAt: true },
            where: and(
                eq(products.isPublished, true),
                eq(products.isAvailable, true),
                eq(products.isActive, true),
                eq(products.verificationStatus, "approved"),
                eq(products.isDeleted, false)
            ),
        }),
        db.query.blogs.findMany({
            columns: { slug: true, updatedAt: true, isPublished: true },
            where: eq(blogs.isPublished, true),
        }),
        db.query.brands.findMany({
            columns: { slug: true, updatedAt: true, isActive: true },
            where: eq(brands.isActive, true),
        }),
        db.query.categories.findMany({
            columns: { id: true, updatedAt: true },
        }),
    ]);

    const staticPages: MetadataRoute.Sitemap = STATIC_ROUTES.map(
        ([route, changeFrequency, priority]) => ({
            url: getAbsoluteURL(route),
            changeFrequency,
            priority,
        })
    );

    return [
        ...staticPages,
        ...categoryRows.map((category) => ({
            url: getAbsoluteURL(`/shop?categoryId=${category.id}`),
            lastModified: category.updatedAt,
            changeFrequency: "weekly" as const,
            priority: 0.7,
        })),
        ...productRows.map((product) => ({
            url: getAbsoluteURL(`/products/${product.slug}`),
            lastModified: product.updatedAt,
            changeFrequency: "weekly" as const,
            priority: 0.7,
        })),
        ...blogRows.map((blog) => ({
            url: getAbsoluteURL(`/blogs/${blog.slug}`),
            lastModified: blog.updatedAt,
            changeFrequency: "monthly" as const,
            priority: 0.5,
        })),
        ...brandRows.map((brand) => ({
            url: getAbsoluteURL(`/brands/${brand.slug}/shop`),
            lastModified: brand.updatedAt,
            changeFrequency: "monthly" as const,
            priority: 0.5,
        })),
    ];
}
