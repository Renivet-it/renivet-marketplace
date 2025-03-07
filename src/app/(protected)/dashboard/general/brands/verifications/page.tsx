import { BrandVerificationsTable } from "@/components/dashboard/general/brand-verifications";
import { DashShell } from "@/components/globals/layouts";
import { TableSkeleton } from "@/components/globals/skeletons";
import { brandConfidentialQueries } from "@/lib/db/queries";
import { BrandRequest } from "@/lib/validations";
import { Metadata } from "next";
import { Suspense } from "react";

export const metadata: Metadata = {
    title: "Brand Verification Requests",
    description: "Manage the platform's brand verification requests",
};

interface PageProps {
    searchParams: Promise<{
        page?: string;
        limit?: string;
        status?: BrandRequest["status"];
        search?: string;
    }>;
}

export default function Page({ searchParams }: PageProps) {
    return (
        <DashShell>
            <div className="flex flex-col items-center justify-between gap-4 md:flex-row md:gap-2">
                <div className="space-y-1 text-center md:text-start">
                    <h1 className="text-2xl font-bold">
                        Brand Verification Requests
                    </h1>
                    <p className="text-balance text-sm text-muted-foreground">
                        Manage the platform&apos;s brand verification requests
                    </p>
                </div>
            </div>

            <Suspense fallback={<TableSkeleton />}>
                <BrandVerificationsFetch searchParams={searchParams} />
            </Suspense>
        </DashShell>
    );
}

async function BrandVerificationsFetch({ searchParams }: PageProps) {
    const {
        page: pageRaw,
        limit: limitRaw,
        status: statusRaw,
        search: searchRaw,
    } = await searchParams;

    const limit =
        limitRaw && !isNaN(parseInt(limitRaw)) ? parseInt(limitRaw) : 10;
    const page = pageRaw && !isNaN(parseInt(pageRaw)) ? parseInt(pageRaw) : 1;
    const status = statusRaw === undefined ? "pending" : statusRaw;
    const search = searchRaw?.length ? searchRaw : undefined;

    const data = await brandConfidentialQueries.getBrandConfidentials({
        limit,
        page,
        search,
        status,
    });

    return <BrandVerificationsTable initialData={data} />;
}
