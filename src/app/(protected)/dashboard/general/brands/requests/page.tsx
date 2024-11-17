import { BrandRequestsTable } from "@/components/dashboard/brand-requests";
import { DashShell } from "@/components/globals/layouts";
import { TableSkeleton } from "@/components/globals/skeletons";
import { db } from "@/lib/db";
import { brandRequests } from "@/lib/db/schema";
import { brandRequestWithOwnerSchema } from "@/lib/validations";
import { desc } from "drizzle-orm";
import { Metadata } from "next";
import { Suspense } from "react";
import { z } from "zod";

export const metadata: Metadata = {
    title: "Brand Requests",
    description: "Manage the platform's brand requests",
};

interface PageProps {
    searchParams: Promise<{
        page?: string;
        limit?: string;
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
    const { page: pageRaw, limit: limitRaw } = await searchParams;

    const limit =
        limitRaw && !isNaN(parseInt(limitRaw)) ? parseInt(limitRaw) : 10;
    const page = pageRaw && !isNaN(parseInt(pageRaw)) ? parseInt(pageRaw) : 1;

    const data = await db.query.brandRequests.findMany({
        with: {
            owner: true,
        },
        limit,
        offset: (page - 1) * limit,
        orderBy: [desc(brandRequests.createdAt)],
        extras: {
            requestCount: db.$count(brandRequests).as("request_count"),
        },
    });

    const parsed = brandRequestWithOwnerSchema
        .extend({
            requestCount: z.string().transform((val) => parseInt(val)),
        })
        .array()
        .parse(data);

    return <BrandRequestsTable initialData={parsed} />;
}
