import { BannerManageForm } from "@/components/globals/forms";
import { DashShell } from "@/components/globals/layouts";
import { Skeleton } from "@/components/ui/skeleton";
import { bannerQueries } from "@/lib/db/queries";
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

    const existingBanner = await bannerQueries.getBanner(id);
    if (!existingBanner)
        return {
            title: "Banner not found",
            description: "The requested banner was not found.",
        };

    return {
        title: `Edit "${existingBanner.title}"`,
        description: existingBanner.description,
    };
}

export default function Page({ params }: PageProps) {
    return (
        <DashShell>
            <div className="space-y-1">
                <h1 className="text-2xl font-bold">Edit Banner</h1>
                <p className="text-sm text-muted-foreground">
                    Edit the banner and update it on the platform
                </p>
            </div>

            <Suspense fallback={<BannerEditSkeleton />}>
                <BannerEditFetch params={params} />
            </Suspense>
        </DashShell>
    );
}

async function BannerEditFetch({ params }: PageProps) {
    const { id } = await params;

    const existingBanner = await bannerQueries.getBanner(id);
    if (!existingBanner) notFound();

    return <BannerManageForm banner={existingBanner} />;
}

function BannerEditSkeleton() {
    return (
        <div className="space-y-6">
            {Array.from({ length: 2 }).map((_, i) => (
                <div key={i} className="space-y-2">
                    <p className="text-sm">
                        {i === 0 ? "Title" : "Description"}
                    </p>
                    <Skeleton className="h-10 rounded-md" />
                </div>
            ))}

            <div className="space-y-2">
                <p className="text-sm">Image</p>
                <Skeleton className="h-60 rounded-md" />
            </div>

            <Skeleton className="h-9 w-1/4 rounded-md" />

            <Skeleton className="h-10 w-full rounded-md" />
        </div>
    );
}
