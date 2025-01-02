import { BrandVerificationPage } from "@/components/dashboard/general/brand-verifications";
import { DashShell } from "@/components/globals/layouts";
import { Skeleton } from "@/components/ui/skeleton";
import { brandConfidentialQueries } from "@/lib/db/queries";
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

    const existingBrandConf =
        await brandConfidentialQueries.getBrandConfidential(id);
    if (!existingBrandConf)
        return {
            title: "Brand Verification not found",
            description: "The requested brand verification was not found",
        };

    return {
        title: `Brand Verification of ${existingBrandConf.brand.name}`,
        description: `Brand Verification of ${existingBrandConf.brand.name}`,
    };
}

export default function Page({ params }: PageProps) {
    return (
        <DashShell>
            <Suspense fallback={<BrandRequestSkeleton />}>
                <BrandVerificationFetch params={params} />
            </Suspense>
        </DashShell>
    );
}

async function BrandVerificationFetch({ params }: PageProps) {
    const { id } = await params;

    const existingBrandConf =
        await brandConfidentialQueries.getBrandConfidential(id);
    if (!existingBrandConf) notFound();

    return <BrandVerificationPage data={existingBrandConf} />;
}

function BrandRequestSkeleton() {
    return (
        <>
            <div className="flex items-center justify-between gap-2">
                <div className="w-full space-y-1">
                    <Skeleton className="h-7 w-1/4 rounded-md" />
                    <Skeleton className="h-4 w-1/3 rounded-md" />
                </div>

                <Skeleton className="h-5 w-24 rounded-full" />
            </div>

            <div className="space-y-6">
                <Skeleton className="h-64 rounded-md" />
                <Skeleton className="h-96 rounded-md" />
                <Skeleton className="h-96 rounded-md" />
            </div>
        </>
    );
}
