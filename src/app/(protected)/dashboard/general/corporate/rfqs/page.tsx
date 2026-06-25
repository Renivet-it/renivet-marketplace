import { AdminPageIntro } from "@/components/corporate-platform/admin-design";
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
            <div className="space-y-6">
                <AdminPageIntro
                    eyebrow="Requests For Quotation Workspace"
                    title="Review requirements, prepare quotes, and manage revisions"
                    description="Use this workspace to process inbound requests for quotation, distinguish unreviewed work from already-quoted requests, and create structured quote actions without relying on cramped inline tables."
                />
                <AdminRfqQueue initialRfqs={rfqs} initialQuotes={quotes} />
            </div>
        </DashShell>
    );
}

