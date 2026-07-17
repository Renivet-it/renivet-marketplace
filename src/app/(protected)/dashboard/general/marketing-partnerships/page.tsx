import { PartnershipsManager } from "@/components/dashboard/general/marketing";
import { DashShell } from "@/components/globals/layouts";
import { Metadata } from "next";

export const metadata: Metadata = {
    title: "Marketing Partnerships",
    description: "Manage partnership and collab tracking records",
};

export default function MarketingPartnershipsPage() {
    return (
        <DashShell className="max-w-[100rem]">
            <div className="space-y-6">
                <div className="space-y-1">
                    <h1 className="text-2xl font-bold">Marketing Partnerships</h1>
                    <p className="text-sm text-muted-foreground">
                        Track partner campaigns, coupons, URLs, and status in one
                        admin surface.
                    </p>
                </div>
                <PartnershipsManager />
            </div>
        </DashShell>
    );
}
