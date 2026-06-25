import { CustomerCorporateDashboard } from "@/components/corporate-platform/customer-corporate-dashboard";
import { corporateOrderService } from "@/lib/services/corporate-order";
import { corporatePlatformService } from "@/lib/services/corporate-platform";
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";

export default async function Page() {
    const { userId } = await auth();
    if (!userId) {
        redirect("/auth/signin?redirect_url=/profile/corporate");
    }

    const [profile, rfqs, quotes, orders] = await Promise.all([
        corporatePlatformService.getMyProfile(userId),
        corporatePlatformService.listMyRfqs(userId),
        corporatePlatformService.listMyQuotes(userId),
        corporateOrderService.listOrdersForUser(userId),
    ]);

    return (
        <CustomerCorporateDashboard
            initialProfile={profile}
            initialRfqs={rfqs}
            initialQuotes={quotes}
            initialOrders={orders}
        />
    );
}
