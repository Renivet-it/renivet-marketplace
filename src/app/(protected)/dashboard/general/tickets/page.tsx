import { TicketsTable } from "@/components/dashboard/tickets";
import { DashShell } from "@/components/globals/layouts";
import { TableSkeleton } from "@/components/globals/skeletons";
import { ticketQueries } from "@/lib/db/queries";
import { Metadata } from "next";
import { Suspense } from "react";

export const metadata: Metadata = {
    title: "Tickets",
    description: "Manage the platform's tickets",
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
                    <div className="text-2xl font-semibold">Tickets</div>
                    <p className="text-balance text-sm text-muted-foreground">
                        Manage the platform&apos;s tickets
                    </p>
                </div>
            </div>

            <Suspense fallback={<TableSkeleton />}>
                <TicketsFetch searchParams={searchParams} />
            </Suspense>
        </DashShell>
    );
}

async function TicketsFetch({ searchParams }: PageProps) {
    const {
        page: pageRaw,
        limit: limitRaw,
        search: searchRaw,
    } = await searchParams;

    const limit =
        limitRaw && !isNaN(parseInt(limitRaw)) ? parseInt(limitRaw) : 10;
    const page = pageRaw && !isNaN(parseInt(pageRaw)) ? parseInt(pageRaw) : 1;
    const search = searchRaw?.length ? searchRaw : undefined;

    const data = await ticketQueries.getTickets({
        limit,
        page,
        search,
    });

    return <TicketsTable initialData={data} />;
}
