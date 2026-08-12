import { AdminReportCenter } from "@/components/corporate-platform/admin-report-center";
import { CorporateTabs } from "@/components/corporate-platform/corporate-tabs";
import { DashShell } from "@/components/globals/layouts/shells";
import { corporatePlatformService } from "@/lib/services/corporate-platform";

export default async function Page() {
    const finance = await corporatePlatformService.listAdminFinance();

    return (
        <DashShell>
            <div className="space-y-4">
                <CorporateTabs />
                <header className="rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
                    <h1 className="text-lg font-semibold text-slate-950">
                        Reports
                    </h1>
                    <p className="mt-0.5 text-xs text-slate-500">
                        Generate and review corporate reports
                    </p>
                </header>
                <AdminReportCenter reports={finance.reports} />
            </div>
        </DashShell>
    );
}
