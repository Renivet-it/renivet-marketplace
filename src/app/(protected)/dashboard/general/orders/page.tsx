import {
    OrdersDownload,
    OrdersTable,
} from "@/components/dashboard/general/orders";
import { DashShell } from "@/components/globals/layouts";
import { TableSkeleton } from "@/components/globals/skeletons";
import { orderQueries, userQueries } from "@/lib/db/queries";
import { auth } from "@clerk/nextjs/server";
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
        statusTab?:
            | "all"
            | "ready_to_pickup"
            | "pickup_scheduled"
            | "shipped"
            | "delivered"
            | "cancelled"
            | "rto";
    }>;
}

const isOrderManagerRole = (
    roles: { name: string; slug: string }[] | undefined | null
) => {
    if (!roles?.length) return false;

    return roles.some((role) => {
        const raw = `${role.name ?? ""} ${role.slug ?? ""}`.toLowerCase();
        const normalized = raw.replace(/[^a-z]/g, "");

        return (
            normalized.includes("ordermanag") ||
            normalized.includes("ordersmanag") ||
            normalized.includes("orderamanger")
        );
    });
};

export default function Page(props: PageProps) {
    return (
        <DashShell>
            <div className="flex flex-col items-center justify-between gap-4 md:flex-row md:gap-2">
                <div className="space-y-1 text-center md:text-start">
                    <h1 className="text-2xl font-bold">Orders</h1>
                    <p className="text-balance text-sm text-muted-foreground">
                        View all the orders placed by the customers
                    </p>
                </div>

                <Suspense>
                    <OrdersDownloadFetch />
                </Suspense>
            </div>

            <Suspense fallback={<TableSkeleton />}>
                <OrdersFetch {...props} />
            </Suspense>
        </DashShell>
    );
}

async function OrdersFetch({ searchParams }: PageProps) {
    const { userId } = await auth();

    const {
        page: pageRaw,
        limit: limitRaw,
        search: searchRaw,
        statusTab: statusTabRaw,
    } = await searchParams;

    const limit =
        limitRaw && !isNaN(parseInt(limitRaw)) ? parseInt(limitRaw) : 10;
    const page = pageRaw && !isNaN(parseInt(pageRaw)) ? parseInt(pageRaw) : 1;
    const search = searchRaw?.length ? searchRaw : undefined;
    const statusTab = statusTabRaw || "all";

    const data = await orderQueries.getOrders({
        page,
        limit,
        search,
        statusTab,
    });

    const currentUser = userId ? await userQueries.getUser(userId) : null;
    const isOrderManager = isOrderManagerRole(currentUser?.roles);

    return <OrdersTable initialData={data} isOrderManager={isOrderManager} />;
}

async function OrdersDownloadFetch() {
    const data = await orderQueries.getAllOrders();
    // console.log("Fetched orders for download:", data);
    return <OrdersDownload orders={data} />;
}
