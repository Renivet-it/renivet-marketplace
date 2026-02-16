import { OrdersPage } from "@/components/profile";
import { Skeleton } from "@/components/ui/skeleton";
import { orderQueries } from "@/lib/db/queries";
import { userCache } from "@/lib/redis/methods";
import { auth } from "@clerk/nextjs/server";
import { Metadata } from "next";
import { redirect } from "next/navigation";
import { Suspense } from "react";

export const metadata: Metadata = {
    title: "Your Orders",
    description: "View and manage your orders",
};

export default function Page() {
    return (
        <div className="min-w-0 flex-1">
            <Suspense fallback={<OrdersSkeleton />}>
                <OrdersFetch />
            </Suspense>
        </div>
    );
}

async function OrdersFetch() {
    const { userId } = await auth();
    if (!userId) redirect("/auth/signin");

    const [user, data] = await Promise.all([
        userCache.get(userId),
        orderQueries.getOrdersByUserId(userId),
    ]);
    if (!user) redirect("/auth/signin");

    return <OrdersPage initialData={data} user={user} />;
}

function OrdersSkeleton() {
    return (
        <div className="space-y-5">
            {/* Title skeleton */}
            <div>
                <Skeleton className="h-8 w-40" />
                <Skeleton className="mt-2 hidden h-4 w-64 md:block" />
            </div>

            {/* Tabs skeleton */}
            <div className="flex gap-3">
                <Skeleton className="h-10 w-32 rounded-full" />
                <Skeleton className="h-10 w-28 rounded-full" />
            </div>

            {/* Cards skeleton */}
            {[...Array(3)].map((_, i) => (
                <Skeleton key={i} className="h-24 w-full rounded-xl" />
            ))}
        </div>
    );
}
