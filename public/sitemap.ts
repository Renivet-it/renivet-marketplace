import { db } from "@/lib/db";
import { blogs, products } from "@/lib/db/schema";
import { getAbsoluteURL } from "@/lib/utils";
import { and, eq } from "drizzle-orm";
import { MetadataRoute } from "next";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
    const staticPages: MetadataRoute.Sitemap = [
        "/auth/signin",
        "/auth/signup",
        "/",
        "/about",
        "/become-a-seller",
        "/contact",
        "/privacy",
        "/refund-policy",
        "/shipping-policy",
        "/terms",
        "/blogs",
        "/brands",
        "/shop",
        "/soon",
    ].map((route) => ({
        url: getAbsoluteURL(route),
        lastModified: new Date().toISOString(),
        changeFrequency: "weekly",
        priority: 0.8,
    }));

    const [blogsData, brandsData, productsData] = await Promise.all([
        db.query.blogs.findMany({
            where: eq(blogs.isPublished, true),
        }),
        db.query.brands.findMany(),
        db.query.products.findMany({
            where: and(
                eq(products.isPublished, true),
                eq(products.isAvailable, true),
                eq(products.isActive, true),
                eq(products.verificationStatus, "approved"),
                eq(products.isDeleted, false)
            ),
        }),
    ]);

    const blogPages: MetadataRoute.Sitemap = blogsData.map((blog) => ({
        url: getAbsoluteURL(`/blogs/${blog.slug}`),
        lastModified: blog.updatedAt.toISOString(),
        changeFrequency: "monthly",
        priority: 0.5,
    }));
    const brandPages: MetadataRoute.Sitemap = brandsData.map((brand) => ({
        url: getAbsoluteURL(`/brands/${brand.id}`),
        lastModified: brand.updatedAt.toISOString(),
        changeFrequency: "monthly",
        priority: 0.5,
    }));
    const productPages: MetadataRoute.Sitemap = productsData.map((product) => ({
        url: getAbsoluteURL(`/products/${product.slug}`),
        lastModified: product.updatedAt.toISOString(),
        changeFrequency: "weekly",
        priority: 0.7,
    }));

    return [...staticPages, ...blogPages, ...brandPages, ...productPages];
}
