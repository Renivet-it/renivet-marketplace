import { db } from "@/lib/db";
import { blogs } from "@/lib/db/schema";
import { getAbsoluteURL } from "@/lib/utils";
import { eq } from "drizzle-orm";
import { MetadataRoute } from "next";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
    const staticPages: MetadataRoute.Sitemap = [
        "/",
        "/about",
        "/contact",
        "/auth/signin",
        "/auth/signup",
        "/soon",
    ].map((route) => ({
        url: getAbsoluteURL(route),
        lastModified: new Date().toISOString(),
        changeFrequency: "weekly",
        priority: 0.8,
    }));

    const blogPosts = await db.query.blogs.findMany({
        where: eq(blogs.isPublished, true),
    });
    const dynamicPages: MetadataRoute.Sitemap = blogPosts.map((post) => ({
        url: getAbsoluteURL(`/blogs/${post.slug}`),
        lastModified: post.updatedAt.toISOString(),
        changeFrequency: "monthly",
        priority: 0.5,
    }));

    return [...staticPages, ...dynamicPages];
}
