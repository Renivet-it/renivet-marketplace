import { AdminAnalyticsDashboard } from "@/components/dashboard/general/analytics/admin-analytics-dashboard";
import { DashShell } from "@/components/globals/layouts";
import { Metadata } from "next";

export const metadata: Metadata = {
    title: "Analytics Dashboard",
    description: "Admin analytics, KPI cards, and freeform reports",
};

export default function Page() {
    return (
        <DashShell className="max-w-none">
            <AdminAnalyticsDashboard />
        </DashShell>
    );
}
