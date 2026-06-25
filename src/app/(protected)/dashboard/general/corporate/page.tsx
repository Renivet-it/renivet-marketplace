import {
    AdminMetricGrid,
    AdminPageIntro,
    AdminPanel,
    StatusBadge,
} from "@/components/corporate-platform/admin-design";
import { DashShell } from "@/components/globals/layouts/shells";
import { SeedCatalogButton } from "@/components/corporate-platform/seed-catalog-button";
import { corporatePlatformService } from "@/lib/services/corporate-platform";
import { formatINR } from "@/lib/utils";

export default async function Page() {
    const summary = await corporatePlatformService.getAdminDashboardSummary();

    const cards = [
        { label: "Requests Awaiting Review", value: String(summary.rfqsPending), tone: "blue" as const },
        { label: "Quotes Awaiting Decision", value: String(summary.quotesPending), tone: "blue" as const },
        { label: "Active Orders", value: String(summary.activeOrders) },
        { label: "Quality Control Pending", value: String(summary.qcPending), tone: "gold" as const },
        { label: "Dispatch Pending", value: String(summary.dispatchPending), tone: "gold" as const },
        { label: "Payments Pending", value: String(summary.paymentsPending), tone: "gold" as const },
        { label: "Refund Requests", value: String(summary.refundRequests), tone: "slate" as const },
        { label: "Open Escalations", value: String(summary.slaBreaches), tone: "slate" as const },
        {
            label: "Outstanding Balance",
            value: formatINR(summary.outstandingBalancePaise),
            tone: "slate" as const,
        },
    ];

    return (
        <DashShell>
            <div className="space-y-6">
                <AdminPageIntro
                    eyebrow="Corporate Command Center"
                    title="Operations, finance, and fulfillment in one admin suite"
                    description="Use this command center to manage managed quotations, self-service corporate orders, enterprise purchase orders, invoices, dispatch readiness, and SLA risk without jumping between mismatched workspaces."
                    actions={
                        <div className="space-y-3 rounded-[24px] border border-white/80 bg-white/80 p-4 shadow-sm">
                            <div className="flex flex-wrap gap-2">
                                <StatusBadge tone="blue">Managed Quotations</StatusBadge>
                                <StatusBadge tone="amber">Enterprise Purchase Orders</StatusBadge>
                                <StatusBadge tone="green">Self-Service Orders</StatusBadge>
                            </div>
                            <SeedCatalogButton />
                        </div>
                    }
                />

                <AdminMetricGrid items={cards} />

                <div className="grid gap-6 xl:grid-cols-[minmax(0,2fr)_minmax(320px,0.8fr)]">
                    <AdminPanel
                        title="Needs Attention Now"
                        description="Priority workflow areas that typically block conversion, production, dispatch, or collections."
                    >
                        <div className="grid gap-4 md:grid-cols-2">
                            <ActionBand
                                title="Requests for Quotation Queue"
                                description="Review inbound requirements, assign ownership, and move requests into quote preparation."
                                href="/dashboard/general/corporate/rfqs"
                            />
                            <ActionBand
                                title="Finance and Purchase Order Review"
                                description="Validate purchase orders, issue invoices, and record collections without losing workflow context."
                                href="/dashboard/general/corporate/finance"
                            />
                            <ActionBand
                                title="Operational Task Control"
                                description="Track handoffs for quotation review, quality control, dispatch readiness, and escalations."
                                href="/dashboard/general/corporate/tasks"
                            />
                            <ActionBand
                                title="Leadership and Reporting"
                                description="Open executive snapshots and report history for weekly and monthly corporate review."
                                href="/dashboard/general/corporate/executive"
                            />
                        </div>
                    </AdminPanel>

                    <div className="space-y-6">
                        <AdminPanel
                            title="Workflow Visibility"
                            description="Document-aligned operational areas surfaced for corporate fulfillment."
                        >
                            <div className="grid grid-cols-2 gap-3 text-sm text-slate-600">
                                <WorkflowTag label="Brand Matching" />
                                <WorkflowTag label="Quote Preparation" />
                                <WorkflowTag label="Purchase Order Validation" />
                                <WorkflowTag label="Quality Control Review" />
                                <WorkflowTag label="Dispatch Readiness" />
                                <WorkflowTag label="Settlement Oversight" />
                            </div>
                        </AdminPanel>

                        <AdminPanel
                            title="Navigation"
                            description="Open the dedicated operational workspace based on the team’s responsibility."
                        >
                            <div className="space-y-3 text-sm">
                                <NavLink href="/dashboard/general/corporate/rfqs" label="Requests for Quotation Workspace" />
                                <NavLink href="/dashboard/general/corporate/finance" label="Finance and Purchase Orders Workspace" />
                                <NavLink href="/dashboard/general/corporate/tasks" label="Task and Escalation Workspace" />
                                <NavLink href="/dashboard/general/corporate/reports" label="Reports Workspace" />
                                <NavLink href="/dashboard/general/corporate/executive" label="Executive View" />
                            </div>
                        </AdminPanel>
                    </div>
                </div>
            </div>
        </DashShell>
    );
}

function ActionBand({
    title,
    description,
    href,
}: {
    title: string;
    description: string;
    href: string;
}) {
    return (
        <a
            href={href}
            className="rounded-[24px] border border-slate-200 bg-slate-50 p-5 transition-colors hover:bg-white"
        >
            <div className="text-lg font-semibold text-slate-900">{title}</div>
            <div className="mt-2 text-sm leading-6 text-slate-600">{description}</div>
            <div className="mt-4 text-sm font-semibold text-[#5B9BD5]">Open workspace</div>
        </a>
    );
}

function WorkflowTag({ label }: { label: string }) {
    return (
        <div className="rounded-full border border-slate-200 bg-slate-50 px-3 py-2 text-center font-medium text-slate-700">
            {label}
        </div>
    );
}

function NavLink({ href, label }: { href: string; label: string }) {
    return (
        <a
            href={href}
            className="flex items-center justify-between rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 font-medium text-slate-700 transition-colors hover:bg-white"
        >
            <span>{label}</span>
            <span className="text-[#5B9BD5]">Open</span>
        </a>
    );
}
