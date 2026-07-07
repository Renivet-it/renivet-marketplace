import { ConsumerProtectionNotice } from "@/components/legal/consumer-protection-notice";
import { GeneralShell } from "@/components/globals/layouts";
import { RichTextViewer } from "@/components/ui/rich-text-viewer";
import { financeComplianceQueries } from "@/lib/db/queries/finance-compliance";
import { legalCache } from "@/lib/redis/methods";
import { Metadata } from "next";
import { Suspense } from "react";

export const metadata: Metadata = {
    title: "Terms of Services",
    description: "Terms of Services for the website",
};

export default function Page() {
    return (
        <GeneralShell>
            <h1 className="text-3xl font-bold">Terms of Services</h1>

            <Suspense fallback={<div className="h-96" />}>
                <TermsFetch />
            </Suspense>
        </GeneralShell>
    );
}

async function TermsFetch() {
    const [data, gro] = await Promise.all([
        legalCache.get(),
        financeComplianceQueries.getActiveLegalContactByRole("gro"),
    ]);

    return (
        <>
            <RichTextViewer
                content={data?.termsOfService || "<p>No content yet</p>"}
            />
            <section className="mt-8 rounded-xl border border-amber-200 bg-amber-50 p-5 text-sm text-slate-700">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-amber-700">
                    Dispute Resolution & Grievance Redressal
                </p>
                <p className="mt-3">
                    Renivet acknowledges customer complaints within 48 hours and aims to resolve
                    all complaints within 30 days. For unresolved disputes, contact our
                    Grievance Redressal Officer (details on our Contact Us page). If a complaint
                    remains unresolved after 30 days, customers may approach the National Consumer
                    Disputes Redressal Commission (NCDRC) or the relevant State Commission.
                </p>
                {gro ? (
                    <p className="mt-3 text-slate-600">
                        Current GRO: {gro.name} · {gro.email}
                    </p>
                ) : null}
            </section>
            <ConsumerProtectionNotice
                supportEmail={data?.supportEmail}
                supportPhone={data?.supportPhone}
                grievanceOfficerName={gro?.name ?? data?.grievanceOfficerName}
                grievanceOfficerEmail={gro?.email ?? data?.grievanceOfficerEmail}
                grievanceOfficerPhone={gro?.phone ?? data?.grievanceOfficerPhone}
                grievanceOfficerAddress={gro?.address ?? data?.grievanceOfficerAddress}
            />
        </>
    );
}
