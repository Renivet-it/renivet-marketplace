import { BrandCorporateWorkspace } from "@/components/corporate-platform/brand-corporate-workspace";
import { DashShell } from "@/components/globals/layouts/shells";
import { corporatePlatformService } from "@/lib/services/corporate-platform";
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";

export default async function Page({
    params,
}: {
    params: Promise<{ bId: string }>;
}) {
    const { userId } = await auth();
    if (!userId) {
        redirect("/auth/signin");
    }

    const { bId } = await params;
    const data = await corporatePlatformService.listBrandAssignedOrders(
        userId,
        bId
    );

    return (
        <DashShell>
            <div className="space-y-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">
                        Corporate Orders
                    </h1>
                    <p className="text-sm text-slate-500">
                        Assigned quote-backed orders for this brand, with customer details protected.
                    </p>
                </div>
                <BrandCorporateWorkspace brandId={bId} initialData={data} />
            </div>
        </DashShell>
    );
}
