import { OrderPage } from "@/components/dashboard/brands/orders";
import { DashShell } from "@/components/globals/layouts";
import { orderQueries } from "@/lib/db/queries";
import { notFound } from "next/navigation";
import { Suspense } from "react";

interface PageProps {
    params: Promise<{
        bId: string;
        oId: string;
    }>;
}

export default function Page(props: PageProps) {
    return (
        <DashShell>
            <div className="space-y-1 text-center md:text-start">
                <h1 className="text-2xl font-bold">Order Details</h1>
                <p className="text-balance text-sm text-muted-foreground">
                    View details of the order placed by the customer
                </p>
            </div>

            <Suspense>
                <OrderFetch {...props} />
            </Suspense>
        </DashShell>
    );
}

async function OrderFetch({ params }: PageProps) {
    const { bId, oId } = await params;

    const data = await orderQueries.getOrderById(oId);
    if (!data) notFound();

    const brandIdsInOrder = data.items.map((item) => item.product.brandId);
    if (!brandIdsInOrder.includes(bId)) notFound();

    return <OrderPage order={data} />;
}
