import { BrandOrdersDownload } from "@/components/dashboard/brands/orders/orders-download";
import { BrandOrdersTable } from "@/components/dashboard/brands/orders/orders-table";
import { DashShell } from "@/components/globals/layouts/shells";
import { TableSkeleton } from "@/components/globals/skeletons";
import { orderQueries } from "@/lib/db/queries";
import { Suspense } from "react";

interface PageProps {
    params: {
        bId: string;
    };
    searchParams: {
        page?: string;
        limit?: string;
        search?: string;
    };
}

export default async function Page({ params, searchParams }: PageProps) {
    return (
        <DashShell>
            <div className="flex flex-col items-center justify-between gap-4 md:flex-row md:gap-2">
                <div className="space-y-1 text-center md:text-start">
                    <h1 className="text-2xl font-bold">Orders</h1>
                    <p className="text-balance text-sm text-muted-foreground">
                        Manage orders for your brand
                    </p>
                </div>

                <Suspense>
                    <OrdersDownloadFetch brandId={params.bId} />
                </Suspense>
            </div>

            <Suspense fallback={<TableSkeleton />}>
                <OrdersFetch brandId={params.bId} searchParams={searchParams} />
            </Suspense>
        </DashShell>
    );
}

async function OrdersFetch({
    brandId,
    searchParams,
}: {
    brandId: string;
    searchParams: {
        page?: string;
        limit?: string;
        search?: string;
    };
}) {
    // Process search parameters
    const { page: pageRaw, limit: limitRaw, search: searchRaw } = searchParams;

    const limit =
        limitRaw && !isNaN(parseInt(limitRaw)) ? parseInt(limitRaw) : 10;
    const page = pageRaw && !isNaN(parseInt(pageRaw)) ? parseInt(pageRaw) : 1;
    const search = searchRaw?.length ? searchRaw : undefined;

    // Get orders for this brand
    const data = await orderQueries.getOrdersByBrand(brandId);

    // If search is provided, filter orders by ID
    const filteredData = search
        ? data.filter((order) =>
              order.id.toLowerCase().includes(search.toLowerCase())
          )
        : data;

    // Apply pagination manually since getOrdersByBrand doesn't support it directly
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const paginatedData = filteredData.slice(startIndex, endIndex);

    return (
        <BrandOrdersTable
            initialData={{
                data: paginatedData,
                count: filteredData.length,
            }}
            brandId={brandId}
        />
    );
}

async function OrdersDownloadFetch({ brandId }: { brandId: string }) {
    const data = await orderQueries.getOrdersByBrand(brandId);
    return <BrandOrdersDownload orders={data} brandId={brandId} />;
}
