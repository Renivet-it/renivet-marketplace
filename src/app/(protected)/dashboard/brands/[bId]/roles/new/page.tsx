import { RoleManageForm } from "@/components/globals/forms";
import { DashShell } from "@/components/globals/layouts";
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
                <div className="text-2xl font-semibold">Create New Role</div>
                <p className="text-sm text-muted-foreground">
                    Create a new role and assign permissions to it
                </p>
            </div>

            <Suspense>
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
