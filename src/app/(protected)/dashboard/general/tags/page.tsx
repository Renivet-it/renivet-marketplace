import { TagsPage, TagsTable } from "@/components/dashboard/tags";
import { DashShell } from "@/components/globals/layouts";
import { TableSkeleton } from "@/components/globals/skeletons";
import { tagCache } from "@/lib/redis/methods";
import { Metadata } from "next";
import { Suspense } from "react";

export const metadata: Metadata = {
    title: "Tags",
    description: "Manage tags for the blog posts",
};

export default function Page() {
    return (
        <DashShell>
            <div className="flex flex-col items-center justify-between gap-4 md:flex-row md:gap-2">
                <div className="space-y-1 text-center md:text-start">
                    <div className="text-2xl font-semibold">Tags</div>
                    <p className="text-balance text-sm text-muted-foreground">
                        Manage tags for your blog posts
                    </p>
                </div>

                <TagsPage />
            </div>

            <Suspense fallback={<TableSkeleton />}>
                <TagsFetch />
            </Suspense>
        </DashShell>
    );
}

async function TagsFetch() {
    const data = await tagCache.getAll();

    const parsed = {
        data,
        count: data.length,
    };

    return <TagsTable initialData={parsed} />;
}
