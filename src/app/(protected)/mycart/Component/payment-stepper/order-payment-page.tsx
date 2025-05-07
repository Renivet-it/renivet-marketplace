"use client";

import { getShiprocketBalance } from "@/actions";
import { createRazorpayPaymentOptions, initializeRazorpayPayment } from "@/lib/razorpay/payment";
import { cn, convertPaiseToRupees, convertValueToLabel, formatPriceTag, handleClientError } from "@/lib/utils";
import { CachedUser, OrderWithItemAndBrand } from "@/lib/validations";
import { useCartStore } from "@/lib/store/cart-store";
import { trpc } from "@/lib/trpc/client";
import { useMutation } from "@tanstack/react-query";
import Link from "next/link";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { PaymentProcessingModal } from "@/components/globals/modals";
import { Button } from "@/components/ui/button-general";
import { Separator } from "@/components/ui/separator";
import {
    calculateTotalPriceWithCoupon,
} from "@/lib/utils";
interface PageProps extends GenericProps {
    initialData: OrderWithItemAndBrand;
    user: CachedUser;
}

export function OrderPage({ className, initialData, user, ...props }: PageProps) {
    const [isProcessingModalOpen, setIsProcessingModalOpen] = useState(false);
    const [processingModalTitle, setProcessingModalTitle] = useState("");
    const [processingModalDescription, setProcessingModalDescription] = useState("");
    const [processingModalState, setProcessingModalState] = useState<"pending" | "success" | "error">("pending");
    const [isProcessing, setIsProcessing] = useState(false);
    const [createdOrderId, setCreatedOrderId] = useState<string | null>(null);

    const { selectedShippingAddress, appliedCoupon } = useCartStore();

    const { data: userCart } = trpc.general.users.cart.getCartForUser.useQuery(
        { userId: user.id },
        { enabled: !!user.id }
    );

    const { data: order } = trpc.general.orders.getOrder.useQuery(
        { id: initialData.id },
        { initialData }
    );

    const availableItems = useMemo(
        () =>
            userCart?.filter(
                (item) =>
                    item.product.isPublished &&
                    item.product.verificationStatus === "approved" &&
                    !item.product.isDeleted &&
                    item.product.isAvailable &&
                    (!!item.product.quantity ? item.product.quantity > 0 : true) &&
                    item.product.isActive &&
                    (!item.variant ||
                        (item.variant && !item.variant.isDeleted && item.variant.quantity > 0)) &&
                    item.status
            ) || [],
        [userCart]
    );

    const unavailableItems = userCart?.filter((item) => !availableItems.map((i) => i.id).includes(item.id)) || [];
console.log("Unavailable Items:", unavailableItems);
    const itemsCount = useMemo(
        () => availableItems.reduce((acc, item) => acc + item.quantity, 0),
        [availableItems]
    );

    const priceList = useMemo(() => {
        const items = availableItems.map((item) => {
            const itemPrice = item.variantId
                ? (item.product.variants?.find((v) => v.id === item.variantId)?.price ?? item.product.price ?? 0)
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
    }, [availableItems, appliedCoupon]);

    const totalQuantity = availableItems.reduce((acc, item) => acc + item.quantity, 0);

    const { mutate: createOrder, isPending: isOrderCreating } = trpc.general.orders.createOrder.useMutation({
        onMutate: () => {
            const toastId = toast.loading("Processing your order...");
            return { toastId };
        },
        onSuccess: (newOrder, _, { toastId }) => {
            toast.success("Order processed!", { id: toastId });
            setCreatedOrderId(newOrder.id);
            initPayment({ orderId: newOrder.id });
        },
        onError: (err, _, ctx) => {
            setIsProcessing(false);
            return handleClientError(err, ctx?.toastId);
        },
    });

    const { mutate: deleteOrder, isPending: isCancelling } = trpc.general.orders.deleteOrder.useMutation({
        onMutate: () => {
            const toastId = toast.loading("Redirecting...");
            return { toastId };
        },
        onSuccess: (_, __, { toastId }) => {
            toast.success("Redirecting to cart", { id: toastId });
            window.location.href = "/mycart";
        },
        onError: (err, _, ctx) => {
            return handleClientError(err, ctx?.toastId);
        },
    });
    const { mutate: deleteItemFromCart, isPending: isRemoving } = trpc.general.orders.deleteItemFromCart.useMutation({
        onMutate: () => {
            const toastId = toast.loading("Redirecting...");
            return { toastId };
        },
        onSuccess: (_, __, { toastId }) => {
            toast.success("Removing Cart", { id: toastId });
        },
        onError: (err, _, ctx) => {
            return handleClientError(err, ctx?.toastId);
        },
    });
    const { mutate: initPayment, isPending: isPaymentInitializing } = useMutation({
        onMutate: () => {
            const toastId = toast.loading("Initializing payment...");
            return { toastId };
        },
        mutationFn: async ({ orderId }: { orderId: string }) => {
            if (!selectedShippingAddress) throw new Error("No shipping address selected");
            if (availableItems.length === 0) throw new Error("Cart is empty");

            const hasBalance = await getShiprocketBalance();
            if (!hasBalance) throw new Error("Cannot proceed with payment, please try again later");

            setIsProcessing(true);

            const options = createRazorpayPaymentOptions({
                orderId,
                deliveryAddress: selectedShippingAddress,
                prices: priceList,
                user,
                setIsProcessing,
                setIsProcessingModalOpen,
                setProcessingModalTitle,
                setProcessingModalDescription,
                setProcessingModalState,
                refetch: () => {},
                createdOrderId,
                deleteOrder,
                deleteItemFromCart
            });

            initializeRazorpayPayment(options);
        },
        onSuccess: (_data, _variables, context) => {
            toast.success("Payment initialized!", { id: context?.toastId });
        },
        onError: (err, _, ctx) => {
            setIsProcessing(false);
            return handleClientError(err, ctx?.toastId);
        },
    });

    const handlePayNow = () => {
        if (!userCart || !selectedShippingAddress) {
            toast.error("Cart or address missing");
            return;
        }

        createOrder({
            userId: user.id,
            coupon: appliedCoupon?.code,
            addressId: selectedShippingAddress.id,
            deliveryAmount: priceList.delivery.toString(),
            taxAmount: "0",
            totalAmount: priceList.total.toString(),
            discountAmount: priceList.discount.toString(),
            paymentMethod: null,
            totalItems: itemsCount,
            shiprocketOrderId: null,
            shiprocketShipmentId: null,
            items: availableItems.map((item) => ({
                price: item.variantId
                    ? (item.product.variants.find((v) => v.id === item.variantId)?.price ?? item.product.price ?? 0)
                    : (item.product.price ?? 0),
                brandId: item.product.brandId,
                productId: item.product.id,
                variantId: item.variantId,
                sku: item.variant?.nativeSku ?? item.product.nativeSku,
                quantity: item.quantity,
                categoryId: item.product.categoryId,
            })),
        });
    };

    return (
        <>
            <div {...props}>
                {/* Order Summary Section */}
                <div className="space-y-4">
                    <h2 className="text-xl font-semibold text-gray-800">
                        Price Details ({totalQuantity} {totalQuantity === 1 ? "item" : "items"})
                    </h2>
                    <div className="space-y-2">
                        <ul className="space-y-1">
                            {Object.entries(priceList)
                                .filter(([key]) => key !== "total")
                                .map(([key, value]) => (
                                    <li key={key} className="flex justify-between text-sm">
                                        <span>{convertValueToLabel(key)}:</span>
                                        <span>
                                            {key === "discount" && value > 0 ? "-" : ""}
                                            {formatPriceTag(+convertPaiseToRupees(value), true)}
                                        </span>
                                    </li>
                                ))}
                        </ul>
                        <Separator className="my-2" />
                        <div className="flex justify-between font-semibold text-destructive">
                            <span>Total:</span>
                            <span>{formatPriceTag(+convertPaiseToRupees(priceList.total), true)}</span>
                        </div>
                    </div>
                </div>

               {/* Payment Button Section */}
               <div className="space-y-3">
                    {/* <Button
                        size="lg"
                        className="w-full"
                        disabled={
                            isProcessing ||
                            isPaymentInitializing ||
                            isOrderCreating ||
                            order?.paymentStatus === "paid" ||
                            order?.status !== "pending" ||
                            unavailableItems.length > 0 ||
                            !selectedShippingAddress
                        }
                        variant={
                            unavailableItems.length > 0
                                ? "destructive"
                                : order?.paymentStatus === "pending"
                                ? "default"
                                : order?.paymentStatus === "paid"
                                ? "accent"
                                : order?.paymentStatus === "failed"
                                ? "destructive"
                                : "secondary"
                        }
                        onClick={handlePayNow}
                    >
                        {unavailableItems.length > 0
                            ? "Aborted"
                            : !selectedShippingAddress
                         ? "Select Address"
                          : order?.paymentStatus === "pending"
                            ? "Pay Now"
                            : order?.paymentStatus === "paid"
                            ? "Already Paid"
                            : order?.paymentStatus === "failed" && order?.status === "pending"
                            ? "Retry Payment"
                            : order?.paymentStatus === "refund_pending"
                            ? "Refund Pending"
                            : order?.paymentStatus === "refunded"
                            ? "Refunded"
                            : order?.paymentStatus === "refund_failed"
                            ? "Refund Failed"
                            : "Order Cancelled"}
                    </Button> */}
                        <Button
                        size="lg"
                        className="w-full"
                        disabled={
                            isProcessing ||
                            isPaymentInitializing ||
                            isOrderCreating ||
                            order?.paymentStatus === "paid" ||
                            order?.status !== "pending" ||
                            !selectedShippingAddress ||
                            availableItems.length === 0
                        }
                        variant={
                            availableItems.length === 0
                                ? "destructive"
                                : order?.paymentStatus === "pending"
                                ? "default"
                                : order?.paymentStatus === "paid"
                                ? "accent"
                                : order?.paymentStatus === "failed"
                                ? "destructive"
                                : "secondary"
                        }
                        onClick={handlePayNow}
                    >
                        {!selectedShippingAddress
                            ? "Select Address"
                            : availableItems.length === 0
                            ? "Cart is Empty"
                            : order?.paymentStatus === "pending"
                            ? "Pay Now"
                            : order?.paymentStatus === "paid"
                            ? "Already Paid"
                            : order?.paymentStatus === "failed" && order?.status === "pending"
                            ? "Retry Payment"
                            : order?.paymentStatus === "refund_pending"
                            ? "Refund Pending"
                            : order?.paymentStatus === "refunded"
                            ? "Refunded"
                            : order?.paymentStatus === "refund_failed"
                            ? "Refund Failed"
                            : "Order Cancelled"}
                    </Button>
                    <p className="text-xs text-gray-500 text-center">
                        By placing an order, you agree to our{" "}
                        <Link href="/terms" target="_blank" className="text-blue-600 hover:underline">
                            Terms of Service
                        </Link>{" "}
                        and{" "}
                        <Link href="/privacy" target="_blank" className="text-blue-600 hover:underline">
                            Privacy Policy
                        </Link>
                    </p>
                </div>
            </div>

            <PaymentProcessingModal
                isOpen={isProcessingModalOpen}
                setIsOpen={setIsProcessingModalOpen}
                title={processingModalTitle}
                description={processingModalDescription}
                state={processingModalState}
            />
        </>
    );
}