// src/app/(protected)/mycart/Component/checkout-section.tsx
"use client";

import { Button } from "@/components/ui/button-general";
import { Input } from "@/components/ui/input-general";
import { Separator } from "@/components/ui/separator";
import { DEFAULT_MESSAGES } from "@/config/const";
import { useCartStore } from "@/lib/store/cart-store";
import { trpc } from "@/lib/trpc/client";
import { Icons } from "@/components/icons";
import {
    calculateTotalPriceWithCoupon,
    convertPaiseToRupees,
    convertValueToLabel,
    formatPriceTag,
    handleClientError,
} from "@/lib/utils";
import { CouponWithCategory } from "@/lib/validations";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog-general";

interface PageProps {
    userId: string;
}

export default function CheckoutSection({ userId }: PageProps) {
    const router = useRouter();
    const { selectedShippingAddress, appliedCoupon, setAppliedCoupon } = useCartStore();

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
        <div className="mx-auto w-full max-w-md rounded-lg bg-white p-4 shadow">
            <div className="mb-4 border-b pb-2">
                <h2 className="text-lg font-semibold">Coupons</h2>
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <Icons.Tag className="size-4 text-black" />
                        <span className="text-sm font-medium text-black">
                            {appliedCoupon
                                ? `Coupon Applied: ${appliedCoupon.code}`
                                : "Apply Coupons"}
                        </span>
                    </div>
                    <button
                        className="rounded-sm border border-pink-500 px-4 py-1 text-xs font-semibold text-pink-500 hover:bg-pink-50"
                        onClick={() => setIsCouponModalOpen(true)}
                    >
                        APPLY
                    </button>
                </div>
            </div>

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

            <div className="mb-4">
                <h2 className="text-lg font-semibold">Order Summary</h2>
                <p className="text-sm text-gray-500">
                    You are about to place an order for {itemsCount} items with a
                    total of{" "}
                    {formatPriceTag(+convertPaiseToRupees(priceList.total), true)}.
                    Please review your order before proceeding.
                </p>
            </div>

            <div className="space-y-4">
                <div className="space-y-2">
                    <ul className="space-y-1">
                        {Object.entries(priceList)
                            .filter(([key]) => key !== "total")
                            .map(([key, value]) => (
                                <li
                                    key={key}
                                    className="flex justify-between text-sm"
                                >
                                    <span>{convertValueToLabel(key)}:</span>
                                    <span>
                                        {formatPriceTag(
                                            +convertPaiseToRupees(value),
                                            true
                                        )}
                                    </span>
                                </li>
                            ))}
                    </ul>
                    <Separator />
                    <div className="flex justify-between font-semibold text-destructive">
                        <span>Total:</span>
                        <span>
                            {formatPriceTag(
                                +convertPaiseToRupees(priceList.total),
                                true
                            )}
                        </span>
                    </div>
                </div>
            </div>

            <div className="mt-6">
                <Button
                    size="sm"
                    className="w-full"
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
                            return toast.error("Please add an address to proceed");

                        // Navigate to address page (step 1) without creating an order
                        router.push("?step=1");
                    }}
                >
                    Proceed to checkout
                </Button>
            </div>
        </div>
    );
}