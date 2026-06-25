import { AdminPageIntro } from "@/components/corporate-platform/admin-design";
import { AdminReportCenter } from "@/components/corporate-platform/admin-report-center";
import { CorporateTabs } from "@/components/corporate-platform/corporate-tabs";
import { DashShell } from "@/components/globals/layouts/shells";
import { corporatePlatformService } from "@/lib/services/corporate-platform";

export default async function Page() {
    const finance = await corporatePlatformService.listAdminFinance();

    return (
        <DashShell>
            <div className="space-y-6">
                <CorporateTabs />
                <AdminPageIntro
                    eyebrow="Reporting Center"
                    title="Generate operational and leadership review outputs"
                    description="Keep recurring operational summaries, SLA reviews, and monthly leadership reporting in one reporting center with clear generation actions and readable job history."
                />
                <AdminReportCenter reports={finance.reports} />
            </div>
        </DashShell>
    );
}
