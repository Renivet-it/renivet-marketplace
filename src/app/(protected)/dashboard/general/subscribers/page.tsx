import { SubscribersTable } from "@/components/dashboard/subscribers";
import { DashShell } from "@/components/globals/layouts";
import { TableSkeleton } from "@/components/globals/skeletons";
import { db } from "@/lib/db";
import { newsletterSubscribers } from "@/lib/db/schema";
import { desc } from "drizzle-orm";
import { Metadata } from "next";
import { Suspense } from "react";

export const metadata: Metadata = {
    title: "Newsletter Subscribers",
    description: "Manage the platform's newsletter subscribers",
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
                        Newsletter Subscribers
                    </div>
                    <p className="text-balance text-sm text-muted-foreground">
                        Manage the platform&apos;s newsletter subscribers
                    </p>
                </div>
            </div>

            <Suspense fallback={<TableSkeleton />}>
                <SubscribersFetch searchParams={searchParams} />
            </Suspense>
        </DashShell>
    );
}

async function SubscribersFetch({ searchParams }: PageProps) {
    const { page: pageRaw, limit: limitRaw } = await searchParams;

    const limit =
        limitRaw && !isNaN(parseInt(limitRaw)) ? parseInt(limitRaw) : 10;
    const page = pageRaw && !isNaN(parseInt(pageRaw)) ? parseInt(pageRaw) : 1;

    const data = await db.query.newsletterSubscribers.findMany({
        limit,
        offset: (page - 1) * limit,
        orderBy: [desc(newsletterSubscribers.createdAt)],
        extras: {
            subscriberCount: db
                .$count(newsletterSubscribers)
                .as("subscriber_count"),
        },
    });

    return <SubscribersTable initialData={data} />;
}
