import { CartPage } from "@/components/profile";
import {
    Card,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { userCartCache } from "@/lib/redis/methods";
import { auth } from "@clerk/nextjs/server";
import { Metadata } from "next";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import ShippingAddress from "./component/shipping-address";

export const metadata: Metadata = {
    title: "Shopping Cart",
    description: "View and manage your cart",
};

export default function Page() {
    return (
        <div className="space-y-5 md:basis-3/4">
            <Card className="w-full rounded-none">
                <CardHeader className="px-4 md:p-6">
                    <CardTitle>Shopping Cart</CardTitle>
                    <CardDescription>View and manage your cart</CardDescription>
                </CardHeader>
            </Card>
            <ShippingAddress
                title={"shipping address"}
                description={"please select address for this order shipment"}
            />
            <Suspense fallback={<CartSkeleton />}>
                <CartFetch />
            </Suspense>
        </div>
    );
}

async function CartFetch() {
    const { userId } = await auth();
    if (!userId) redirect("/auth/signin");

    const data = await userCartCache.get(userId);
    return <CartPage initialData={data} userId={userId} />;
}

function CartSkeleton() {
    return (
        <div className="space-y-5">
            <Skeleton className="h-24 rounded-none" />
            <Skeleton className="h-20 rounded-none" />

            <div className="space-y-2">
                {[...Array(3)].map((_, i) => (
                    <Skeleton key={i} className="h-64 rounded-none" />
                ))}
            </div>
        </div>
    );
}
