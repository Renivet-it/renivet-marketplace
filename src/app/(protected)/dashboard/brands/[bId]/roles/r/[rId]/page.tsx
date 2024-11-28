import { RoleManageForm } from "@/components/globals/forms";
import { DashShell } from "@/components/globals/layouts";
import { Skeleton } from "@/components/ui/skeleton";
import { brandCache } from "@/lib/redis/methods";
import { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";

interface PageProps {
    params: Promise<{ bId: string; rId: string }>;
}

export async function generateMetadata({
    params,
}: PageProps): Promise<Metadata> {
    const { bId, rId } = await params;

    const existingBrand = await brandCache.get(bId);
    if (!existingBrand)
        return {
            title: "Brand not found",
            description: "The requested brand was not found.",
        };

    const existingRole = existingBrand.roles.find((role) => role.id === rId);
    if (!existingRole)
        return {
            title: "Role not found",
            description: "The requested role was not found.",
        };

    return {
        title: `Edit "${existingRole.name}"`,
        description: `Edit the role details for "${existingRole.name}"`,
    };
}

export default function Page({ params }: PageProps) {
    return (
        <DashShell>
            <div className="space-y-1">
                <div className="text-2xl font-semibold">Edit Role</div>
                <p className="text-sm text-muted-foreground">
                    Edit the role details below
                </p>
            </div>

            <Suspense fallback={<RoleEditSkeleton />}>
                <RoleEditFetch params={params} />
            </Suspense>
        </DashShell>
    );
}

async function RoleEditFetch({ params }: PageProps) {
    const { bId, rId } = await params;

    const existingBrand = await brandCache.get(bId);
    if (!existingBrand) notFound();

    const existingRole = existingBrand.roles.find((role) => role.id === rId);
    if (!existingRole) notFound();

    return <RoleManageForm role={existingRole} type="brand" brandId={bId} />;
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
                    <p className="text-sm"> Site Permissions</p>
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
