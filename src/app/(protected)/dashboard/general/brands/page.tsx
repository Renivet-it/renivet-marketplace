import {
    BrandsDownload,
    BrandsTable,
} from "@/components/dashboard/general/brands";
import { DashShell } from "@/components/globals/layouts";
import { TableSkeleton } from "@/components/globals/skeletons";
import { Icons } from "@/components/icons";
import { db } from "@/lib/db";
import { brandConfidentialQueries, brandQueries } from "@/lib/db/queries";
import { brandRequests } from "@/lib/db/schema";
import { brandCache } from "@/lib/redis/methods";
import { eq } from "drizzle-orm";
import { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";

export const metadata: Metadata = {
    title: "Brands",
    description: "Manage the platform's brands",
};

interface PageProps {
    searchParams: Promise<{
        page?: string;
        limit?: string;
        search?: string;
    }>;
}

export default function Page({ searchParams }: PageProps) {
    return (
        <DashShell>
            <div className="flex flex-col items-center justify-between gap-4 md:flex-row md:gap-2">
                <div className="space-y-1 text-center md:text-start">
                    <h1 className="text-2xl font-bold">Brands</h1>
                    <p className="text-balance text-sm text-muted-foreground">
                        Manage the platform&apos;s brands
                    </p>
                </div>

                <Suspense>
                    <BrandsDownloadFetch />
                </Suspense>
            </div>

            <Suspense>
                <BrandRequestsFetch />
            </Suspense>

            <Suspense>
                <BrandVerificationFetch />
            </Suspense>

            <Suspense fallback={<TableSkeleton />}>
                <BrandsFetch searchParams={searchParams} />
            </Suspense>
        </DashShell>
    );
}

async function BrandsDownloadFetch() {
    const data = await brandCache.getAll();
    return <BrandsDownload data={data} />;
}

async function BrandRequestsFetch() {
    const data = await db.$count(
        brandRequests,
        eq(brandRequests.status, "pending")
    );
    if (+data === 0) return null;

    return (
        <Link
            href="/dashboard/general/brands/requests"
            className="flex items-center justify-between gap-5 rounded-md bg-destructive p-2 px-4 text-sm text-destructive-foreground"
        >
            <p>
                You have <span className="font-semibold">{data}</span> pending
                brand requests
            </p>

            <button>
                <Icons.ArrowRight className="size-4" />
                <span className="sr-only">View pending brand requests</span>
            </button>
        </Link>
    );
}

async function BrandVerificationFetch() {
    const data = await brandConfidentialQueries.getCount("pending");
    if (data === 0) return null;

    return (
        <Link
            href="/dashboard/general/brands/verifications"
            className="flex items-center justify-between gap-5 rounded-md bg-destructive p-2 px-4 text-sm text-destructive-foreground"
        >
            <p>
                You have <span className="font-semibold">{data}</span> pending
                brand verifications
            </p>

            <button>
                <Icons.ArrowRight className="size-4" />
                <span className="sr-only">
                    View pending brand verifications
                </span>
            </button>
        </Link>
    );
}

async function BrandsFetch({ searchParams }: PageProps) {
    const {
        page: pageRaw,
        limit: limitRaw,
        search: searchRaw,
    } = await searchParams;

    const limit =
        limitRaw && !isNaN(parseInt(limitRaw)) ? parseInt(limitRaw) : 10;
    const page = pageRaw && !isNaN(parseInt(pageRaw)) ? parseInt(pageRaw) : 1;
    const search = searchRaw?.length ? searchRaw : undefined;

    const data = await brandQueries.getBrands({
        limit,
        page,
        search,
    });

    return <BrandsTable initialData={data} />;
}
