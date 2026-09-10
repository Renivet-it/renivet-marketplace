import { CustomerCorporateDashboard } from "@/components/corporate-platform/customer-corporate-dashboard";
import { corporateOrderService } from "@/lib/services/corporate-order";
import { corporatePlatformService } from "@/lib/services/corporate-platform";
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";

export default async function Page({
    searchParams,
}: {
    searchParams: Promise<{ quoteId?: string }>;
}) {
    const { userId } = await auth();
    if (!userId) {
        redirect("/auth/signin?redirect_url=/profile/corporate");
    }

    const [{ quoteId }, profile, rfqs, quotes, purchaseOrders, orders, taxInvoices] = await Promise.all([
        searchParams,
        corporatePlatformService.getMyProfile(userId),
        corporatePlatformService.listMyRfqs(userId),
        corporatePlatformService.listMyQuotes(userId),
        corporatePlatformService.listMyPurchaseOrders(userId),
        corporateOrderService.listOrdersForUser(userId),
        corporatePlatformService.listMyIssuedTaxInvoices(userId),
    ]);

    const requestedQuotes = quoteId
        ? quotes.filter((quote) => quote.id === quoteId)
        : quotes;

    return (
        <CustomerCorporateDashboard
            initialProfile={profile}
            initialRfqs={rfqs}
            initialQuotes={requestedQuotes}
            initialQuoteId={quoteId}
            initialPurchaseOrders={purchaseOrders}
            initialOrders={orders}
            initialTaxInvoices={taxInvoices}
        />
    );
}
