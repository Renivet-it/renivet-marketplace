import { BlogPage, RecentsList } from "@/components/blogs/blog";
import { GeneralShell } from "@/components/globals/layouts";
import { Separator } from "@/components/ui/separator";
import { DEFAULT_BLOG_THUMBNAIL_URL } from "@/config/const";
import { siteConfig } from "@/config/site";
import { db } from "@/lib/db";
import { blogs } from "@/lib/db/schema";
import { getAbsoluteURL } from "@/lib/utils";
import { blogWithAuthorAndTagSchema } from "@/lib/validations";
import { and, desc, eq } from "drizzle-orm";
import { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";

interface PageProps {
    params: Promise<{
        slug: string;
    }>;
}

export async function generateMetadata({
    params,
}: PageProps): Promise<Metadata> {
    const { slug } = await params;

    const existingBlog = await db.query.blogs.findFirst({
        where: and(eq(blogs.slug, slug), eq(blogs.isPublished, true)),
        with: {
            author: true,
        },
    });
    if (!existingBlog)
        return {
            title: "Blog not found",
            description: "The requested blog was not found.",
        };

    return {
        title: `"${existingBlog.title}" by ${existingBlog.author.firstName} ${existingBlog.author.lastName}`,
        description: existingBlog.description,
        authors: [
            {
                name: `${existingBlog.author.firstName} ${existingBlog.author.lastName}`,
                url: getAbsoluteURL(`/blogs/${slug}`),
            },
        ],
        openGraph: {
            type: "article",
            locale: "en_US",
            url: getAbsoluteURL(`/blogs/${slug}`),
            title: `"${existingBlog.title}" by ${existingBlog.author.firstName} ${existingBlog.author.lastName}`,
            description: existingBlog.description,
            siteName: siteConfig.name,
            images: [
                {
                    url:
                        existingBlog.thumbnailUrl ?? DEFAULT_BLOG_THUMBNAIL_URL,
                    alt: existingBlog.title,
                    height: 1920,
                    width: 1080,
                },
            ],
        },
        twitter: {
            card: "summary_large_image",
            title: `"${existingBlog.title}" by ${existingBlog.author.firstName} ${existingBlog.author.lastName}`,
            description: existingBlog.description,
            images: [
                {
                    url:
                        existingBlog.thumbnailUrl ?? DEFAULT_BLOG_THUMBNAIL_URL,
                    alt: existingBlog.title,
                    height: 1920,
                    width: 1080,
                },
            ],
        },
    };
}

export default function Page({ params }: PageProps) {
    return (
        <GeneralShell>
            <Suspense fallback={<div>Loading...</div>}>
                <BlogFetch params={params} />
            </Suspense>
        </GeneralShell>
    );
}

async function BlogFetch({ params }: PageProps) {
    const { slug } = await params;

    const existingBlog = await db.query.blogs.findFirst({
        where: and(eq(blogs.slug, slug), eq(blogs.isPublished, true)),
        with: {
            author: true,
            tags: {
                with: {
                    tag: true,
                },
            },
        },
    });
    if (!existingBlog) notFound();

    const recentBlogs = await db.query.blogs.findMany({
        where: eq(blogs.isPublished, true),
        orderBy: [desc(blogs.publishedAt)],
        limit: 3,
    });

    const parsed = blogWithAuthorAndTagSchema.parse(existingBlog);

    return (
        <div className="grid grid-cols-1 gap-y-10 md:gap-10 lg:grid-cols-3">
            <BlogPage blog={parsed} className="col-span-2" />

            <div className="flex h-full gap-10 md:col-span-1">
                <Separator
                    orientation="vertical"
                    className="hidden h-full lg:inline-block"
                />
                <RecentsList blogs={recentBlogs} />
            </div>
        </div>
    );
}
