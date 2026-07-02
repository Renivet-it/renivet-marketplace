"use client";

import {
    AdminPanel,
    EmptyQueue,
    StatusBadge,
} from "@/components/corporate-platform/admin-design";
import { Button } from "@/components/ui/button-dash";
import { trpc } from "@/lib/trpc/client";
import { handleClientError } from "@/lib/utils";
import { toast } from "sonner";

export function AdminReportCenter({ reports }: { reports: any[] }) {
    const utils = trpc.useUtils();
    const generate = trpc.general.corporatePlatform.generateReport.useMutation({
        onSuccess: async () => {
            toast.success("Report job logged");
            await utils.general.corporatePlatform.listAdminFinance.invalidate();
        },
        onError: (error) => handleClientError(error),
    });

    return (
        <div className="space-y-6">
            <div className="grid gap-6 xl:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)]">
                <AdminPanel
                    title="Generate Reports"
                    description="Trigger recurring operational and leadership reports from a clearer reporting center instead of mixing actions into generic cards."
                >
                    <div className="grid gap-4 md:grid-cols-3">
                        <ReportAction
                            title="Daily Operations Summary"
                            description="Generate the current operations checkpoint across requests, orders, and pending queue actions."
                            action={
                                <Button
                                    className="w-full whitespace-normal h-auto py-2.5 min-h-[40px]"
                                    onClick={() =>
                                        generate.mutate({
                                            reportType: "daily_operations_summary",
                                        })
                                    }
                                >
                                    Generate Daily Report
                                </Button>
                            }
                        />
                        <ReportAction
                            title="Weekly SLA Review"
                            description="Create the weekly service-level agreement compliance review for management."
                            action={
                                <Button
                                    variant="outline"
                                    className="w-full whitespace-normal h-auto py-2.5 min-h-[40px]"
                                    onClick={() =>
                                        generate.mutate({
                                            reportType: "weekly_sla_compliance",
                                        })
                                    }
                                >
                                    Generate Weekly Review
                                </Button>
                            }
                        />
                        <ReportAction
                            title="Monthly Corporate Review"
                            description="Create the monthly leadership-facing output for corporate platform review."
                            action={
                                <Button
                                    variant="outline"
                                    className="w-full whitespace-normal h-auto py-2.5 min-h-[40px]"
                                    onClick={() =>
                                        generate.mutate({
                                            reportType: "monthly_corporate_review",
                                        })
                                    }
                                >
                                    Generate Monthly Review
                                </Button>
                            }
                        />
                    </div>
                </AdminPanel>
 
                <AdminPanel
                    title="Reporting Coverage"
                    description="Visible reporting lanes help the team understand what the platform is expected to surface over time."
                >
                    <div className="grid grid-cols-2 gap-3 text-sm text-slate-600">
                        <CoveragePill label="Demand Summary" />
                        <CoveragePill label="SLA Compliance" />
                        <CoveragePill label="Dispatch Readiness" />
                        <CoveragePill label="Collections Health" />
                        <CoveragePill label="Refund Pressure" />
                        <CoveragePill label="Settlement Oversight" />
                    </div>
                </AdminPanel>
            </div>
 
            <AdminPanel
                title="Report History"
                description="Separate report generation from report history so admins can quickly tell what has already been logged."
            >
                {reports.length ? (
                    <div className="overflow-x-auto">
                        <table className="w-full min-w-[860px] text-left text-sm">
                            <thead className="border-b border-slate-200 text-slate-500">
                                <tr>
                                    <th className="px-4 py-3 font-semibold">Report Type</th>
                                    <th className="px-4 py-3 font-semibold">Generated Date</th>
                                    <th className="px-4 py-3 font-semibold">File Output</th>
                                    <th className="px-4 py-3 font-semibold">Status</th>
                                </tr>
                            </thead>
                            <tbody>
                                {reports.map((report) => (
                                    <tr key={report.id} className="border-b border-slate-100">
                                        <td className="px-4 py-4 font-medium text-slate-900">
                                            {report.reportType}
                                        </td>
                                        <td className="px-4 py-4 text-slate-600">
                                            {report.generatedAt ?? "Pending"}
                                        </td>
                                        <td className="px-4 py-4 text-slate-600">
                                            {report.fileUrl || "Not attached"}
                                        </td>
                                        <td className="px-4 py-4">
                                            <StatusBadge tone={report.generatedAt ? "green" : "amber"}>
                                                {report.generatedAt ? "Logged" : "Pending"}
                                            </StatusBadge>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                ) : (
                    <EmptyQueue
                        title="No reports logged yet"
                        description="Generated report jobs and attached report outputs will appear here."
                    />
                )}
            </AdminPanel>
        </div>
    );
}
 
function ReportAction({
    title,
    description,
    action,
}: {
    title: string;
    description: string;
    action: React.ReactNode;
}) {
    return (
        <div className="flex flex-col h-full rounded-[24px] border border-slate-200 bg-slate-50 p-5">
            <div className="text-lg font-semibold text-slate-900">{title}</div>
            <div className="mt-2 text-sm leading-6 text-slate-600">{description}</div>
            <div className="mt-auto pt-4">{action}</div>
        </div>
    );
}

function CoveragePill({ label }: { label: string }) {
    return (
        <div className="rounded-full border border-slate-200 bg-slate-50 px-3 py-2 text-center font-medium text-slate-700">
            {label}
        </div>
    );
}
