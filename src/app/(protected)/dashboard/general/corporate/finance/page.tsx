import { AdminFinanceQueue } from "@/components/corporate-platform/admin-finance-queue";
import { DashShell } from "@/components/globals/layouts/shells";
import { corporatePlatformService } from "@/lib/services/corporate-platform";

export default async function Page() {
    const finance = await corporatePlatformService.listAdminFinance();

    return (
        <DashShell>
            <div className="space-y-6">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">Corporate Finance Queue</h1>
                    <p className="text-sm text-slate-500">
                        Review payments, refunds, purchase orders, and report outputs.
                    </p>
                </div>
                <AdminFinanceQueue initialData={finance} />
            </div>
        </DashShell>
    );
}

