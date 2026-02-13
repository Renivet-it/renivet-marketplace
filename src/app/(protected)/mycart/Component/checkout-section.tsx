// src/app/(protected)/mycart/Component/checkout-section.tsx
"use client";

import { Icons } from "@/components/icons";
import { Button } from "@/components/ui/button-general";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog-general";
import { Input } from "@/components/ui/input-general";
import { Separator } from "@/components/ui/separator";
import { DEFAULT_MESSAGES } from "@/config/const";
import { useCartStore } from "@/lib/store/cart-store";
import { trpc } from "@/lib/trpc/client";
import {
    calculateTotalPriceWithCoupon,
    convertPaiseToRupees,
    convertValueToLabel,
    formatPriceTag,
    handleClientError,
} from "@/lib/utils";
import { CouponWithCategory } from "@/lib/validations";
import { Leaf, Recycle, Truck, Users } from "lucide-react";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { toast } from "sonner";

interface PageProps {
    userId: string;
}

export default function CheckoutSection({ userId }: PageProps) {
    const router = useRouter();
    const { selectedShippingAddress, appliedCoupon, setAppliedCoupon } =
        useCartStore();

    const [isCouponModalOpen, setIsCouponModalOpen] = useState(false);
    const [couponCode, setCouponCode] = useState<string>("");

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

    const itemsCount = useMemo(
        () =>
            availableCart
                .filter((item) => item.status)
                .reduce((acc, item) => acc + item.quantity, 0) || 0,
        [availableCart]
    );

    const totalPrice = useMemo(
        () =>
            availableCart
                .filter((item) => item.status)
                .reduce((acc, item) => {
                    const itemPrice = item.variantId
                        ? (item.product.variants.find(
                              (v) => v.id === item.variantId
                          )?.price ??
                          item.product.price ??
                          0)
                        : (item.product.price ?? 0);
                    return acc + itemPrice * item.quantity;
                }, 0) || 0,
        [availableCart]
    );

    const priceList = useMemo(() => {
        const items = availableCart
            .filter((item) => item.status)
            .map((item) => {
                const itemPrice = item.variantId
                    ? (item.product.variants.find(
                          (v) => v.id === item.variantId
                      )?.price ??
                      item.product.price ??
                      0)
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
    }, [availableCart, appliedCoupon]);

    const { mutate: validateCoupon, isPending: isValidating } =
        trpc.general.coupons.validateCoupon.useMutation({
            onMutate: () => {
                const toastId = toast.loading("Validating coupon...");
                return { toastId };
            },
            onSuccess: (data, _, { toastId }) => {
                toast.success("Coupon applied successfully", { id: toastId });
                setAppliedCoupon(data); // Store in useCartStore
                setIsCouponModalOpen(false);
                setCouponCode("");
            },
            onError: (err, _, ctx) => {
                return handleClientError(err, ctx?.toastId);
            },
        });

    return (
        <div className="w-full space-y-4">
            {/* Complimentary delivery banner */}
            <div className="flex items-center gap-2 rounded-xl border border-green-200 bg-green-50 px-4 py-3">
                <div className="flex size-6 shrink-0 items-center justify-center rounded-full bg-green-100">
                    <Truck className="size-3.5 text-green-600" />
                </div>
                <p className="text-xs font-medium text-green-700">
                    Your order is eligible for complimentary delivery!
                </p>
            </div>

            {/* Order Summary Card */}
            <div className="rounded-xl border border-gray-200 bg-white p-5">
                <h2 className="mb-4 text-lg font-semibold text-gray-900">
                    Order Summary
                </h2>

                {/* Sustainability line items */}
                <div className="space-y-2.5 text-sm">
                    <div className="flex items-center gap-2 text-gray-600">
                        <Leaf className="size-3.5 text-green-500" />
                        <span className="text-xs">
                            Carbon neutral delivery included
                        </span>
                    </div>
                    <div className="flex items-center gap-2 text-gray-600">
                        <Recycle className="size-3.5 text-blue-500" />
                        <span className="text-xs">
                            We plant 2 trees to offset emissions
                        </span>
                    </div>
                </div>

                <Separator className="my-4" />

                {/* Price breakdown */}
                <div className="space-y-2">
                    <ul className="space-y-1.5">
                        {Object.entries(priceList)
                            .filter(([key]) => key !== "total")
                            .map(([key, value]) => (
                                <li
                                    key={key}
                                    className="flex justify-between text-sm text-gray-600"
                                >
                                    <span>{convertValueToLabel(key)}</span>
                                    <span>
                                        {formatPriceTag(
                                            +convertPaiseToRupees(value),
                                            true
                                        )}
                                    </span>
                                </li>
                            ))}
                        <li className="flex justify-between text-sm text-gray-600">
                            <span>Delivery</span>
                            <span className="font-medium text-green-600">
                                {formatPriceTag(0, true)} (Free)
                            </span>
                        </li>
                    </ul>

                    <Separator />

                    {/* Your Impact section */}
                    <div className="rounded-lg bg-emerald-50/70 p-3">
                        <p className="mb-2 text-xs font-semibold text-emerald-800">
                            Your Impact
                        </p>
                        <div className="space-y-1.5 text-xs text-emerald-700">
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

                    <p className="text-[10px] text-gray-400">
                        Certified estimated over{" "}
                        {formatPriceTag(
                            +(
                                +convertPaiseToRupees(priceList.total) /
                                (itemsCount * 180 || 1)
                            ).toFixed(2),
                            true
                        )}{" "}
                        per wear per item
                    </p>
                </div>

                {/* Coupon section */}
                <div className="mt-4 border-t border-gray-100 pt-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <Icons.Tag className="size-4 text-gray-500" />
                            <span className="text-sm font-medium text-gray-700">
                                {appliedCoupon
                                    ? `Coupon: ${appliedCoupon.code}`
                                    : "Apply Coupons"}
                            </span>
                        </div>
                        <button
                            className="rounded-md border border-green-600 px-3 py-1 text-xs font-semibold text-green-600 transition-colors hover:bg-green-50"
                            onClick={() => setIsCouponModalOpen(true)}
                        >
                            APPLY
                        </button>
                    </div>
                </div>

                {/* Proceed to checkout button */}
                <div className="mt-5">
                    <Button
                        size="sm"
                        className="w-full rounded-lg bg-green-600 text-sm font-semibold text-white hover:bg-green-700"
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

                            // Navigate to address page (step 1) without creating an order
                            router.push("?step=1");
                        }}
                    >
                        proceed to checkout
                    </Button>
                </div>
            </div>

            {/* Coupon modal */}
            <Dialog
                open={isCouponModalOpen}
                onOpenChange={(open) => {
                    setIsCouponModalOpen(open);
                    if (!open) {
                        setCouponCode("");
                    }
                }}
            >
                <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                        <DialogTitle>Apply Coupon</DialogTitle>
                    </DialogHeader>
                    <div className="flex items-center gap-2">
                        <Input
                            className="h-9"
                            value={couponCode}
                            onChange={(e) => setCouponCode(e.target.value)}
                            disabled={isValidating}
                            placeholder="Enter coupon code"
                        />
                        <Button
                            type="button"
                            variant="accent"
                            size="sm"
                            disabled={isValidating}
                            onClick={() =>
                                validateCoupon({
                                    code: couponCode,
                                    totalAmount: priceList.total,
                                })
                            }
                        >
                            Apply
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
}
