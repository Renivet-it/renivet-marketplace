import { BrandRequestsTable } from "@/components/dashboard/brand-requests";
import { DashShell } from "@/components/globals/layouts";
import { TableSkeleton } from "@/components/globals/skeletons";
import { brandRequestQueries } from "@/lib/db/queries";
import { BrandRequest } from "@/lib/validations";
import { Metadata } from "next";
import { Suspense } from "react";

export const metadata: Metadata = {
    title: "Brand Requests",
    description: "Manage the platform's brand requests",
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
                    <div className="text-2xl font-semibold">Brand Requests</div>
                    <p className="text-balance text-sm text-muted-foreground">
                        Manage the platform&apos;s brand requests
                    </p>
                </div>
            </div>

            <Suspense fallback={<TableSkeleton />}>
                <BrandRequestsFetch searchParams={searchParams} />
            </Suspense>
        </DashShell>
    );
}

async function BrandRequestsFetch({ searchParams }: PageProps) {
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

    const data = await brandRequestQueries.getBrandRequests({
        limit,
        page,
        search,
        status,
    });

    return <BrandRequestsTable initialData={data} />;
}
