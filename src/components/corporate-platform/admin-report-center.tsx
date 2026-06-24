"use client";

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
            <div className="flex flex-wrap gap-3">
                <Button
                    onClick={() =>
                        generate.mutate({ reportType: "daily_operations_summary" })
                    }
                >
                    Generate Daily Ops
                </Button>
                <Button
                    variant="outline"
                    onClick={() =>
                        generate.mutate({ reportType: "weekly_sla_compliance" })
                    }
                >
                    Generate Weekly SLA
                </Button>
                <Button
                    variant="outline"
                    onClick={() =>
                        generate.mutate({ reportType: "monthly_corporate_review" })
                    }
                >
                    Generate Monthly Review
                </Button>
            </div>

            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                {reports.map((report) => (
                    <div key={report.id} className="rounded-2xl border bg-white p-5 shadow-sm">
                        <div className="font-semibold text-slate-900">{report.reportType}</div>
                        <div className="mt-1 text-sm text-slate-500">
                            Generated {report.generatedAt ?? "pending"}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}

