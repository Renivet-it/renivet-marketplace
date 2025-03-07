"use client";

import { Button } from "@/components/ui/button-general";
import { Checkbox } from "@/components/ui/checkbox";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog-general";
import { Input } from "@/components/ui/input-general";
import { Separator } from "@/components/ui/separator";
import { DEFAULT_MESSAGES } from "@/config/const";
import { trpc } from "@/lib/trpc/client";
import {
    calculateTotalPriceWithCoupon,
    convertPaiseToRupees,
    convertValueToLabel,
    formatPriceTag,
    handleClientError,
} from "@/lib/utils";
import { CouponWithCategory } from "@/lib/validations";
import { useRouter } from "next/navigation";
import { Dispatch, SetStateAction, useMemo, useState } from "react";
import { toast } from "sonner";

interface PageProps {
    userId: string;
    isOpen: boolean;
    setIsOpen: Dispatch<SetStateAction<boolean>>;
}

export function CheckoutModal({ userId, isOpen, setIsOpen }: PageProps) {
    const router = useRouter();

    const [isHasCouponChecked, setIsHasCouponChecked] = useState(false);
    const [couponCode, setCouponCode] = useState<string>("");
    const [couponStatus, setCouponStatus] = useState<
        "idle" | "valid" | "invalid"
    >("idle");
    const [coupon, setCoupon] = useState<CouponWithCategory | null>(null);

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
            coupon
                ? {
                      discountType: coupon.discountType,
                      discountValue: coupon.discountValue,
                      maxDiscountAmount: coupon.maxDiscountAmount,
                      categoryId: coupon.categoryId,
                      subCategoryId: coupon.subCategoryId,
                      productTypeId: coupon.productTypeId,
                  }
                : null,
            items
        );
    }, [availableCart, coupon]);

    const { mutate: validateCoupon, isPending: isValidating } =
        trpc.general.coupons.validateCoupon.useMutation({
            onMutate: () => {
                const toastId = toast.loading("Validating coupon...");
                return { toastId };
            },
            onSuccess: (data, _, { toastId }) => {
                toast.success("Coupon applied successfully", { id: toastId });
                setCouponStatus("valid");
                setCoupon(data);
            },
            onError: (err, _, ctx) => {
                setCouponStatus("invalid");
                return handleClientError(err, ctx?.toastId);
            },
        });

    const { mutate: createOrder, isPending: isOrderCreating } =
        trpc.general.orders.createOrder.useMutation({
            onMutate: () => {
                const toastId = toast.loading("Creating your order...");
                return { toastId };
            },
            onSuccess: (newOrder, _, { toastId }) => {
                toast.success("Order created, redirecting to payment page...", {
                    id: toastId,
                });
                router.push(`/orders/${newOrder.id}`);
            },
            onError: (err, _, ctx) => {
                return handleClientError(err, ctx?.toastId);
            },
        });

    return (
        <Dialog
            open={isOpen}
            onOpenChange={(open) => {
                setIsOpen(open);
                if (!open) {
                    setCouponCode("");
                    setCouponStatus("idle");
                    setCoupon(null);
                    setIsHasCouponChecked(false);
                }
            }}
        >
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Order Summary</DialogTitle>

                    <DialogDescription>
                        You are about to place an order for {itemsCount} items
                        with a total of{" "}
                        {formatPriceTag(
                            +convertPaiseToRupees(totalPrice),
                            true
                        )}
                        . Please review your order before proceeding.
                    </DialogDescription>
                </DialogHeader>

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

                    <div className="space-y-4">
                        <div className="flex items-center gap-2 text-sm">
                            <Checkbox
                                id="coupon"
                                checked={isHasCouponChecked}
                                onCheckedChange={(checked) => {
                                    setIsHasCouponChecked(!!checked);
                                    if (!checked) {
                                        setCouponCode("");
                                        setCouponStatus("idle");
                                        setCoupon(null);
                                    }
                                }}
                                disabled={isValidating}
                                className="rounded-none"
                            />
                            <label htmlFor="coupon">I have a coupon</label>
                        </div>

                        {isHasCouponChecked && (
                            <div className="flex items-center gap-2">
                                <Input
                                    className="h-9"
                                    value={couponCode}
                                    onChange={(e) => {
                                        setCouponCode(e.target.value);
                                        setCouponStatus("idle");
                                        setCoupon(null);
                                    }}
                                    disabled={isValidating}
                                />
                                <Button
                                    variant="accent"
                                    size="sm"
                                    disabled={
                                        isValidating || couponStatus === "valid"
                                    }
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
                        )}
                    </div>
                </div>

                <DialogFooter>
                    <Button
                        variant="ghost"
                        size="sm"
                        disabled={
                            isUserFetching || isOrderCreating || isValidating
                        }
                        onClick={() => setIsOpen(false)}
                    >
                        Cancel
                    </Button>

                    <Button
                        size="sm"
                        disabled={
                            isUserFetching ||
                            isOrderCreating ||
                            isValidating ||
                            (isHasCouponChecked && couponStatus !== "valid")
                        }
                        onClick={() => {
                            if (!user)
                                return toast.error(
                                    DEFAULT_MESSAGES.ERRORS.USER_FETCHING
                                );

                            createOrder({
                                userId,
                                coupon: coupon?.code,
                                addressId: user.addresses.find(
                                    (add) => add.isPrimary
                                )!.id,
                                deliveryAmount: priceList.delivery.toString(),
                                taxAmount: "0",
                                totalAmount: priceList.total.toString(),
                                discountAmount: priceList.discount.toString(),
                                paymentMethod: null,
                                totalItems: itemsCount,
                                items:
                                    userCart
                                        ?.filter((item) => item.status)
                                        .map((item) => ({
                                            price: item.variantId
                                                ? (item.product.variants.find(
                                                      (v) =>
                                                          v.id ===
                                                          item.variantId
                                                  )?.price ??
                                                  item.product.price ??
                                                  0)
                                                : (item.product.price ?? 0),
                                            brandId: item.product.brandId,
                                            productId: item.product.id,
                                            variantId: item.variantId,
                                            sku:
                                                item.variant?.nativeSku ??
                                                item.product.nativeSku,
                                            quantity: item.quantity,
                                            categoryId: item.product.categoryId,
                                        })) || [],
                            });
                        }}
                    >
                        Proceed to checkout
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
