import { OrdersPage } from "@/components/profile";
import {
    Card,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
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
        <div className="space-y-5 md:basis-3/4">
            <Card className="w-full rounded-none">
                <CardHeader className="px-4 md:p-6">
                    <CardTitle>Your Orders</CardTitle>
                    <CardDescription>
                        View and manage your orders
                    </CardDescription>
                </CardHeader>
            </Card>

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
            <div className="flex items-center gap-5">
                <Skeleton className="h-5 w-[7.5rem]" />
                <Skeleton className="h-10 w-36" />
            </div>

            {[...Array(3)].map((_, i, arr) => (
                <div key={i} className="space-y-5">
                    <Skeleton className="h-96 w-full" />

                    {i !== arr.length - 1 && <Separator />}
                </div>
            ))}
        </div>
    );
}
