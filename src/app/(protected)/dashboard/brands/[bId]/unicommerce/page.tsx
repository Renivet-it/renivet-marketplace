import { UnicommerceSettingsForm } from "@/components/dashboard/brands/unicommerce";
import { DashShell } from "@/components/globals/layouts";
import { brandCache } from "@/lib/redis/methods";
import { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";

interface PageProps {
    params: Promise<{ bId: string }>;
}

export const metadata: Metadata = {
    title: "Unicommerce Integration",
    description: "Manage your brand Unicommerce inventory integration",
};

export default function Page(props: PageProps) {
    return (
        <DashShell className="max-w-4xl">
            <Suspense fallback={<UnicommerceLoadingSkeleton />}>
                <UnicommerceFetch {...props} />
            </Suspense>
        </DashShell>
    );
}

async function UnicommerceFetch({ params }: PageProps) {
    const { bId } = await params;
    const existingBrand = await brandCache.get(bId);

    if (!existingBrand) notFound();

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">
                    Unicommerce Integration
                </h1>
                <p className="mt-2 text-muted-foreground">
                    Configure and manage Unicommerce connectivity for this
                    brand.
                </p>
            </div>
            <UnicommerceSettingsForm brandId={existingBrand.id} />
        </div>
    );
}

function UnicommerceLoadingSkeleton() {
    return (
        <div className="animate-pulse space-y-6">
            <div className="space-y-2">
                <div className="h-8 w-56 rounded bg-muted" />
                <div className="h-4 w-96 rounded bg-muted" />
            </div>
            <div className="space-y-4 rounded-lg border p-6">
                <div className="h-6 w-48 rounded bg-muted" />
                <div className="h-10 rounded bg-muted" />
                <div className="h-10 rounded bg-muted" />
                <div className="h-10 rounded bg-muted" />
                <div className="h-10 rounded bg-muted" />
            </div>
        </div>
    );
}
