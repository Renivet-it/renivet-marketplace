// src/app/(protected)/mycart/Component/payment-stepper/cart-data-fetcher.tsx
"use client";

import { trpc } from "@/lib/trpc/client";
import { OrderPage } from "./order-payment-page";
import { useCartStore } from "@/lib/store/cart-store";
import { useMemo } from "react";
import { CachedUser } from "@/lib/validations";
import { calculateTotalPriceWithCoupon } from "@/lib/utils";

interface CartDataFetcherProps {
    userId: string;
    user: CachedUser;
}

export default function CartDataFetcher({ userId, user }: CartDataFetcherProps) {
    const { appliedCoupon } = useCartStore();

    const { data: userCart, isLoading, error } = trpc.general.users.cart.getCartForUser.useQuery(
        { userId },
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

    // Format cart data to mimic OrderWithItemAndBrand
    const cartSummary = useMemo(() => {
        const items = cartItems.map((item) => {
            const itemPrice = item.variantId
                ? (item.product.variants.find((v) => v.id === item.variantId)?.price ?? item.product.price ?? 0)
                : (item.product.price ?? 0);
            return {
                price: itemPrice,
                quantity: item.quantity,
                categoryId: item.product.categoryId,
                subCategoryId: item.product.subcategoryId,
                productTypeId: item.product.productTypeId,
            };
        });

        const priceList = calculateTotalPriceWithCoupon(
            items.map((item) => item.price * item.quantity),
            appliedCoupon
                ? {
                      discountType: appliedCoupon.discountType,
                      discountValue: appliedCoupon.discountValue,
                      maxDiscountAmount: appliedCoupon.maxDiscountAmount,
                      categoryId: appliedCoupon.categoryId,
                      subCategoryId: appliedCoupon.subCategoryId,
                      productTypeId: appliedCoupon.productTypeId,
                  }
                : null,
            items
        );

        return {
            userId: userId,
            id: `cart-${userId}`,
            status: "pending",
            paymentStatus: "pending",
            items: cartItems.map((item) => ({
                id: item.id,
                product: {
                    ...item.product,
                    verificationStatus: item.product.verificationStatus || "approved",
                    isDeleted: item.product.isDeleted || false,
                    isAvailable: item.product.isAvailable || true,
                    quantity: item.product.quantity || null,
                    price: item.product.price || 0,
                    variants: item.product.variants || [],
                },
                variant: item.variant || null,
                variantId: item.variantId || null,
                quantity: item.quantity,
            })),
            deliveryAmount: priceList.delivery,
            discountAmount: priceList.discount,
            totalAmount: priceList.total,
            address: null, // Use selectedShippingAddress in OrderPage
        };
    }, [cartItems, userId, appliedCoupon]);

    if (isLoading) {
        return <div>Loading cart data...</div>;
    }

    if (error) {
        return <div>Error loading cart: {error.message}</div>;
    }

    // return <OrderPage initialData={cartSummary} user={user} />;
    return <OrderPage initialData={cartSummary as any} user={user} />;
}