import { CorporateOrdersPage } from "@/components/profile";
import { corporateOrderService } from "@/lib/services/corporate-order";
import { auth } from "@clerk/nextjs/server";
import { Metadata } from "next";
import { redirect } from "next/navigation";

export const metadata: Metadata = {
    title: "Corporate Orders",
    description: "View and manage your corporate apparel orders",
};

export default async function Page() {
    const { userId } = await auth();
    if (!userId) redirect("/auth/signin");

    const initialData = await corporateOrderService.listOrdersForUser(userId);

    return <CorporateOrdersPage initialData={initialData} />;
}
