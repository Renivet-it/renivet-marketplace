import { CorporateOrderConfirmation } from "@/components/corporate-orders/corporate-order-confirmation";
import { GeneralShell } from "@/components/globals/layouts/shells";
import { corporateOrderService } from "@/lib/services/corporate-order";
import { auth } from "@clerk/nextjs/server";
import { Metadata } from "next";
import { redirect } from "next/navigation";

export const metadata: Metadata = {
    title: "Corporate Order Confirmation",
    description: "Review your corporate order confirmation",
};

export default async function Page({
    params,
}: {
    params: Promise<{ orderId: string }>;
}) {
    const { userId } = await auth();
    if (!userId) {
        redirect("/auth/signin?redirect_url=/corporate-orders");
    }

    const { orderId } = await params;
    const data = await corporateOrderService.getOrderConfirmation(userId, orderId);

    return (
        <GeneralShell>
            <CorporateOrderConfirmation data={data} />
        </GeneralShell>
    );
}
