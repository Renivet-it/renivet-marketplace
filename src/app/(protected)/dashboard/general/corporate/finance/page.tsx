import { AdminPageIntro } from "@/components/corporate-platform/admin-design";
import { AdminFinanceQueue } from "@/components/corporate-platform/admin-finance-queue";
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
                    eyebrow="Finance And Purchase Orders"
                    title="Finance & purchase order operations"
                    description="Review what needs a decision, release approved quotes, validate purchase orders, record collections, and issue invoices from one focused workspace."
                />
                <AdminFinanceQueue initialData={finance} />
            </div>
        </DashShell>
    );
}
