import { WishlistPage } from "@/components/profile";
import {
    Card,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { userWishlistCache } from "@/lib/redis/methods";
import { auth } from "@clerk/nextjs/server";
import { Metadata } from "next";
import { redirect } from "next/navigation";
import { Suspense } from "react";

export const metadata: Metadata = {
    title: "Wishlist",
    description: "View and manage your wishlist",
};

export default function Page() {
    return (
        <div className="space-y-5 md:basis-3/4">
            <Card className="w-full rounded-none">
                <CardHeader>
                    <CardTitle>Wishlist</CardTitle>
                    <CardDescription>
                        View and manage your wishlist
                    </CardDescription>
                </CardHeader>

                <Separator />

                <Suspense fallback={<WishlistSkeleton />}>
                    <WishlistFetch />
                </Suspense>
            </Card>
        </div>
    );
}

async function WishlistFetch() {
    const { userId } = await auth();
    if (!userId) redirect("/auth/signin");

    const data = await userWishlistCache.get(userId);
    return <WishlistPage initialData={data} userId={userId} />;
}

function WishlistSkeleton() {
    return (
        <div className="grid grid-cols-2 gap-5 p-6 md:grid-cols-3 xl:grid-cols-4">
            {[...Array(10)].map((_, i) => (
                <div key={i}>
                    <div>
                        <Skeleton className="aspect-[3/4] size-full" />
                    </div>

                    <div className="space-y-2 py-2">
                        <div className="space-y-1">
                            <Skeleton className="h-5 w-full" />
                            <Skeleton className="h-3 w-1/2" />
                        </div>

                        <Skeleton className="h-5 w-1/3" />
                    </div>
                </div>
            ))}
        </div>
    );
}
