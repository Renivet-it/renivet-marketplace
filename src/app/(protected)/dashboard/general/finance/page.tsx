import { assertFinanceDashboardAccess } from "@/lib/finance/page-access";
import Link from "next/link";

const sections = [
    {
        title: "Refunds",
        href: "/dashboard/general/finance/refunds",
        description: "Approval queue, reverse pickup flags, failure retries, and audit trail.",
    },
    {
        title: "COD Reconciliation",
        href: "/dashboard/general/finance/cod-reconciliation",
        description: "Daily remittance checks, discrepancy review, and sync run history.",
    },
    {
        title: "Payouts",
        href: "/dashboard/general/finance/payouts",
        description: "Cycle calculation, brand review cards, overrides, and execution tracking.",
    },
    {
        title: "HSN Master",
        href: "/dashboard/general/finance/hsn-master",
        description: "Dedicated HSN master maintenance for GST rates, coverage checks, and bulk imports.",
    },
    {
        title: "GST Report",
        href: "/dashboard/general/finance/gst-report",
        description: "HSN master, GST/TCS preview, run history, and export readiness.",
    },
    {
        title: "Monthly P&L",
        href: "/dashboard/general/finance/monthly-pl",
        description: "Manual entries, month summaries, and finance close visibility.",
    },
    {
        title: "Data Deletion",
        href: "/dashboard/general/finance/data-deletion",
        description: "DPDP request lifecycle, execution evidence, and failure monitoring.",
    },
    {
        title: "Legal & Compliance",
        href: "/dashboard/general/finance/legal-compliance",
        description: "GRO contact history, consumer-protection publishing, and public legal surfaces.",
    },
    {
        title: "Module Access",
        href: "/dashboard/general/settings/module-access",
        description: "Finance-specific access grants layered on top of existing role permissions.",
    },
    {
        title: "Audit Log",
        href: "/dashboard/general/finance/audit-log",
        description: "Structured finance audit evidence with typed actors, JSON diffs, proof links, and CSV export.",
    },
];

export default async function FinanceDashboardPage() {
    await assertFinanceDashboardAccess();

    return (
        <main className="min-h-screen bg-slate-50/80 p-4 sm:p-6">
            <div className="mx-auto max-w-6xl space-y-4">
                <header className="rounded-md border bg-white p-5 shadow-sm">
                    <p className="text-xs font-semibold uppercase tracking-[0.16em] text-emerald-700">
                        Renivet Finance & Compliance
                    </p>
                    <h1 className="mt-2 text-2xl font-semibold text-slate-950">
                        Finance Control Center
                    </h1>
                    <p className="mt-2 max-w-3xl text-sm text-slate-600">
                        Shared operating surface for refunds, COD reconciliation, payouts,
                        GST, TDS, DPDP requests, and finance access controls introduced in the
                        implementation spec.
                    </p>
                </header>

                <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                    {sections.map((section) => (
                        <Link
                            key={section.href}
                            href={section.href}
                            className="rounded-md border bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-emerald-300 hover:shadow"
                        >
                            <h2 className="text-lg font-semibold text-slate-900">
                                {section.title}
                            </h2>
                            <p className="mt-2 text-sm text-slate-600">
                                {section.description}
                            </p>
                            <span className="mt-4 inline-flex text-sm font-medium text-emerald-700">
                                Open module
                            </span>
                        </Link>
                    ))}
                </section>
            </div>
        </main>
    );
}
