import {
    BrandMediaTable,
    BrandMediaUpload,
} from "@/components/dashboard/brands/media";
import { DashShell } from "@/components/globals/layouts";
import { TableSkeleton } from "@/components/globals/skeletons";
import { mediaCache } from "@/lib/redis/methods";
import { Metadata } from "next";
import { Suspense } from "react";

export const metadata: Metadata = {
    title: "Media Assets",
    description: "Manage the brand's media assets",
};

interface PageProps {
    params: Promise<{ bId: string }>;
}

export default function Page(props: PageProps) {
    return (
        <DashShell>
            <Suspense
                fallback={
                    <>
                        <div className="flex flex-col items-center justify-between gap-4 md:flex-row md:gap-2">
                            <div className="space-y-1 text-center md:text-start">
                                <h1 className="text-2xl font-bold">
                                    Media Assets
                                </h1>
                                <p className="text-balance text-sm text-muted-foreground">
                                    Manage the brand&apos;s media assets
                                </p>
                            </div>
                        </div>

                        <TableSkeleton />
                    </>
                }
            >
                <BrandMediaFetch {...props} />
            </Suspense>
        </DashShell>
    );
}

async function BrandMediaFetch({ params }: PageProps) {
    const { bId } = await params;

    const data = await mediaCache.getAll(bId);
    const sorted = {
        data: data.data.sort(
            (a, b) =>
                new Date(b.createdAt).getTime() -
                new Date(a.createdAt).getTime()
        ),
        count: data.count,
    };

    return (
        <>
            <div className="flex flex-col items-center justify-between gap-4 md:flex-row md:gap-2">
                <div className="space-y-1 text-center md:text-start">
                    <h1 className="text-2xl font-bold">Media Assets</h1>
                    <p className="text-balance text-sm text-muted-foreground">
                        Manage the brand&apos;s media assets
                    </p>
                </div>

                <BrandMediaUpload brandId={bId} />
            </div>

            <BrandMediaTable brandId={bId} initialData={sorted} />
        </>
    );
}
