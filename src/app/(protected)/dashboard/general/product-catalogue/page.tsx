import {
    OrdersDownload,
    ProductsTable,
} from "@/components/dashboard/general/order-intent/product-catalogue";
import { DashShell } from "@/components/globals/layouts";
import { TableSkeleton } from "@/components/globals/skeletons";
import { orderQueries } from "@/lib/db/queries";
import { Metadata } from "next";
import { Suspense } from "react";

export const metadata: Metadata = {
    title: "Orders Intent Table",
    description: "View all the orders intented by the customers",
};

interface PageProps {
    searchParams: Promise<{
        page?: string;
        limit?: string;
        search?: string;
    }>;
}

export default function Page(props: PageProps) {
    return (
        <DashShell>
            <div className="flex flex-col items-center justify-between gap-4 md:flex-row md:gap-2">
                <div className="space-y-1 text-center md:text-start">
                    <h1 className="text-2xl font-bold">Order Intent Table</h1>
                    <p className="text-balance text-sm text-muted-foreground">
                        View all the orders intented by the customers
                    </p>
                </div>

                {/* <Suspense>
                    <OrdersDownloadFetch />
                </Suspense> */}
            </div>

            <Suspense fallback={<TableSkeleton />}>
                <OrdersFetch {...props} />
            </Suspense>
        </DashShell>
    );
}

async function OrdersFetch({ searchParams }: PageProps) {
    const {
        page: pageRaw,
        limit: limitRaw,
        search: searchRaw,
    } = await searchParams;

    const limit =
        limitRaw && !isNaN(parseInt(limitRaw)) ? parseInt(limitRaw) : 10;
    const page = pageRaw && !isNaN(parseInt(pageRaw)) ? parseInt(pageRaw) : 1;
    const search = searchRaw?.length ? searchRaw : undefined;

    const data = await orderQueries.getAllIntents({
        page,
        limit,
        search,
    });
// @ts-ignore
    return <ProductsTable initialData={data} />;
}

// async function OrdersDownloadFetch() {
//     const data = await orderQueries.getAllOrders();
//     // console.log("Fetched orders for download:", data);
//     return <OrdersDownload orders={data} />;
// }
