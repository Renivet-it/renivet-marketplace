import { CategoryRequestsTable } from "@/components/dashboard/category-requests";
import { BrandsTable } from "@/components/dashboard/general/brands";
import { DashShell } from "@/components/globals/layouts";
import { TableSkeleton } from "@/components/globals/skeletons";
import { Icons } from "@/components/icons";
import { db } from "@/lib/db";
import {
    brandConfidentialQueries,
    brandQueries,
    categoryRequestQueries,
} from "@/lib/db/queries";
import { brandRequests } from "@/lib/db/schema";
import { CategoryRequest } from "@/lib/validations";
import { eq } from "drizzle-orm";
import { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";

export const metadata: Metadata = {
    title: "Category Requests",
    description: "Manage the platform's category requests submitted by users",
};

interface PageProps {
    searchParams: Promise<{
        page?: string;
        limit?: string;
        status?: CategoryRequest["status"];
    }>;
}

export default function Page({ searchParams }: PageProps) {
    return (
        <DashShell>
            <div className="flex flex-col items-center justify-between gap-4 md:flex-row md:gap-2">
                <div className="space-y-1 text-center md:text-start">
                    <h1 className="text-2xl font-bold">Category Requests</h1>
                    <p className="text-balance text-sm text-muted-foreground">
                        Manage the platform&apos;s category requests submitted
                        by users
                    </p>
                </div>
            </div>

            <Suspense fallback={<TableSkeleton />}>
                <CategoryRequestsFetch searchParams={searchParams} />
            </Suspense>
        </DashShell>
    );
}

async function CategoryRequestsFetch({ searchParams }: PageProps) {
    const {
        page: pageRaw,
        limit: limitRaw,
        status: statusRaw,
    } = await searchParams;

    const limit =
        limitRaw && !isNaN(parseInt(limitRaw)) ? parseInt(limitRaw) : 10;
    const page = pageRaw && !isNaN(parseInt(pageRaw)) ? parseInt(pageRaw) : 1;
    const status = statusRaw === undefined ? "pending" : statusRaw;

    const data = await categoryRequestQueries.getCategoryRequests({
        limit,
        page,
        status,
    });

    return <CategoryRequestsTable initialData={data} />;
}
