import { DashShell } from "@/components/globals/layouts";
import { TableSkeleton } from "@/components/globals/skeletons";
import { Icons } from "@/components/icons";
import { Button } from "@/components/ui/button-general";
import { db } from "@/lib/db";
import { brandRequests } from "@/lib/db/schema";
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
    }>;
}

export default function Page({ searchParams }: PageProps) {
    return (
        <DashShell>
            <div className="flex flex-col items-center justify-between gap-4 md:flex-row md:gap-2">
                <div className="space-y-1 text-center md:text-start">
                    <div className="text-2xl font-semibold">Brands</div>
                    <p className="text-balance text-sm text-muted-foreground">
                        Manage the platform&apos;s brands
                    </p>
                </div>
            </div>

            <Suspense>
                <BrandRequestsFetch />
            </Suspense>

            <Suspense fallback={<TableSkeleton />}>
                <BrandsFetch searchParams={searchParams} />
            </Suspense>
        </DashShell>
    );
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

async function BrandsFetch({ searchParams }: PageProps) {
    return <></>;
}
