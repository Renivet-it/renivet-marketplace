import { RoleManageForm } from "@/components/globals/forms";
import { DashShell } from "@/components/globals/layouts";
import { roleCache } from "@/lib/redis/methods";
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

            <Suspense fallback={<>Loading...</>}>
                <RoleEditFetch params={params} />
            </Suspense>
        </DashShell>
    );
}

async function RoleEditFetch({ params }: PageProps) {
    const { id } = await params;

    const existingRole = await roleCache.get(id);
    if (!existingRole) notFound();

    return <RoleManageForm role={existingRole} />;
}
