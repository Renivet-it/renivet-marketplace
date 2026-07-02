"use client";
// src/app/(protected)/mycart/Component/cart-fetcher.tsx

import { trpc } from "@/lib/trpc/client";
import { OrderProductCard } from "./payment-stepper/ordered-product-card-view";
import { useMemo } from "react";

interface CartFetcherProps {
    userId: string;
}

export default function CartFetcher({ userId }: CartFetcherProps) {
    const { data: userCart, isLoading: isCartLoading, error } = trpc.general.users.cart.getCartForUser.useQuery(
        { userId },
        { enabled: !!userId } // Only fetch if userId is present
    );

    const { data: activeRewardCartItem, isLoading: isRewardLoading } = trpc.general.swapRewards.getActiveRewardCartItem.useQuery(
        undefined,
        { enabled: !!userId }
    );

    const cartItems = useMemo(() => {
        if (!userCart) return [];

        return userCart
            .filter(
                (c) =>
                    c.product.isPublished &&
                    c.product.verificationStatus === "approved" &&
                    !c.product.isDeleted &&
                    c.product.isAvailable &&
                    (!!c.product.quantity ? c.product.quantity > 0 : true) &&
                    c.product.isActive &&
                    (!c.variant ||
                        (c.variant &&
                            !c.variant.isDeleted &&
                            c.variant.quantity > 0))
            )
            .filter((item) => item.status) || [];
    }, [userCart]);

    const allItems = useMemo(() => {
        const items = [...cartItems];
        if (activeRewardCartItem?.selection) {
            items.push({
                id: activeRewardCartItem.redemption.id,
                product: {
                    id: activeRewardCartItem.selection.product.id,
                    slug: activeRewardCartItem.selection.product.slug,
                    title: activeRewardCartItem.selection.product.title,
                    price: activeRewardCartItem.selection.product.price,
                    brand: activeRewardCartItem.selection.product.brand,
                    media: activeRewardCartItem.selection.product.media,
                    variants: activeRewardCartItem.selection.product.variants || [],
                    options: activeRewardCartItem.selection.product.options || [],
                },
                variantId: undefined,
                quantity: 1,
                isSwapRewardItem: true,
                rewardValue: activeRewardCartItem.selection.rewardValue,
                createdAt: activeRewardCartItem.redemption.createdAt,
            } as any);
        }
        return items;
    }, [cartItems, activeRewardCartItem]);

    const isLoading = isCartLoading || isRewardLoading;

    if (isLoading) {
        return <div>Loading cart...</div>;
    }

    if (error) {
        return <div>Error loading cart: {error.message}</div>;
    }

    return <OrderProductCard orderItems={allItems as any} />;
}