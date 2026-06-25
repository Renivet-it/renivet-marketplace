import { AdminPageIntro } from "@/components/corporate-platform/admin-design";
import { AdminFinanceQueue } from "@/components/corporate-platform/admin-finance-queue";
import { DashShell } from "@/components/globals/layouts/shells";
import { corporatePlatformService } from "@/lib/services/corporate-platform";

export default async function Page() {
    const finance = await corporatePlatformService.listAdminFinance();

    return (
        <DashShell>
            <div className="space-y-6">
                <AdminPageIntro
                    eyebrow="Finance And Purchase Orders"
                    title="Release approved quotes, validate purchase orders, and run finance operations"
                    description="This workspace now covers both paths after customer approval: direct corporate order release for approved quotes without purchase orders, and enterprise purchase order validation when a buyer uploads official procurement paperwork."
                />
                <AdminFinanceQueue initialData={finance} />
            </div>
        </DashShell>
    );
}

