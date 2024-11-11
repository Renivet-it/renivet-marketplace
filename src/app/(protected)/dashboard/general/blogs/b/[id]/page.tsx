import { BlogManageForm } from "@/components/globals/forms";
import { DashShell } from "@/components/globals/layouts";
import { Skeleton } from "@/components/ui/skeleton";
import { db } from "@/lib/db";
import { blogs } from "@/lib/db/schema";
import { cn } from "@/lib/utils";
import { blogWithAuthorAndTagSchema } from "@/lib/validations";
import { and, eq } from "drizzle-orm";
import { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";

interface PageProps {
    params: Promise<{
        id: string;
    }>;
}

export async function generateMetadata({
    params,
}: PageProps): Promise<Metadata> {
    const { id } = await params;

    const existingBlog = await db.query.blogs.findFirst({
        where: and(eq(blogs.id, id)),
    });
    if (!existingBlog)
        return {
            title: "Blog not found",
            description: "The requested blog was not found.",
        };

    return {
        title: `Edit "${existingBlog.title}"`,
        description: existingBlog.description,
    };
}

export default function Page({ params }: PageProps) {
    return (
        <DashShell>
            <div className="space-y-1">
                <div className="text-2xl font-semibold">Edit Blog Post</div>
                <p className="text-sm text-muted-foreground">
                    Edit the blog post and update it on the platform
                </p>
            </div>

            <Suspense fallback={<BlogManageSkeleton />}>
                <BlogEditFetch params={params} />
            </Suspense>
        </DashShell>
    );
}

async function BlogEditFetch({ params }: PageProps) {
    const { id } = await params;

    const [tags, existingBlog] = await Promise.all([
        db.query.tags.findMany(),
        db.query.blogs.findFirst({
            where: and(eq(blogs.id, id)),
            with: {
                tags: {
                    with: {
                        tag: true,
                    },
                },
            },
        }),
    ]);

    if (!existingBlog) notFound();

    const parsed = blogWithAuthorAndTagSchema
        .omit({
            author: true,
        })
        .parse(existingBlog);

    return <BlogManageForm blog={parsed} tags={tags} />;
}

function BlogManageSkeleton() {
    return (
        <div className="space-y-6">
            {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="space-y-2">
                    <Skeleton
                        className={cn("h-4 w-20 rounded-md", {
                            "w-24": i === 1 || i === 3,
                        })}
                    />
                    <Skeleton
                        className={cn(
                            "h-10 w-full rounded-md",
                            i === 1 && "h-20",
                            i === 2 && "h-80",
                            i === 3 && "h-40"
                        )}
                    />
                </div>
            ))}

            <div className="space-y-2">
                <Skeleton className="h-4 w-20 rounded-md" />
                <div className="flex flex-wrap gap-2">
                    {Array.from({ length: 12 }).map((_, i) => (
                        <Skeleton
                            key={i}
                            className={cn("h-8 w-24 rounded-full", {
                                "w-28": i % 3 === 0,
                            })}
                        />
                    ))}
                </div>
            </div>

            <Skeleton className="h-9 w-1/4 rounded-md" />

            <Skeleton className="h-10 w-full rounded-md" />
        </div>
    );
}
