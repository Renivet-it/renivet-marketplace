import { CorporateOrderDetail } from "@/components/dashboard/general/corporate-orders/corporate-order-detail";
import { DashShell } from "@/components/globals/layouts/shells";
import { corporateOrderService } from "@/lib/services/corporate-order";
import { Metadata } from "next";

export const metadata: Metadata = {
    title: "Corporate Order Detail",
    description: "Inspect and manage a corporate apparel order",
};

export default async function Page({
    params,
}: {
    params: Promise<{ id: string }>;
}) {
    const { id } = await params;
    const data = await corporateOrderService.getOrderById(id);

    return (
        <DashShell>
            <CorporateOrderDetail initialData={data} />
        </DashShell>
    );
}
