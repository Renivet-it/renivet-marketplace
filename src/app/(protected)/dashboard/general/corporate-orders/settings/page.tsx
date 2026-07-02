import { CorporateOrderSettings } from "@/components/dashboard/general/corporate-orders/corporate-order-settings";
import { CorporateOrderTabs } from "@/components/dashboard/general/corporate-orders/corporate-order-tabs";
import { DashShell } from "@/components/globals/layouts/shells";
import { corporateOrderService } from "@/lib/services/corporate-order";
import { Metadata } from "next";

export const metadata: Metadata = {
    title: "Corporate Order Settings",
    description: "Manage corporate apparel pricing and configuration",
};

export default async function Page() {
    const initialData = await corporateOrderService.listConfig();

    return (
        <DashShell>
            <div className="space-y-6">
                <CorporateOrderTabs />
                <CorporateOrderSettings initialData={initialData} />
            </div>
        </DashShell>
    );
}
