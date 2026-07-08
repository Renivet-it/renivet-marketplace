import { LegalComplianceWorkspace } from "@/components/dashboard/general/finance/legal-compliance-workspace";
import { assertFinanceModulePageAccess } from "@/lib/finance/page-access";

export default async function LegalCompliancePage() {
    await assertFinanceModulePageAccess("compliance_admin");

    return (
        <main className="min-h-screen bg-slate-50/80 p-4 sm:p-6">
            <div className="mx-auto max-w-6xl space-y-4">
                <header className="rounded-md border bg-white p-5 shadow-sm">
                    <p className="text-xs font-semibold uppercase tracking-[0.16em] text-emerald-700">
                        Consumer Protection
                    </p>
                    <h1 className="mt-2 text-2xl font-semibold text-slate-950">
                        Legal & Compliance Contacts
                    </h1>
                    <p className="mt-2 text-sm text-slate-600">
                        Maintain Grievance Redressal Officer details, preserve succession history,
                        and keep public legal-contact surfaces current without a deploy.
                    </p>
                </header>

                <LegalComplianceWorkspace />
            </div>
        </main>
    );
}
