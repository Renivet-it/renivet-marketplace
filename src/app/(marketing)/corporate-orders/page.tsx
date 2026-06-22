import { CorporateOrderPage } from "@/components/corporate-orders/corporate-order-page";
import { GeneralShell } from "@/components/globals/layouts/shells";
import { auth } from "@clerk/nextjs/server";
import { Metadata } from "next";
import { redirect } from "next/navigation";
import Script from "next/script";

export const metadata: Metadata = {
    title: "Corporate Orders",
    description: "Place bulk corporate apparel orders on Renivet",
};

export default async function Page() {
    const { userId } = await auth();
    if (!userId) {
        redirect("/auth/signin?redirect_url=/corporate-orders");
    }

    return (
        <GeneralShell>
            <Script src="https://checkout.razorpay.com/v1/checkout.js" />
            <CorporateOrderPage />
        </GeneralShell>
    );
}
