import { BlogManageForm } from "@/components/globals/forms";
import { DashShell } from "@/components/globals/layouts";
import { Skeleton } from "@/components/ui/skeleton";
import { tagCache } from "@/lib/redis/methods";
import { cn } from "@/lib/utils";
import { Metadata } from "next";
import { Suspense } from "react";

export const metadata: Metadata = {
    title: "Create New Blog",
    description: "Create a new blog post and publish it to the platform",
};

export default function Page() {
    return (
        <DashShell>
            <div className="space-y-1">
                <div className="text-2xl font-semibold">Create New Blog</div>
                <p className="text-sm text-muted-foreground">
                    Create a new blog post and publish it to the platform
                </p>
            </div>

            <Suspense fallback={<BlogManageSkeleton />}>
                <BlogCreateFetch />
            </Suspense>
        </DashShell>
    );
}

async function BlogCreateFetch() {
    const tags = await tagCache.getAll();
    return <BlogManageForm tags={tags} />;
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
