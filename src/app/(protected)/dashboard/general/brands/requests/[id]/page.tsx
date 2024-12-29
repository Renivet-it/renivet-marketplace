import { BrandRequestPage } from "@/components/dashboard/general/brand-requests";
import { DashShell } from "@/components/globals/layouts";
import { Skeleton } from "@/components/ui/skeleton";
import { brandRequestQueries } from "@/lib/db/queries";
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

    const existingBrandRequest = await brandRequestQueries.getBrandRequest(id);
    if (!existingBrandRequest)
        return {
            title: "Brand Request not found",
            description: "The requested brand request was not found.",
        };

    return {
        title: `Brand Request of ${existingBrandRequest.name}`,
        description: `Brand Request of ${existingBrandRequest.name} by ${existingBrandRequest.owner.firstName} ${existingBrandRequest.owner.lastName}`,
    };
}

export default function Page({ params }: PageProps) {
    return (
        <DashShell>
            <Suspense fallback={<BrandRequestSkeleton />}>
                <BrandRequestFetch params={params} />
            </Suspense>
        </DashShell>
    );
}

async function BrandRequestFetch({ params }: PageProps) {
    const { id } = await params;

    const existingBrandRequest = await brandRequestQueries.getBrandRequest(id);
    if (!existingBrandRequest) notFound();

    return <BrandRequestPage request={existingBrandRequest} />;
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
