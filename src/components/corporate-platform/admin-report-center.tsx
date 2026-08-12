"use client";

import {
    AdminPanel,
    EmptyQueue,
    StatusBadge,
} from "@/components/corporate-platform/admin-design";
import { Button } from "@/components/ui/button-dash";
import { trpc } from "@/lib/trpc/client";
import { handleClientError } from "@/lib/utils";
import { Eye } from "lucide-react";
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
        <div className="space-y-4">
            <div>
                <AdminPanel
                    title="Generate Reports"
                    className="!rounded-2xl !p-4 [&>div+div]:!mt-3 [&_h2]:!text-sm"
                >
                    <div className="grid gap-3 md:grid-cols-3">
                        <ReportAction
                            title="Daily Operations Summary"
                            description="Generate the current operations checkpoint across requests, orders, and pending queue actions."
                            action={
                                <Button
                                    className="h-auto min-h-[40px] w-full whitespace-normal py-2.5"
                                    onClick={() =>
                                        generate.mutate({
                                            reportType:
                                                "daily_operations_summary",
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
                                    className="h-auto min-h-[40px] w-full whitespace-normal py-2.5"
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
                                    className="h-auto min-h-[40px] w-full whitespace-normal py-2.5"
                                    onClick={() =>
                                        generate.mutate({
                                            reportType:
                                                "monthly_corporate_review",
                                        })
                                    }
                                >
                                    Generate Monthly Review
                                </Button>
                            }
                        />
                    </div>
                </AdminPanel>
            </div>

            <AdminPanel
                title="Report History"
                className="!rounded-2xl !p-4 [&>div+div]:!mt-3 [&_h2]:!text-sm"
            >
                {reports.length ? (
                    <div className="overflow-x-auto">
                        <table className="w-full min-w-[860px] text-left text-sm">
                            <thead className="border-b border-slate-200 text-slate-500">
                                <tr>
                                    <th className="px-4 py-3 font-semibold">
                                        Report Type
                                    </th>
                                    <th className="px-4 py-3 font-semibold">
                                        Generated Date
                                    </th>
                                    <th className="px-4 py-3 font-semibold">
                                        File Output
                                    </th>
                                    <th className="px-4 py-3 font-semibold">
                                        Status
                                    </th>
                                </tr>
                            </thead>
                            <tbody>
                                {reports.map((report) => (
                                    <tr
                                        key={report.id}
                                        className="border-b border-slate-100"
                                    >
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
                                            <StatusBadge
                                                tone={
                                                    report.generatedAt
                                                        ? "green"
                                                        : "amber"
                                                }
                                            >
                                                {report.generatedAt
                                                    ? "Logged"
                                                    : "Pending"}
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
        <div className="flex h-full flex-col rounded-xl border border-slate-200 bg-slate-50 p-3">
            <div className="text-sm font-semibold text-slate-900">{title}</div>
            <details className="mt-2">
                <summary className="inline-flex cursor-pointer list-none items-center gap-1.5 text-xs font-medium text-slate-500 hover:text-slate-900 [&::-webkit-details-marker]:hidden">
                    <Eye className="size-3.5" />
                    Details
                </summary>
                <p className="mt-2 border-t border-slate-200 pt-2 text-xs leading-5 text-slate-600">
                    {description}
                </p>
            </details>
            <div className="mt-auto pt-3">{action}</div>
        </div>
    );
}
