// src/app/(protected)/mycart/Component/payment-stepper/payment.tsx
import { GeneralShell } from "@/components/globals/layouts";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { userCache } from "@/lib/redis/methods";
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import Script from "next/script";
import { Suspense } from "react";
import CartDataFetcher from "./cart-data-fetcher";

interface PageProps {
    params: Promise<{ id: string | null }>;
}

export default function Page({ params }: PageProps) {
    return (
        <GeneralShell>
            <Suspense fallback={<OrderSkeleton />}>
                <CheckoutFetch params={params} />
            </Suspense>
            <Script src="https://checkout.razorpay.com/v1/checkout.js" />
        </GeneralShell>
    );
}

async function CheckoutFetch({ params }: PageProps) {
    await params; // Resolve params (id is null)

    const { userId } = await auth();
    if (!userId) redirect("/auth/signin");

    const currentUser = await userCache.get(userId);
    if (!currentUser) redirect("/auth/signin");

    // Pass to client-side CartDataFetcher
    return <CartDataFetcher userId={userId} user={currentUser} />;
}

function OrderSkeleton() {
    return (
        <div className="flex flex-col-reverse justify-between gap-5 lg:flex-row">
            <div className="w-full space-y-5 px-5">
                <Skeleton className="h-32 w-full" />
                <Separator />
                <Skeleton className="h-10 w-full" />
                <div className="space-y-2">
                    {[...Array(3)].map((_, i) => (
                        <Skeleton key={i} className="h-52 w-full" />
                    ))}
                </div>
            </div>
            <div className="hidden w-px bg-border md:inline-block" />
            <Skeleton className="h-64 w-full lg:max-w-96" />
        </div>
    );
}