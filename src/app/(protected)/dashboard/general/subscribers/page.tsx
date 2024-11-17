import { SubscribersTable } from "@/components/dashboard/subscribers";
import { DashShell } from "@/components/globals/layouts";
import { TableSkeleton } from "@/components/globals/skeletons";
import { subscriberQueries } from "@/lib/db/queries";
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
        isActive?: string;
        search?: string;
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
    const {
        page: pageRaw,
        limit: limitRaw,
        isActive: isActiveRaw,
        search: searchRaw,
    } = await searchParams;

    const limit =
        limitRaw && !isNaN(parseInt(limitRaw)) ? parseInt(limitRaw) : 10;
    const page = pageRaw && !isNaN(parseInt(pageRaw)) ? parseInt(pageRaw) : 1;
    const isActive =
        isActiveRaw === undefined || isActiveRaw === "true" ? true : false;
    const search = searchRaw?.length ? searchRaw : undefined;

    const data = await subscriberQueries.getSubscribers({
        limit,
        page,
        isActive,
        search,
    });

    return <SubscribersTable initialData={data} />;
}
