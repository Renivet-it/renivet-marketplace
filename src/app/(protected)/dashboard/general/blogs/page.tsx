import { BlogsTable } from "@/components/dashboard/blogs";
import { DashShell } from "@/components/globals/layouts";
import { Icons } from "@/components/icons";
import { Button } from "@/components/ui/button-dash";
import { Skeleton } from "@/components/ui/skeleton";
import { db } from "@/lib/db";
import { blogs } from "@/lib/db/schema";
import { cn } from "@/lib/utils";
import { blogWithAuthorAndTagSchema } from "@/lib/validations";
import { desc } from "drizzle-orm";
import { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { z } from "zod";

export const metadata: Metadata = {
    title: "Blogs",
    description: "Manage the platform's blogs and articles",
};

interface PageProps {
    searchParams: Promise<{
        page?: string;
        limit?: string;
    }>;
}

export default function Page({ searchParams }: PageProps) {
    return (
        <DashShell>
            <div className="flex flex-col items-center justify-between gap-4 md:flex-row md:gap-2">
                <div className="space-y-1 text-center md:text-start">
                    <div className="text-2xl font-semibold">Blogs</div>
                    <p className="text-balance text-sm text-muted-foreground">
                        Manage the platform&apos;s blogs and articles
                    </p>
                </div>

                <Button
                    asChild
                    className="h-9 px-3 text-xs md:h-10 md:px-4 md:text-sm"
                >
                    <Link href="/dashboard/general/blogs/new">
                        <Icons.PlusCircle className="size-5" />
                        Create New Blog
                    </Link>
                </Button>
            </div>

            <Suspense fallback={<BlogsTableSkeleton />}>
                <BlogsFetch searchParams={searchParams} />
            </Suspense>
        </DashShell>
    );
}

async function BlogsFetch({ searchParams }: PageProps) {
    const { page: pageRaw, limit: limitRaw } = await searchParams;

    const limit =
        limitRaw && !isNaN(parseInt(limitRaw)) ? parseInt(limitRaw) : 10;
    const page = pageRaw && !isNaN(parseInt(pageRaw)) ? parseInt(pageRaw) : 1;

    const data = await db.query.blogs.findMany({
        with: {
            author: true,
            tags: {
                with: {
                    tag: true,
                },
            },
        },
        limit,
        offset: (page - 1) * limit,
        orderBy: [desc(blogs.createdAt)],
        extras: {
            blogCount: db.$count(blogs).as("blog_count"),
        },
    });

    const parsed = blogWithAuthorAndTagSchema
        .merge(
            z.object({
                blogCount: z.string().transform((val) => parseInt(val)),
            })
        )
        .array()
        .parse(data);

    return <BlogsTable initialBlogs={parsed} />;
}

function BlogsTableSkeleton() {
    return (
        <div className="space-y-4">
            <div className="flex items-center gap-2">
                <div className="flex w-full flex-col items-center gap-2 md:flex-row">
                    {Array.from({ length: 2 }).map((_, i) => (
                        <Skeleton
                            key={i}
                            className="h-10 w-full rounded-md md:w-44"
                        />
                    ))}
                </div>

                <Skeleton className="hidden h-9 w-24 rounded-md md:inline-block" />
            </div>

            <Skeleton className="h-96 w-full rounded-md" />

            <div className="flex items-center justify-between gap-2">
                <Skeleton className="h-4 w-36 rounded-md" />

                <div className="flex items-center gap-2">
                    {Array.from({ length: 4 }).map((_, i) => (
                        <Skeleton
                            key={i}
                            className={cn("size-8 rounded-md", {
                                "w-20": i === 0 || i === 3,
                                "hidden md:inline-block": i === 1 || i === 2,
                            })}
                        />
                    ))}
                </div>
            </div>
        </div>
    );
}
