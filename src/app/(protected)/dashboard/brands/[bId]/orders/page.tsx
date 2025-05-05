import { OrdersTable } from "@/components/dashboard/brands/orders";
import { DashShell } from "@/components/globals/layouts";
import { TableSkeleton } from "@/components/globals/skeletons";
import { orderQueries } from "@/lib/db/queries";
import { Metadata } from "next";
import { Suspense } from "react";
import { orderSchema } from "../../../../../../lib/validations";
import { z } from "zod";
export const metadata: Metadata = {
    title: "Orders",
    description: "View all the orders placed by the customers",
};

interface PageProps {
    params: Promise<{
        bId: string;
    }>;
}

export default function Page(props: PageProps) {
    return (
        <DashShell>
            <div className="space-y-1 text-center md:text-start">
                <h1 className="text-2xl font-bold">Orders</h1>
                <p className="text-balance text-sm text-muted-foreground">
                    View all the orders placed by the customers
                </p>
            </div>

            <Suspense fallback={<TableSkeleton />}>
                <OrdersFetch {...props} />
            </Suspense>
        </DashShell>
    );
}

async function OrdersFetch({ params }: PageProps) {
    const { bId } = await params;

    const data = await orderQueries.getOrdersByBrandId(bId);
    const parsedData = z.array(orderSchema).parse(data); // Parse to match orderSch
    return <OrdersTable initialData={parsedData} brandId={bId} />;
}
