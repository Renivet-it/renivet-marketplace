import { auth } from "@clerk/nextjs/server";
import { Metadata } from "next";
import { redirect } from "next/navigation";

export const metadata: Metadata = {
    title: "Corporate Order Confirmation",
    description: "Review your corporate order confirmation",
};

export default async function Page({
    params,
}: {
    params: Promise<{ orderId: string }>;
}) {
    const { userId } = await auth();
    if (!userId) {
        redirect("/auth/signin?redirect_url=/corporate-orders");
    }

    const { orderId } = await params;
    redirect(`/profile/corporate-orders?confirmed=${orderId}`);
}
