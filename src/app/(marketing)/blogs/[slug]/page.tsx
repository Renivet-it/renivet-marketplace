import { BlogPage, RecentsList } from "@/components/blogs/blog";
import { GeneralShell } from "@/components/globals/layouts";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { DEFAULT_BLOG_THUMBNAIL_URL } from "@/config/const";
import { siteConfig } from "@/config/site";
import { db } from "@/lib/db";
import { blogs } from "@/lib/db/schema";
import { cn, getAbsoluteURL } from "@/lib/utils";
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
            <Suspense fallback={<BlogPageSkeleton />}>
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

function BlogPageSkeleton() {
    return (
        <div className="grid grid-cols-1 gap-y-10 md:gap-10 lg:grid-cols-3">
            <div className="col-span-2 space-y-10">
                <div className="space-y-1">
                    <Skeleton className="h-10" />
                    <Skeleton className="h-10 w-1/4" />
                </div>

                <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-4">
                        <Skeleton className="size-10 rounded-full" />

                        <div className="space-y-1">
                            <Skeleton className="h-5 w-36" />
                            <Skeleton className="h-4 w-20" />
                        </div>
                    </div>

                    <Skeleton className="h-5 w-20" />
                </div>

                <Skeleton className="aspect-video w-full" />

                <div className="space-y-1">
                    <Skeleton className="mb-4 h-10 w-1/4" />

                    {Array.from({ length: 5 }).map((_, i) => (
                        <Skeleton
                            key={i}
                            className={cn("h-5", i === 4 ? "w-3/4" : "w-full")}
                        />
                    ))}
                </div>

                <div className="space-y-1">
                    <Skeleton className="mb-4 h-10 w-1/4" />

                    {Array.from({ length: 8 }).map((_, i) => (
                        <Skeleton
                            key={i}
                            className={cn("h-5", i === 7 ? "w-3/5" : "w-full")}
                        />
                    ))}

                    {Array.from({ length: 4 }).map((_, i) => (
                        <Skeleton
                            key={i}
                            className={cn("h-5", i === 3 ? "w-1/4" : "w-full")}
                        />
                    ))}
                </div>
            </div>

            <div className="flex h-full gap-10 md:col-span-1">
                <Separator
                    orientation="vertical"
                    className="hidden h-full lg:inline-block"
                />

                <div className="w-full space-y-5">
                    <h2 className="text-2xl font-semibold">Recent Blogs</h2>

                    <div className="space-y-5">
                        {Array.from({ length: 3 }).map((_, i) => (
                            <div
                                key={i}
                                className="flex flex-col gap-5 md:flex-row"
                            >
                                <Skeleton className="aspect-[3/2] w-full md:basis-2/5" />

                                <div className="w-full space-y-1 md:basis-3/5">
                                    <Skeleton className="h-10" />

                                    {Array.from({ length: 3 }).map((_, i) => (
                                        <Skeleton
                                            key={i}
                                            className={cn(
                                                "h-5",
                                                i === 2 ? "w-3/4" : "w-full"
                                            )}
                                        />
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
