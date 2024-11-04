import { BlogsTable } from "@/components/dashboard/blogs";
import { DashShell } from "@/components/globals/layouts";
import { TableSkeleton } from "@/components/globals/skeletons";
import { Icons } from "@/components/icons";
import { Button } from "@/components/ui/button-dash";
import { db } from "@/lib/db";
import { blogs } from "@/lib/db/schema";
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

            <Suspense fallback={<TableSkeleton />}>
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
