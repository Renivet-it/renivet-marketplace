import { GeneralShell } from "@/components/globals/layouts";
import { OrderPage } from "@/components/orders";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { orderQueries } from "@/lib/db/queries";
import { userCache } from "@/lib/redis/methods";
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import Script from "next/script";
import { Suspense } from "react";

interface PageProps {
    params: Promise<{ id: string }>;
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
    const { id } = await params;

    const { userId } = await auth();
    if (!userId) redirect("/auth/signin");

    const [data, currentUser] = await Promise.all([
        orderQueries.getOrderById(id),
        userCache.get(userId),
    ]);
    if (!currentUser) redirect("/auth/signin");
    if (!data) redirect("/mycart");

    return <OrderPage initialData={data} user={currentUser} />;
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
