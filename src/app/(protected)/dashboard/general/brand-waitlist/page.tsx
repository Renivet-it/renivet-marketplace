import { WaitlistTable } from "@/components/dashboard/brand-waitlist";
import { DashShell } from "@/components/globals/layouts";
import { TableSkeleton } from "@/components/globals/skeletons";
import { db } from "@/lib/db";
import { brandsWaitlist } from "@/lib/db/schema";
import { desc } from "drizzle-orm";
import { Metadata } from "next";
import { Suspense } from "react";

export const metadata: Metadata = {
    title: "Brands Waitlist",
    description: "Manage the platform's brands waitlist",
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
                    <div className="text-2xl font-semibold">
                        Brands Waitlist
                    </div>
                    <p className="text-balance text-sm text-muted-foreground">
                        Manage the platform&apos;s brands waitlist
                    </p>
                </div>
            </div>

            <Suspense fallback={<TableSkeleton />}>
                <WaitlistFetch searchParams={searchParams} />
            </Suspense>
        </DashShell>
    );
}

async function WaitlistFetch({ searchParams }: PageProps) {
    const { page: pageRaw, limit: limitRaw } = await searchParams;

    const limit =
        limitRaw && !isNaN(parseInt(limitRaw)) ? parseInt(limitRaw) : 10;
    const page = pageRaw && !isNaN(parseInt(pageRaw)) ? parseInt(pageRaw) : 1;

    const data = await db.query.brandsWaitlist.findMany({
        limit,
        offset: (page - 1) * limit,
        orderBy: [desc(brandsWaitlist.createdAt)],
        extras: {
            waitlistCount: db.$count(brandsWaitlist).as("waitlist_count"),
        },
    });

    return <WaitlistTable initialData={data} />;
}
