import { CorporateOrdersTable } from "@/components/dashboard/general/corporate-orders/corporate-orders-table";
import { DashShell } from "@/components/globals/layouts/shells";
import { corporateOrderService } from "@/lib/services/corporate-order";
import { Metadata } from "next";

export const metadata: Metadata = {
    title: "Corporate Orders",
    description: "View and manage Renivet corporate apparel orders",
};

export default async function Page() {
    const initialData = await corporateOrderService.listOrders({
        page: 1,
        limit: 50,
    });

    return (
        <DashShell>
            <div className="space-y-4">
                <div>
                    <h1 className="text-2xl font-bold">Corporate Orders</h1>
                    <p className="text-sm text-muted-foreground">
                        Review bulk apparel orders, payments, files, and order
                        progress.
                    </p>
                </div>
                <CorporateOrdersTable initialData={initialData} />
            </div>
        </DashShell>
    );
}
