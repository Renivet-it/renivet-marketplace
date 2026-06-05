import { OrdersTable } from "@/components/dashboard/general/orders";
import { DashShell } from "@/components/globals/layouts";
import { TableSkeleton } from "@/components/globals/skeletons";
import { orderQueries } from "@/lib/db/queries";
import { Metadata } from "next";
import { Suspense } from "react";

export const metadata: Metadata = {
    title: "Orders",
    description: "View all the orders placed by the customers",
};

interface PageProps {
    searchParams: Promise<{
        page?: string;
        limit?: string;
        search?: string;
        startDate?: string;
        endDate?: string;
        statusTab?:
            | "all"
            | "ready_to_pickup"
            | "pickup_scheduled"
            | "shipped"
            | "delivered"
            | "cancelled"
            | "rto";
    }>;
    params: Promise<{
        bId: string;
    }>;
}

export default function Page(props: PageProps) {
    return (
        <DashShell className="max-w-[92rem]">
            <div className="flex flex-col items-center justify-between gap-4 md:flex-row md:gap-2">
                <div className="space-y-1 text-center md:text-start">
                    <h1 className="text-2xl font-bold">Orders</h1>
                    <p className="text-balance text-sm text-muted-foreground">
                        View all the orders placed by the customers
                    </p>
                </div>
            </div>

            <Suspense fallback={<TableSkeleton />}>
                <OrdersFetch {...props} />
            </Suspense>
        </DashShell>
    );
}

async function OrdersFetch({ params, searchParams }: PageProps) {
    const { bId } = await params;
    const {
        page: pageRaw,
        limit: limitRaw,
        search: searchRaw,
        startDate,
        endDate,
        statusTab: statusTabRaw,
    } = await searchParams;

    const limit =
        limitRaw && !isNaN(parseInt(limitRaw)) ? parseInt(limitRaw) : 10;
    const page = pageRaw && !isNaN(parseInt(pageRaw)) ? parseInt(pageRaw) : 1;
    const search = searchRaw?.length ? searchRaw : undefined;
    const statusTab = statusTabRaw || "all";

    const data = await orderQueries.getOrders({
        brandIds: [bId],
        limit,
        page,
        search,
        startDate,
        endDate,
        statusTab,
    });

    return <OrdersTable initialData={data} brandId={bId} />;
}
