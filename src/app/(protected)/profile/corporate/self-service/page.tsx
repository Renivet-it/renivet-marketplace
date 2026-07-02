import { CorporateOrdersPage } from "@/components/profile";
import { corporateOrderService } from "@/lib/services/corporate-order";
import { auth } from "@clerk/nextjs/server";
import { Metadata } from "next";
import { redirect } from "next/navigation";

export const metadata: Metadata = {
    title: "Corporate Self-Service Ordering",
    description: "Catalog-driven corporate ordering for self-service buyers.",
};

export default async function Page() {
    const { userId } = await auth();
    if (!userId) {
        redirect("/auth/signin?redirect_url=/profile/corporate/self-service");
    }

    const initialData = await corporateOrderService.listOrdersForUser(userId);

    return <CorporateOrdersPage initialData={initialData} />;
}
