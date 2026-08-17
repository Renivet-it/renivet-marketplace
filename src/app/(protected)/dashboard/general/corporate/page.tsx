import { CorporateTabs } from "@/components/corporate-platform/corporate-tabs";
import { SeedCatalogButton } from "@/components/corporate-platform/seed-catalog-button";
import { DashShell } from "@/components/globals/layouts/shells";
import { corporatePlatformService } from "@/lib/services/corporate-platform";
import { formatINR } from "@/lib/utils";
import { ArrowUpRight, Eye } from "lucide-react";
import Link from "next/link";

export default async function Page() {
    const summary = await corporatePlatformService.getAdminDashboardSummary();

    const metrics = [
        {
            label: "RFQs to review",
            value: String(summary.rfqsPending),
            tone: "blue" as const,
        },
        {
            label: "Quotes pending",
            value: String(summary.quotesPending),
            tone: "blue" as const,
        },
        { label: "Active orders", value: String(summary.activeOrders) },
        {
            label: "QC pending",
            value: String(summary.qcPending),
            tone: "amber" as const,
        },
        {
            label: "Dispatch pending",
            value: String(summary.dispatchPending),
            tone: "amber" as const,
        },
        {
            label: "Payments pending",
            value: String(summary.paymentsPending),
            tone: "amber" as const,
        },
        { label: "Refund requests", value: String(summary.refundRequests) },
        { label: "Escalations", value: String(summary.slaBreaches) },
        {
            label: "Outstanding",
            value: formatINR(summary.outstandingBalancePaise),
        },
    ];

    return (
        <DashShell>
            <div className="space-y-4">
                <CorporateTabs />

                <header className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-sm sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <h1 className="text-lg font-semibold text-slate-950">
                            Corporate Hub
                        </h1>
                        <p className="mt-0.5 text-xs text-slate-500">
                            Orders, quotations, finance and fulfillment
                        </p>
                    </div>
                    <SeedCatalogButton />
                </header>

                <section aria-labelledby="corporate-status-heading">
                    <h2
                        id="corporate-status-heading"
                        className="mb-2 text-sm font-semibold text-slate-800"
                    >
                        Current status
                    </h2>
                    <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 xl:grid-cols-5">
                        {metrics.map((metric) => (
                            <div
                                key={metric.label}
                                className={`rounded-xl border p-3 shadow-sm ${
                                    metric.tone === "blue"
                                        ? "border-blue-100 bg-blue-50/50"
                                        : metric.tone === "amber"
                                          ? "border-amber-100 bg-amber-50/50"
                                          : "border-slate-200 bg-white"
                                }`}
                            >
                                <p className="text-[11px] font-medium text-slate-500">
                                    {metric.label}
                                </p>
                                <p className="mt-1 text-xl font-semibold leading-none text-slate-950">
                                    {metric.value}
                                </p>
                            </div>
                        ))}
                    </div>
                </section>

                <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                    <h2 className="text-sm font-semibold text-slate-900">
                        Workspaces
                    </h2>
                    <div className="mt-3 grid gap-2 md:grid-cols-2">
                        <WorkspaceCard
                            title="Requests for Quotation"
                            href="/dashboard/general/corporate/rfqs"
                            description="Review requirements, assign ownership and prepare quotations."
                        />
                        <WorkspaceCard
                            title="Finance & Purchase Orders"
                            href="/dashboard/general/corporate/finance"
                            description="Validate purchase orders, issue invoices and record collections."
                        />
                        <WorkspaceCard
                            title="Task Control"
                            href="/dashboard/general/corporate/tasks"
                            description="Track quality control, dispatch tasks and escalations."
                        />
                        <WorkspaceCard
                            title="Reports & Executive View"
                            href="/dashboard/general/corporate/reports"
                            description="Review corporate reports and operational performance."
                        />
                    </div>
                </section>
            </div>
        </DashShell>
    );
}

function WorkspaceCard({
    title,
    description,
    href,
}: {
    title: string;
    description: string;
    href: string;
}) {
    return (
        <article className="rounded-xl border border-slate-200 bg-slate-50/60 p-3">
            <div className="flex items-center justify-between gap-3">
                <h3 className="text-sm font-semibold text-slate-900">
                    {title}
                </h3>
                <Link
                    href={href}
                    className="inline-flex shrink-0 items-center gap-1 rounded-lg bg-slate-900 px-2.5 py-1.5 text-xs font-medium text-white hover:bg-slate-700"
                >
                    Open
                    <ArrowUpRight className="size-3" />
                </Link>
            </div>
            <details className="group mt-2">
                <summary className="inline-flex cursor-pointer list-none items-center gap-1.5 text-xs font-medium text-slate-500 hover:text-slate-900 [&::-webkit-details-marker]:hidden">
                    <Eye className="size-3.5" />
                    Details
                </summary>
                <p className="mt-2 border-t border-slate-200 pt-2 text-xs leading-5 text-slate-600">
                    {description}
                </p>
            </details>
        </article>
    );
}
