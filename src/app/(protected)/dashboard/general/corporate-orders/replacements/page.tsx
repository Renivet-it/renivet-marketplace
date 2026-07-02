import { CorporateReplacementRequestsPage } from "@/components/dashboard/general/corporate-orders/corporate-replacement-requests-page";
import { CorporateOrderTabs } from "@/components/dashboard/general/corporate-orders/corporate-order-tabs";
import { DashShell } from "@/components/globals/layouts/shells";
import { corporatePlatformService } from "@/lib/services/corporate-platform";
import { Metadata } from "next";

export const metadata: Metadata = {
    title: "Corporate Replacement Requests",
    description: "Review and manage corporate replacement requests",
};

export default async function Page() {
    const initialRequests =
        await corporatePlatformService.listAdminReplacementRequests();

    return (
        <DashShell>
            <div className="space-y-6">
                <CorporateOrderTabs />
                <CorporateReplacementRequestsPage
                    initialRequests={initialRequests}
                />
            </div>
        </DashShell>
    );
}
