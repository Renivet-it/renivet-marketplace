import { Icons } from "@/components/icons";
import { CartPage } from "@/components/profile";
import { Button } from "@/components/ui/button-general";
import {
    Card,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import {
    EmptyPlaceholder,
    EmptyPlaceholderContent,
    EmptyPlaceholderDescription,
    EmptyPlaceholderIcon,
    EmptyPlaceholderTitle,
} from "@/components/ui/empty-placeholder-general";
import { Skeleton } from "@/components/ui/skeleton";
import { userCartCache } from "@/lib/redis/methods";
import { auth } from "@clerk/nextjs/server";
import { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Suspense } from "react";

export const metadata: Metadata = {
    title: "Shopping Cart",
    description: "View and manage your cart",
};

export default function Page() {
    return (
        <div className="space-y-5 md:basis-3/4">
            <Card className="w-full rounded-none">
                <CardHeader>
                    <CardTitle>Shopping Cart</CardTitle>
                    <CardDescription>View and manage your cart</CardDescription>
                </CardHeader>
            </Card>

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
    if (data.length === 0)
        return (
            <div className="flex flex-col items-center justify-center gap-5 p-6">
                <EmptyPlaceholder
                    isBackgroundVisible={false}
                    className="w-full max-w-full border-none"
                >
                    <EmptyPlaceholderIcon>
                        <Icons.AlertTriangle className="size-10" />
                    </EmptyPlaceholderIcon>

                    <EmptyPlaceholderContent>
                        <EmptyPlaceholderTitle>
                            Your cart is empty
                        </EmptyPlaceholderTitle>
                        <EmptyPlaceholderDescription>
                            Continue shopping and keep adding products to your
                            cart.
                        </EmptyPlaceholderDescription>
                    </EmptyPlaceholderContent>

                    <Button asChild>
                        <Link href="/shop">Continue Shopping</Link>
                    </Button>
                </EmptyPlaceholder>
            </div>
        );

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
