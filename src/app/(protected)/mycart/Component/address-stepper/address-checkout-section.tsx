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
import { ArrowRight, Leaf, Package, Shield, Truck } from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useMemo } from "react";
import { toast } from "sonner";

interface PageProps {
    userId: string;
}

export default function AddressCheckoutSection({ userId }: PageProps) {
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

    const itemsToDisplay = availableCart.filter((item) => item.status);

    const itemsCount = useMemo(
        () => itemsToDisplay.reduce((acc, item) => acc + item.quantity, 0) || 0,
        [itemsToDisplay]
    );

    const priceList = useMemo(() => {
        const items = itemsToDisplay.map((item) => {
            const itemPrice = item.variantId
                ? (item.product.variants?.find((v) => v.id === item.variantId)
                      ?.price ??
                  item.product.price ??
                  0)
                : (item.product.price ?? 0);

            const compareAtPrice = item.variantId
                ? (item.product.variants?.find((v) => v.id === item.variantId)
                      ?.compareAtPrice ??
                  item.product.compareAtPrice ??
                  itemPrice)
                : (item.product.compareAtPrice ?? itemPrice);

            return {
                price: itemPrice,
                compareAtPrice: compareAtPrice,
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
        <div className="w-full space-y-3">
            {/* ── Items in your order ── */}
            <div className="rounded-xl border border-gray-200 bg-white">
                <div className="flex items-center justify-between border-b border-gray-100 px-4 py-3">
                    <div className="flex items-center gap-2">
                        <Package className="size-4 text-blue-600" />
                        <h3 className="text-sm font-semibold text-gray-900">
                            Your Items ({itemsCount})
                        </h3>
                    </div>
                </div>

                {itemsToDisplay.length > 0 ? (
                    <div className="divide-y divide-gray-50 px-4">
                        {itemsToDisplay.map((item) => {
                            const imgUrl =
                                item.product.media?.[0]?.mediaItem?.url ??
                                "https://4o4vm2cu6g.ufs.sh/f/HtysHtJpctzNNQhfcW4g0rgXZuWwadPABUqnljV5RbJMFsx1";
                            const itemPrice = item.variantId
                                ? (item.product.variants?.find(
                                      (v) => v.id === item.variantId
                                  )?.price ??
                                  item.product.price ??
                                  0)
                                : (item.product.price ?? 0);

                            return (
                                <div
                                    key={item.id}
                                    className="flex items-center gap-3 py-3"
                                >
                                    <div className="relative aspect-square w-12 shrink-0 overflow-hidden rounded-lg border border-gray-100 bg-[#fafaf5]">
                                        <Image
                                            src={imgUrl}
                                            alt={item.product.title}
                                            width={96}
                                            height={96}
                                            className="size-full object-contain p-0.5"
                                        />
                                    </div>
                                    <div className="min-w-0 flex-1">
                                        <h4 className="truncate text-sm font-medium text-gray-900">
                                            {item.product.title}
                                        </h4>
                                        <p className="text-xs text-gray-500">
                                            Qty: {item.quantity} ·{" "}
                                            {formatPriceTag(
                                                parseFloat(
                                                    convertPaiseToRupees(
                                                        itemPrice
                                                    )
                                                ),
                                                true
                                            )}
                                        </p>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                ) : (
                    <div className="p-4 text-sm text-gray-500">
                        No items to display.
                    </div>
                )}
            </div>

            {/* ── Price breakdown ── */}
            <div className="rounded-xl border border-gray-200 bg-white px-4 py-4">
                <h3 className="mb-3 text-sm font-semibold text-gray-900">
                    Order Summary
                </h3>
                <div className="space-y-2">
                    {Object.entries(priceList)
                        .filter(
                            ([key]) =>
                                key !== "total" &&
                                key !== "delivery" &&
                                key !== "discount"
                        )
                        .map(([key, value]) => (
                            <div
                                key={key}
                                className="flex justify-between text-sm"
                            >
                                <span
                                    className={
                                        key.toLowerCase().includes("discount")
                                            ? "text-emerald-600"
                                            : "text-gray-500"
                                    }
                                >
                                    {convertValueToLabel(key)}
                                </span>
                                <span
                                    className={
                                        key.toLowerCase().includes("discount")
                                            ? "font-medium text-emerald-600"
                                            : "text-gray-700"
                                    }
                                >
                                    {key.toLowerCase().includes("discount") &&
                                    value > 0
                                        ? "-"
                                        : ""}
                                    {formatPriceTag(
                                        +convertPaiseToRupees(value),
                                        true
                                    )}
                                </span>
                            </div>
                        ))}
                    <div className="flex justify-between text-sm">
                        <span className="text-gray-500">Delivery</span>
                        <span className="font-medium text-blue-600">FREE</span>
                    </div>

                    <Separator className="my-1" />

                    <div className="flex items-center justify-between pt-1">
                        <span className="text-sm font-bold text-gray-900">
                            Total
                        </span>
                        <span className="text-base font-bold text-gray-900">
                            {formatPriceTag(
                                +convertPaiseToRupees(priceList.total),
                                true
                            )}
                        </span>
                    </div>
                </div>
            </div>

            {/* ── Trust badges ── */}
            <div className="grid grid-cols-2 gap-2">
                <div className="flex items-center gap-2 rounded-lg border border-gray-100 bg-[#fafaf5] px-3 py-2.5">
                    <Leaf className="size-3.5 text-blue-600" />
                    <span className="text-[11px] font-medium text-gray-600">
                        Carbon Neutral
                    </span>
                </div>
                <div className="flex items-center gap-2 rounded-lg border border-gray-100 bg-[#fafaf5] px-3 py-2.5">
                    <Shield className="size-3.5 text-blue-600" />
                    <span className="text-[11px] font-medium text-gray-600">
                        Secure Checkout
                    </span>
                </div>
                <div className="flex items-center gap-2 rounded-lg border border-gray-100 bg-[#fafaf5] px-3 py-2.5">
                    <Truck className="size-3.5 text-blue-600" />
                    <span className="text-[11px] font-medium text-gray-600">
                        Free Delivery
                    </span>
                </div>
                <div className="flex items-center gap-2 rounded-lg border border-gray-100 bg-[#fafaf5] px-3 py-2.5">
                    <Package className="size-3.5 text-blue-600" />
                    <span className="text-[11px] font-medium text-gray-600">
                        Easy Returns
                    </span>
                </div>
            </div>

            {/* ── Proceed button ── */}
            <Button
                size="lg"
                className="group w-full rounded-xl bg-[#95b6da] text-sm font-semibold text-white shadow-sm transition-all hover:bg-[#82a3c7] hover:shadow-md"
                disabled={
                    isUserFetching ||
                    itemsToDisplay.length === 0 ||
                    !selectedShippingAddress
                }
                onClick={() => {
                    if (!user)
                        return toast.error(
                            DEFAULT_MESSAGES.ERRORS.USER_FETCHING
                        );
                    if (user.addresses.length === 0)
                        return toast.error("Please add an address to proceed");
                    if (!selectedShippingAddress)
                        return toast.error("Please select a shipping address.");
                    router.push("?step=2");
                }}
            >
                Proceed to Checkout
                <ArrowRight className="ml-2 size-4 transition-transform group-hover:translate-x-0.5" />
            </Button>
        </div>
    );
}
