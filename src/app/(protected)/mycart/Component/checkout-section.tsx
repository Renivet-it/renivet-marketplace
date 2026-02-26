// src/app/(protected)/mycart/Component/checkout-section.tsx
"use client";

import { Icons } from "@/components/icons";
import { Button } from "@/components/ui/button-general";
import { Input } from "@/components/ui/input-general";
import { Separator } from "@/components/ui/separator";
import { DEFAULT_MESSAGES } from "@/config/const";
import { useCartStore } from "@/lib/store/cart-store";
import { trpc } from "@/lib/trpc/client";
import {
    calculateTotalPriceWithCoupon,
    cn,
    convertPaiseToRupees,
    convertValueToLabel,
    formatPriceTag,
    handleClientError,
} from "@/lib/utils";
import {
    ChevronRight,
    Clock,
    Leaf,
    Loader2,
    Recycle,
    Tag,
    Ticket,
    Truck,
    Users,
} from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";

interface PageProps {
    userId: string;
}

export default function CheckoutSection({ userId }: PageProps) {
    const router = useRouter();
    const { selectedShippingAddress, appliedCoupon, setAppliedCoupon } =
        useCartStore();

    const [isCouponExpanded, setIsCouponExpanded] = useState(false);
    const [couponCode, setCouponCode] = useState<string>("");

    const { data: userCart } = trpc.general.users.cart.getCartForUser.useQuery({
        userId,
    });
    const { data: user, isPending: isUserFetching } =
        trpc.general.users.currentUser.useQuery();

    const { data: activeCoupons, isLoading: isCouponsLoading } =
        trpc.general.coupons.getActiveCoupons.useQuery(undefined, {
            enabled: isCouponExpanded,
        });

    const { data: userOrders } = trpc.general.orders.getOrdersByUserId.useQuery(
        { userId },
        { enabled: !!userId }
    );

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

    const selectedItems = useMemo(
        () => availableCart.filter((item) => item.status),
        [availableCart]
    );

    const filteredCoupons = useMemo(() => {
        if (!activeCoupons) return [];
        return activeCoupons.filter((coupon) => {
            // If coupon has no category filters, it applies to all
            if (
                !coupon.categoryId &&
                !coupon.subCategoryId &&
                !coupon.productTypeId
            )
                return true;
            // Check if at least one selected cart item matches all non-null coupon filters
            return selectedItems.some((item) => {
                if (
                    coupon.categoryId &&
                    item.product.categoryId !== coupon.categoryId
                )
                    return false;
                if (
                    coupon.subCategoryId &&
                    item.product.subcategoryId !== coupon.subCategoryId
                )
                    return false;
                if (
                    coupon.productTypeId &&
                    item.product.productTypeId !== coupon.productTypeId
                )
                    return false;
                return true;
            });
        });
    }, [activeCoupons, selectedItems]);

    const itemsCount = useMemo(
        () => selectedItems.reduce((acc, item) => acc + item.quantity, 0) || 0,
        [selectedItems]
    );

    const totalPrice = useMemo(
        () =>
            selectedItems.reduce((acc, item) => {
                const itemPrice = item.variantId
                    ? (item.product.variants.find(
                          (v) => v.id === item.variantId
                      )?.price ??
                      item.product.price ??
                      0)
                    : (item.product.price ?? 0);
                return acc + itemPrice * item.quantity;
            }, 0) || 0,
        [selectedItems]
    );

    const priceList = useMemo(() => {
        const items = selectedItems.map((item) => {
            const itemPrice = item.variantId
                ? (item.product.variants.find((v) => v.id === item.variantId)
                      ?.price ??
                  item.product.price ??
                  0)
                : (item.product.price ?? 0);

            const compareAtPrice = item.variantId
                ? (item.product.variants.find((v) => v.id === item.variantId)
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
    }, [selectedItems, appliedCoupon]);

    const { mutate: validateCoupon, isPending: isValidating } =
        trpc.general.coupons.validateCoupon.useMutation({
            onMutate: () => {
                const toastId = toast.loading("Validating coupon...");
                return { toastId };
            },
            onSuccess: (data, _, { toastId }) => {
                toast.success("Coupon applied successfully", { id: toastId });
                setAppliedCoupon(data);
                setCouponCode("");
            },
            onError: (err, _, ctx) => {
                return handleClientError(err, ctx?.toastId);
            },
        });

    // Auto-apply RENIVETFIRST for first-time customers
    const hasAutoApplied = useRef(false);

    useEffect(() => {
        if (
            userOrders &&
            userOrders.length === 0 &&
            !appliedCoupon &&
            !hasAutoApplied.current &&
            totalPrice > 0
        ) {
            hasAutoApplied.current = true;
            validateCoupon({
                code: "RENIVETFIRST",
                totalAmount: totalPrice,
            });
        }
    }, [userOrders, appliedCoupon, totalPrice, validateCoupon]);

    return (
        <div className="w-full space-y-4">
            {/* Complimentary delivery banner */}
            <div className="flex items-center gap-2 rounded-xl border border-blue-200 bg-blue-50 px-4 py-3">
                <div className="flex size-6 shrink-0 items-center justify-center rounded-full bg-blue-100">
                    <Truck className="size-3.5 text-blue-600" />
                </div>
                <p className="text-xs font-medium text-blue-700">
                    Your order is eligible for complimentary delivery!
                </p>
            </div>

            {/* Mobile: Product thumbnails before summary */}
            <div className="space-y-3 lg:hidden">
                {selectedItems.map((item) => {
                    const itemMedia =
                        item.product.media?.[0]?.mediaItem ?? null;
                    const imgUrl =
                        itemMedia?.url ??
                        "https://4o4vm2cu6g.ufs.sh/f/HtysHtJpctzNNQhfcW4g0rgXZuWwadPABUqnljV5RbJMFsx1";
                    const price = item.variantId
                        ? (item.product.variants.find(
                              (v) => v.id === item.variantId
                          )?.price ??
                          item.product.price ??
                          0)
                        : (item.product.price ?? 0);
                    return (
                        <div
                            key={item.id}
                            className="flex items-center gap-3 rounded-lg border border-gray-100 bg-white p-3"
                        >
                            <div className="relative size-16 shrink-0 overflow-hidden rounded-lg">
                                <Image
                                    src={imgUrl}
                                    alt={item.product.title}
                                    width={100}
                                    height={100}
                                    className="size-full object-cover"
                                />
                            </div>
                            <div className="flex-1">
                                <h4 className="line-clamp-2 text-xs font-semibold text-gray-900">
                                    {item.product.title}
                                </h4>
                                <p className="mt-0.5 text-xs font-bold text-gray-900">
                                    {formatPriceTag(
                                        parseFloat(convertPaiseToRupees(price)),
                                        true
                                    )}
                                </p>
                            </div>
                            <div className="flex items-center gap-1.5">
                                <button className="flex size-5 items-center justify-center rounded border border-gray-300 text-gray-500">
                                    <span className="text-xs leading-none">
                                        −
                                    </span>
                                </button>
                                <span className="min-w-[16px] text-center text-xs text-gray-700">
                                    {item.quantity}
                                </span>
                                <button className="flex size-5 items-center justify-center rounded border border-gray-300 text-gray-500">
                                    <span className="text-xs leading-none">
                                        +
                                    </span>
                                </button>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Order Summary Card — hidden card border on mobile, shown on desktop */}
            <div className="border-0 bg-transparent p-0 md:rounded-xl md:border md:border-gray-200 md:bg-white md:p-5">
                <h2 className="mb-4 text-base font-semibold text-gray-900 md:text-lg">
                    Order Summary
                </h2>

                {/* Sustainability line items — desktop only */}
                <div className="hidden space-y-2.5 text-sm md:block">
                    <div className="flex items-center gap-2 text-gray-600">
                        <Leaf className="size-3.5 text-blue-500" />
                        <span className="text-xs">
                            Carbon neutral delivery included
                        </span>
                    </div>
                    <div className="flex items-center gap-2 text-gray-600">
                        <Recycle className="size-3.5 text-blue-600" />
                        <span className="text-xs">
                            We plant 2 trees to offset emissions
                        </span>
                    </div>
                    <Separator className="my-4" />
                </div>

                {/* Price breakdown */}
                <div className="space-y-2">
                    <ul className="space-y-1.5">
                        {Object.entries(priceList)
                            .filter(
                                ([key]) =>
                                    key !== "total" &&
                                    key !== "delivery" &&
                                    key !== "discount"
                            )
                            .map(([key, value]) => (
                                <li
                                    key={key}
                                    className="flex justify-between text-sm text-gray-600"
                                >
                                    <span
                                        className={cn(
                                            key
                                                .toLowerCase()
                                                .includes("discount") &&
                                                "text-emerald-600"
                                        )}
                                    >
                                        {convertValueToLabel(key)}
                                    </span>
                                    <span
                                        className={cn(
                                            key
                                                .toLowerCase()
                                                .includes("discount") &&
                                                "font-medium text-emerald-600"
                                        )}
                                    >
                                        {key
                                            .toLowerCase()
                                            .includes("discount") && value > 0
                                            ? "-"
                                            : ""}
                                        {formatPriceTag(
                                            +convertPaiseToRupees(value),
                                            true
                                        )}
                                    </span>
                                </li>
                            ))}
                        <li className="flex justify-between text-sm text-gray-600">
                            <span>Delivery</span>
                            <span className="font-medium text-blue-600">
                                {formatPriceTag(0, true)} (Free)
                            </span>
                        </li>
                    </ul>

                    <Separator />

                    {/* Your Impact section — desktop only */}
                    <div className="hidden rounded-lg bg-blue-50/70 p-3 md:block">
                        <p className="mb-2 text-xs font-semibold text-blue-800">
                            Your Impact
                        </p>
                        <div className="space-y-1.5 text-xs text-blue-700">
                            <div className="flex items-center gap-1.5">
                                <Leaf className="size-3" />
                                <span>1.6kg CO₂ saved</span>
                            </div>
                            <div className="flex items-center gap-1.5">
                                <Recycle className="size-3" />
                                <span>8% materials reused</span>
                            </div>
                            <div className="flex items-center gap-1.5">
                                <Users className="size-3" />
                                <span>2 artisans supported</span>
                            </div>
                        </div>
                    </div>

                    {/* Total */}
                    <div className="flex items-center justify-between pt-2">
                        <span className="text-base font-bold text-gray-900">
                            Total
                        </span>
                        <span className="text-lg font-bold text-gray-900">
                            {formatPriceTag(
                                +convertPaiseToRupees(priceList.total),
                                true
                            )}
                        </span>
                    </div>

                    {/* Per wear estimate — desktop only */}
                    {/* <p className="hidden text-[10px] text-gray-400 md:block">
                        Certified estimated over{" "}
                        {formatPriceTag(
                            +(
                                +convertPaiseToRupees(priceList.total) /
                                (itemsCount * 180 || 1)
                            ).toFixed(2),
                            true
                        )}{" "}
                        per wear per item
                    </p> */}
                </div>

                {/* Coupon section */}
                <div className="mt-4 border-t border-gray-100 pt-4">
                    <button
                        onClick={() => setIsCouponExpanded((v) => !v)}
                        className="flex w-full items-center justify-between"
                    >
                        <div className="flex items-center gap-2">
                            <Ticket className="size-4 text-gray-500" />
                            <span className="text-sm font-medium text-gray-700">
                                {appliedCoupon
                                    ? `Coupon: ${appliedCoupon.code}`
                                    : "Apply Coupons"}
                            </span>
                        </div>
                        <ChevronRight
                            className={cn(
                                "size-4 text-gray-400 transition-transform duration-200",
                                isCouponExpanded && "rotate-90"
                            )}
                        />
                    </button>

                    {isCouponExpanded && (
                        <div className="mt-3 space-y-3">
                            {/* Applied coupon banner */}
                            {appliedCoupon && (
                                <div className="flex items-center justify-between rounded-lg border border-green-200 bg-green-50/60 px-3 py-2">
                                    <span className="text-xs font-semibold text-green-700">
                                        {appliedCoupon.code} — saving{" "}
                                        {formatPriceTag(
                                            +convertPaiseToRupees(
                                                priceList.discount
                                            ),
                                            true
                                        )}
                                    </span>
                                    <button
                                        onClick={() => setAppliedCoupon(null)}
                                        className="text-xs font-semibold uppercase text-red-500 hover:underline"
                                    >
                                        Remove
                                    </button>
                                </div>
                            )}

                            {/* Manual Input */}
                            <div className="flex items-center gap-2 rounded-xl border border-dashed border-gray-300 bg-gray-50/50 p-2.5">
                                <Input
                                    value={couponCode}
                                    onChange={(e) =>
                                        setCouponCode(
                                            e.target.value.toUpperCase()
                                        )
                                    }
                                    disabled={isValidating}
                                    placeholder="Enter coupon code"
                                    className="h-9 border-gray-200 bg-white text-sm"
                                />
                                <Button
                                    size="sm"
                                    onClick={() =>
                                        validateCoupon({
                                            code: couponCode,
                                            totalAmount: priceList.total,
                                        })
                                    }
                                    disabled={
                                        isValidating || !couponCode.trim()
                                    }
                                    className="h-9 shrink-0 bg-blue-600 px-4 hover:bg-blue-700"
                                >
                                    {isValidating ? (
                                        <Loader2 className="size-4 animate-spin" />
                                    ) : (
                                        "Apply"
                                    )}
                                </Button>
                            </div>

                            {/* Coupon Cards */}
                            <div className="space-y-2.5">
                                {isCouponsLoading ? (
                                    <div className="flex items-center justify-center py-6">
                                        <Loader2 className="size-5 animate-spin text-gray-400" />
                                    </div>
                                ) : !filteredCoupons?.length ? (
                                    <div className="py-6 text-center">
                                        <Ticket className="mx-auto size-8 text-gray-300" />
                                        <p className="mt-1.5 text-xs text-gray-500">
                                            No coupons available right now
                                        </p>
                                    </div>
                                ) : (
                                    filteredCoupons.map((coupon) => {
                                        const isApplied =
                                            appliedCoupon?.code === coupon.code;
                                        const isExpiringSoon =
                                            coupon.expiresAt &&
                                            new Date(
                                                coupon.expiresAt
                                            ).getTime() -
                                                Date.now() <
                                                7 * 24 * 60 * 60 * 1000;

                                        return (
                                            <div
                                                key={coupon.code}
                                                className={cn(
                                                    "rounded-xl border p-3 transition-all",
                                                    isApplied
                                                        ? "border-green-300 bg-green-50/60 ring-1 ring-green-200"
                                                        : "border-gray-200 bg-white hover:border-blue-200 hover:shadow-sm"
                                                )}
                                            >
                                                <div className="flex items-start justify-between gap-3">
                                                    <div className="min-w-0 flex-1">
                                                        <div className="mb-1 flex items-center gap-2">
                                                            <span className="inline-flex items-center rounded-md border border-dashed border-gray-400 bg-gray-50 px-2 py-0.5 text-xs font-bold tracking-wider text-gray-800">
                                                                {coupon.code}
                                                            </span>
                                                            {isApplied && (
                                                                <span className="rounded-full bg-green-100 px-2 py-0.5 text-[10px] font-semibold uppercase text-green-700">
                                                                    Applied
                                                                </span>
                                                            )}
                                                        </div>
                                                        <p className="text-sm font-semibold text-gray-900">
                                                            {coupon.discountType ===
                                                            "percentage"
                                                                ? `${coupon.discountValue}% OFF`
                                                                : `\u20b9${convertPaiseToRupees(coupon.discountValue)} OFF`}
                                                            {coupon.maxDiscountAmount &&
                                                                coupon.discountType ===
                                                                    "percentage" && (
                                                                    <span className="ml-1 text-xs font-normal text-gray-500">
                                                                        (up to
                                                                        {
                                                                            " \u20b9"
                                                                        }
                                                                        {convertPaiseToRupees(
                                                                            coupon.maxDiscountAmount
                                                                        )}
                                                                        )
                                                                    </span>
                                                                )}
                                                        </p>
                                                        {coupon.description && (
                                                            <p className="mt-0.5 text-xs text-gray-500">
                                                                {
                                                                    coupon.description
                                                                }
                                                            </p>
                                                        )}
                                                        <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-gray-400">
                                                            {coupon.minOrderAmount >
                                                                0 && (
                                                                <span className="flex items-center gap-0.5">
                                                                    <Tag className="size-3" />
                                                                    Min
                                                                    {" \u20b9"}
                                                                    {convertPaiseToRupees(
                                                                        coupon.minOrderAmount
                                                                    )}
                                                                </span>
                                                            )}
                                                            {coupon.expiresAt && (
                                                                <span
                                                                    className={cn(
                                                                        "flex items-center gap-0.5",
                                                                        isExpiringSoon &&
                                                                            "font-medium text-orange-500"
                                                                    )}
                                                                >
                                                                    <Clock className="size-3" />
                                                                    {isExpiringSoon
                                                                        ? "Expiring soon"
                                                                        : `Expires ${new Date(coupon.expiresAt).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}`}
                                                                </span>
                                                            )}
                                                        </div>
                                                    </div>
                                                    <div className="shrink-0 pt-1">
                                                        {isApplied ? (
                                                            <button
                                                                onClick={() =>
                                                                    setAppliedCoupon(
                                                                        null
                                                                    )
                                                                }
                                                                className="text-xs font-semibold uppercase tracking-wide text-red-500 hover:underline"
                                                            >
                                                                Remove
                                                            </button>
                                                        ) : (
                                                            <button
                                                                onClick={() =>
                                                                    validateCoupon(
                                                                        {
                                                                            code: coupon.code,
                                                                            totalAmount:
                                                                                priceList.total,
                                                                        }
                                                                    )
                                                                }
                                                                disabled={
                                                                    isValidating
                                                                }
                                                                className="text-xs font-semibold uppercase tracking-wide text-blue-600 hover:underline disabled:opacity-50"
                                                            >
                                                                Apply
                                                            </button>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })
                                )}
                            </div>
                        </div>
                    )}
                </div>

                {/* Proceed to checkout button */}
                <div className="mt-5">
                    <Button
                        size="sm"
                        className="w-full rounded-lg bg-[#95b6da] text-sm font-semibold text-white hover:bg-[#82a3c7]"
                        disabled={
                            isUserFetching ||
                            isValidating ||
                            !userCart?.some((item) => item.status)
                        }
                        onClick={() => {
                            if (!user)
                                return toast.error(
                                    DEFAULT_MESSAGES.ERRORS.USER_FETCHING
                                );

                            if (user.addresses.length === 0)
                                return toast.error(
                                    "Please add an address to proceed"
                                );

                            router.push("?step=1");
                        }}
                    >
                        Proceed to Checkout
                    </Button>
                </div>
            </div>
        </div>
    );
}
