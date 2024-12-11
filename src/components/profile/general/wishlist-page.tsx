"use client";

import { WishlistedProductCard } from "@/components/globals/cards";
import { Icons } from "@/components/icons";
import { Button } from "@/components/ui/button-general";
import {
    EmptyPlaceholder,
    EmptyPlaceholderContent,
    EmptyPlaceholderDescription,
    EmptyPlaceholderIcon,
    EmptyPlaceholderTitle,
} from "@/components/ui/empty-placeholder-general";
import { trpc } from "@/lib/trpc/client";
import { cn } from "@/lib/utils";
import { CachedWishlist } from "@/lib/validations";
import Link from "next/link";

interface PageProps extends GenericProps {
    initialWishlist: CachedWishlist[];
    userId: string;
}

export function WishlistPage({
    className,
    initialWishlist,
    userId,
    ...props
}: PageProps) {
    const { data: wishlist } = trpc.general.users.wishlist.getWishlist.useQuery(
        { userId },
        { initialData: initialWishlist }
    );

    if (wishlist.length === 0) return <NoWishlistCard />;

    return (
        <div
            className={cn(
                "grid grid-cols-2 gap-5 p-4 md:grid-cols-3 md:p-6 xl:grid-cols-4",
                className
            )}
            {...props}
        >
            {wishlist.map((item) => {
                return <WishlistedProductCard key={item.id} item={item} />;
            })}
        </div>
    );
}

function NoWishlistCard() {
    return (
        <div className="flex flex-col items-center justify-center gap-5 p-4 md:p-6">
            <EmptyPlaceholder
                isBackgroundVisible={false}
                className="w-full max-w-full border-none"
            >
                <EmptyPlaceholderIcon>
                    <Icons.AlertTriangle className="size-10" />
                </EmptyPlaceholderIcon>

                <EmptyPlaceholderContent>
                    <EmptyPlaceholderTitle>
                        Your wishlist is empty
                    </EmptyPlaceholderTitle>
                    <EmptyPlaceholderDescription>
                        Continue shopping and keep your favorite products here.
                    </EmptyPlaceholderDescription>
                </EmptyPlaceholderContent>

                <Button asChild>
                    <Link href="/shop">Continue Shopping</Link>
                </Button>
            </EmptyPlaceholder>
        </div>
    );
}
