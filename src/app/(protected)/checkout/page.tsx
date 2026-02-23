import {
    Footer,
    GeneralShell,
    NavbarHome,
    NavbarMob,
} from "@/components/globals/layouts";
import { auth } from "@clerk/nextjs/server";
import { Metadata } from "next";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import CheckoutContent from "./checkout-content";

export const metadata: Metadata = {
    title: "Review Order",
    description: "Review and complete your purchase",
};

export default async function CheckoutPage() {
    const { userId } = await auth();

    if (!userId) {
        redirect("/auth/signin?redirect_url=/checkout");
    }

    return (
        <div className="relative flex min-h-screen flex-col bg-[#fcfcf5]">
            <NavbarHome />
            <main className="flex flex-1 flex-col">
                <GeneralShell>
                    <div className="mx-auto w-full max-w-2xl">
                        <Suspense fallback={<CheckoutLoadingSkeleton />}>
                            <CheckoutContent userId={userId} />
                        </Suspense>
                    </div>
                </GeneralShell>
            </main>
            <Footer />
            <NavbarMob />
        </div>
    );
}

function CheckoutLoadingSkeleton() {
    return (
        <div className="space-y-4">
            <div className="h-10 animate-pulse rounded-xl bg-gray-200" />
            <div className="h-32 animate-pulse rounded-xl bg-gray-200" />
            <div className="h-24 animate-pulse rounded-xl bg-gray-200" />
            <div className="h-64 animate-pulse rounded-xl bg-gray-200" />
        </div>
    );
}
