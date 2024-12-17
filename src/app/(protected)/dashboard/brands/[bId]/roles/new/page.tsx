import { RoleManageForm } from "@/components/globals/forms";
import { DashShell } from "@/components/globals/layouts";
import { Skeleton } from "@/components/ui/skeleton";
import { brandCache } from "@/lib/redis/methods";
import { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";

interface PageProps {
    params: Promise<{ bId: string }>;
}

export const metadata: Metadata = {
    title: "Create New Role",
    description: "Create a new role and assign permissions to it",
};

export default function Page({ params }: PageProps) {
    return (
        <DashShell>
            <div className="space-y-1">
                <h1 className="text-2xl font-bold">Create New Role</h1>
                <p className="text-sm text-muted-foreground">
                    Create a new role and assign permissions to it
                </p>
            </div>

            <Suspense fallback={<RoleEditSkeleton />}>
                <BrandFetch params={params} />
            </Suspense>
        </DashShell>
    );
}

async function BrandFetch({ params }: PageProps) {
    const { bId } = await params;
    const cachedBrand = await brandCache.get(bId);
    if (!cachedBrand) notFound();

    return <RoleManageForm type="brand" brandId={bId} />;
}

function RoleEditSkeleton() {
    return (
        <div className="space-y-6">
            <div className="space-y-2">
                <p className="text-sm">Name</p>
                <Skeleton className="h-10 rounded-md" />
            </div>

            <div className="space-y-2">
                <div className="flex items-center justify-between gap-2">
                    <p className="text-sm">Brand Permissions</p>
                    <Skeleton className="h-9 w-24 rounded-md" />
                </div>

                <div className="space-y-2">
                    {Array.from({ length: 6 }).map((_, i) => (
                        <Skeleton key={i} className="h-20 rounded-md" />
                    ))}
                </div>
            </div>

            <Skeleton className="h-10 rounded-md" />
        </div>
    );
}
