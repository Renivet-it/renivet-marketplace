// src/app/(protected)/mycart/Component/address-stepper/address-checkout-section.tsx
"use client";

import { Button } from "@/components/ui/button-general";
import { Separator } from "@/components/ui/separator";
import { DEFAULT_MESSAGES } from "@/config/const";
import { useCartStore } from "@/lib/store/cart-store";
import { trpc } from "@/lib/trpc/client";
import {
    calculateTotalPriceWithCoupon,
    convertPaiseToRupees,
    convertValueToLabel,
    formatPriceTag,
} from "@/lib/utils";
import { useRouter } from "next/navigation";
import { useMemo } from "react";
import { toast } from "sonner";
import Image from "next/image";

interface PageProps {
    userId: string;
    order?: any; // Optional, as no order is created
}

export default function AddressCheckoutSection({ userId, order }: PageProps) {
    const router = useRouter();
    const { selectedShippingAddress, appliedCoupon } = useCartStore();

    const { data: userCart } = trpc.general.users.cart.getCartForUser.useQuery({
        userId,
    });

    const { data: user, isPending: isUserFetching } =
        trpc.general.users.currentUser.useQuery();

    const availableCart = useMemo(
        () =>
            userCart?.filter(
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
            ) || [],
        [userCart]
    );

    // Use cart items since no order is created
    const itemsToDisplay = availableCart.filter((item) => item.status);

    const itemsCount = useMemo(
        () => itemsToDisplay.reduce((acc: any, item: any) => acc + item.quantity, 0) || 0,
        [itemsToDisplay]
    );

    const totalPrice = useMemo(
        () =>
            itemsToDisplay.reduce((acc: any, item: any) => {
                const itemPrice = item.variantId
                    ? (item.product.variants?.find((v:any) => v.id === item.variantId)
                          ?.price ?? item.product.price ?? 0)
                    : (item.product.price ?? 0);
                return acc + itemPrice * item.quantity;
            }, 0) || 0,
        [itemsToDisplay]
    );

    const priceList = useMemo(() => {
        const items = itemsToDisplay.map((item: any) => {
            const itemPrice = item.variantId
                ? (item.product.variants?.find((v: any) => v.id === item.variantId)
                      ?.price ?? item.product.price ?? 0)
                : (item.product.price ?? 0);
            return {
                price: itemPrice,
                quantity: item.quantity,
                categoryId: item.product.categoryId,
                subCategoryId: item.product.subcategoryId,
                productTypeId: item.product.productTypeId,
            };
        });

        return calculateTotalPriceWithCoupon(
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
    }, [itemsToDisplay, appliedCoupon]);

    return (
        <div className="mx-auto w-full max-w-md rounded-lg bg-white p-4 shadow">
            <div className="mb-4 border-b pb-2">
                <h2 className="text-lg font-semibold text-gray-900">Order Details</h2>
                {itemsToDisplay.length > 0 ? (
                    <ul className="mt-2 space-y-2">
    {itemsToDisplay.map((item: any) => (
        <li key={item.id} className="flex items-center gap-3">
            {/* Product Image */}
            <div className="h-15 w-12 flex-shrink-0">
                {item.product.media &&
                item.product.media.length > 0 &&
                item.product.media[0].mediaItem &&
                item.product.media[0].mediaItem.url ? (
                    <Image
                        src={item.product.media[0].mediaItem.url}
                        alt={item.product.title}
                        width={1000}
                        height={1000}
                        className="h-15 w-12 rounded-md object-cover"
                    />
                ) : (
                    <div className="h-10 w-10 rounded-md bg-gray-200" />
                )}
            </div>

            {/* Product Name and Quantity */}
            <div className="flex-1 flex justify-between items-center text-sm overflow-hidden">
                <span className="text-sm font-medium text-gray-900 whitespace-normal">
                    {item.product.title}
                </span>
                <span className="text-sm text-gray-500 flex-shrink-0">
                    Qty: {item.quantity}
                </span>
            </div>
        </li>
    ))}
</ul>
                ) : (
                    <div className="mt-2 text-sm text-gray-500">
                        No items to display. Please add items to your cart.
                    </div>
                )}
            </div>

            {/* Order Summary Section */}
            <div className="mb-4">
                <h2 className="text-lg font-semibold">Order Summary</h2>
                <p className="text-sm text-gray-500">
                    You are about to place an order for {itemsCount} items with a total of{" "}
                    {formatPriceTag(+convertPaiseToRupees(priceList.total), true)}.
                    Please review your order before proceeding.
                </p>
            </div>

            {/* Price Summary Section */}
            <div className="space-y-4">
                <div className="space-y-2">
                    <ul className="space-y-1">
                        {Object.entries(priceList)
                            .filter(([key]) => key !== "total")
                            .map(([key, value]) => (
                                <li key={key} className="flex justify-between text-sm">
                                    <span>{convertValueToLabel(key)}:</span>
                                    <span>{formatPriceTag(+convertPaiseToRupees(value), true)}</span>
                                </li>
                            ))}
                    </ul>

                    <Separator />

                    <div className="flex justify-between font-semibold text-destructive">
                        <span>Total:</span>
                        <span>{formatPriceTag(+convertPaiseToRupees(priceList.total), true)}</span>
                    </div>
                </div>
            </div>

            {/* Footer/Action Section */}
            <div className="mt-6">
                <Button
                    size="sm"
                    className="w-full"
                    disabled={
                        isUserFetching ||
                        itemsToDisplay.length === 0 ||
                        !selectedShippingAddress
                    }
                    onClick={() => {
                        if (!user)
                            return toast.error(DEFAULT_MESSAGES.ERRORS.USER_FETCHING);

                        if (user.addresses.length === 0)
                            return toast.error("Please add an address to proceed");

                        if (!selectedShippingAddress)
                            return toast.error("Please select a shipping address.");

                        router.push("?step=2");
                    }}
                >
                    Proceed to checkout
                </Button>
            </div>
        </div>
    );
}