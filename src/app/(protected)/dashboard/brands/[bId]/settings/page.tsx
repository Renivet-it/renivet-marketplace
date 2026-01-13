import { BrandSettingsForm } from "@/components/dashboard/brands/settings";
import { DashShell } from "@/components/globals/layouts";
import { brandConfidentialQueries } from "@/lib/db/queries";
import { brandCache } from "@/lib/redis/methods";
import { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";

interface PageProps {
    params: Promise<{ bId: string }>;
}

export const metadata: Metadata = {
    title: "Brand Settings",
    description: "Manage your brand profile and appearance",
};

export default function Page(props: PageProps) {
    return (
        <DashShell className="max-w-4xl">
            <Suspense fallback={<SettingsLoadingSkeleton />}>
                <SettingsFetch {...props} />
            </Suspense>
        </DashShell>
    );
}

async function SettingsFetch({ params }: PageProps) {
    const { bId } = await params;

    const [existingBrand, brandConfidential] = await Promise.all([
        brandCache.get(bId),
        brandConfidentialQueries.getBrandConfidential(bId),
    ]);

    if (!existingBrand) notFound();

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">
                    Brand Settings
                </h1>
                <p className="mt-2 text-muted-foreground">
                    Manage your brand&apos;s profile, appearance, and view
                    business information
                </p>
            </div>
            <BrandSettingsForm
                brand={existingBrand}
                brandConfidential={brandConfidential}
            />
        </div>
    );
}

function SettingsLoadingSkeleton() {
    return (
        <div className="animate-pulse space-y-6">
            <div className="space-y-2">
                <div className="h-8 w-48 rounded bg-muted" />
                <div className="h-4 w-96 rounded bg-muted" />
            </div>
            <div className="space-y-4 rounded-lg border p-6">
                <div className="h-6 w-32 rounded bg-muted" />
                <div className="aspect-[4/1] rounded bg-muted" />
                <div className="flex gap-4">
                    <div className="size-24 rounded-full bg-muted" />
                    <div className="flex-1 space-y-2">
                        <div className="h-4 w-24 rounded bg-muted" />
                        <div className="h-3 w-48 rounded bg-muted" />
                    </div>
                </div>
            </div>
            <div className="space-y-4 rounded-lg border p-6">
                <div className="h-6 w-32 rounded bg-muted" />
                <div className="h-24 rounded bg-muted" />
                <div className="h-10 rounded bg-muted" />
            </div>
            <div className="space-y-4 rounded-lg border p-6">
                <div className="h-6 w-40 rounded bg-muted" />
                <div className="grid grid-cols-2 gap-4">
                    <div className="h-10 rounded bg-muted" />
                    <div className="h-10 rounded bg-muted" />
                    <div className="h-10 rounded bg-muted" />
                    <div className="h-10 rounded bg-muted" />
                </div>
            </div>
        </div>
    );
}
