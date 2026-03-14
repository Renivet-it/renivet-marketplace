import { HelpCenterPage } from "@/components/profile";
import { Skeleton } from "@/components/ui/skeleton";
import { orderQueries } from "@/lib/db/queries";
import { userCache } from "@/lib/redis/methods";
import { auth } from "@clerk/nextjs/server";
import { Metadata } from "next";
import { redirect } from "next/navigation";
import { Suspense } from "react";

export const metadata: Metadata = {
    title: "Help Center",
    description: "Get help with your orders, account, or any other issues",
};

export default function Page() {
    return (
        <div className="min-w-0 flex-1">
            <Suspense fallback={<HelpCenterSkeleton />}>
                <HelpCenterFetch />
            </Suspense>
        </div>
    );
}

async function HelpCenterFetch() {
    const { userId } = await auth();
    if (!userId) redirect("/auth/signin");

    const [user, orders] = await Promise.all([
        userCache.get(userId),
        orderQueries.getOrdersByUserId(userId),
    ]);
    if (!user) redirect("/auth/signin");

    return <HelpCenterPage initialOrders={orders} user={user} />;
}

function HelpCenterSkeleton() {
    return (
        <div className="space-y-5">
            <div>
                <Skeleton className="h-8 w-40" />
                <Skeleton className="mt-2 h-4 w-64" />
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <Skeleton className="h-36 w-full rounded-2xl" />
                <Skeleton className="h-36 w-full rounded-2xl" />
            </div>
            <Skeleton className="h-48 w-full rounded-2xl" />
        </div>
    );
}
