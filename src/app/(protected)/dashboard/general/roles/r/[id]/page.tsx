import { RoleManageForm } from "@/components/globals/forms";
import { DashShell } from "@/components/globals/layouts";
import { Skeleton } from "@/components/ui/skeleton";
import { roleCache } from "@/lib/redis/methods";
import { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { Suspense } from "react";

interface PageProps {
    params: Promise<{ id: string }>;
}

export async function generateMetadata({
    params,
}: PageProps): Promise<Metadata> {
    const { id } = await params;

    const existingRole = await roleCache.get(id);
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
    const { id } = await params;

    const existingRole = await roleCache.get(id);
    if (!existingRole) notFound();
    if (existingRole.slug === "admin") redirect("/dashboard/general/roles");

    return <RoleManageForm role={existingRole} type="site" />;
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
                    <p className="text-sm">Site Permissions</p>
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
