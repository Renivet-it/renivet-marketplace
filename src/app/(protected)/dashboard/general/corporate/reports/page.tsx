import { AdminReportCenter } from "@/components/corporate-platform/admin-report-center";
import { DashShell } from "@/components/globals/layouts/shells";
import { corporatePlatformService } from "@/lib/services/corporate-platform";

export default async function Page() {
    const finance = await corporatePlatformService.listAdminFinance();

    return (
        <DashShell>
            <div className="space-y-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">Corporate Reports</h1>
                    <p className="text-sm text-slate-500">
                        Report generation center for operations and leadership reviews.
                    </p>
                </div>
                <AdminReportCenter reports={finance.reports} />
            </div>
        </DashShell>
    );
}
