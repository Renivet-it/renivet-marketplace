import { AnalyticsReportDetailPage } from "@/components/dashboard/general/analytics/analytics-report-detail-page";
import { DashShell } from "@/components/globals/layouts";
import { Metadata } from "next";

export const metadata: Metadata = {
    title: "Analytics Report",
    description: "Detailed analytics report page",
};

export default async function Page({
    params,
}: {
    params: Promise<{ reportId: string }>;
}) {
    const { reportId } = await params;

    return (
        <DashShell className="max-w-none">
            <AnalyticsReportDetailPage reportId={reportId} />
        </DashShell>
    );
}
