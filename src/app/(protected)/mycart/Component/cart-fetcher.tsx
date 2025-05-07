// src/app/(protected)/mycart/Component/cart-fetcher.tsx
"use client";

import { trpc } from "@/lib/trpc/client";
import { OrderProductCard } from "./payment-stepper/ordered-product-card-view";
import { useMemo } from "react";

interface CartFetcherProps {
    userId: string;
}

export default function CartFetcher({ userId }: CartFetcherProps) {
    const { data: userCart, isLoading, error } = trpc.general.users.cart.getCartForUser.useQuery(
        { userId },
        { enabled: !!userId } // Only fetch if userId is present
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

    if (isLoading) {
        return <div>Loading cart...</div>;
    }

    if (error) {
        return <div>Error loading cart: {error.message}</div>;
    }

    return <OrderProductCard orderItems={cartItems as any} />;
}