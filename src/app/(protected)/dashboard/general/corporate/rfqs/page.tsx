import { AdminRfqQueue } from "@/components/corporate-platform/admin-rfq-queue";
import { DashShell } from "@/components/globals/layouts/shells";
import { corporatePlatformService } from "@/lib/services/corporate-platform";

export default async function Page() {
    const [rfqs, quotes] = await Promise.all([
        corporatePlatformService.listAdminRfqs(),
        corporatePlatformService.listAdminQuotes(),
    ]);

    return (
        <DashShell>
            <div className="space-y-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">Corporate RFQs</h1>
                    <p className="text-sm text-slate-500">
                        Queue for review, assignment, and conversion into quotes.
                    </p>
                </div>
                <AdminRfqQueue initialRfqs={rfqs} initialQuotes={quotes} />
            </div>
        </DashShell>
    );
}

