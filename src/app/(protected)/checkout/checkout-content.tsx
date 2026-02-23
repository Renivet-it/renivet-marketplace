"use client";

import { getShiprocketBalance } from "@/actions";
import { trackInitiateCheckoutCapi } from "@/actions/analytics";
import { PaymentProcessingModal } from "@/components/globals/modals";
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
import { fbEvent } from "@/lib/fbpixel";
import {
    createRazorpayPaymentOptions,
    initializeRazorpayPayment,
} from "@/lib/razorpay/payment";
import { useCartStore } from "@/lib/store/cart-store";
import { trpc } from "@/lib/trpc/client";
import {
    calculateTotalPriceWithCoupon,
    cn,
    convertPaiseToRupees,
    convertValueToLabel,
    formatPriceTag,
    getAbsoluteURL,
    handleClientError,
} from "@/lib/utils";
import { useMutation } from "@tanstack/react-query";
import {
    ArrowLeft,
    ChevronRight,
    CreditCard,
    MapPin,
    ShieldCheck,
    Ticket,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import ShippingAddress from "../mycart/Component/address-stepper/address-stepper";

const MAX_RETRIES = 3;
const RETRY_DELAY_BASE = 1000;

export default function CheckoutContent({ userId }: { userId: string }) {
    const router = useRouter();

    const [isProcessingModalOpen, setIsProcessingModalOpen] = useState(false);
    const [processingModalTitle, setProcessingModalTitle] = useState("");
    const [processingModalDescription, setProcessingModalDescription] =
        useState("");
    const [processingModalState, setProcessingModalState] = useState<
        "pending" | "success" | "error"
    >("pending");
    const [isProcessing, setIsProcessing] = useState(false);

    const [isCouponModalOpen, setIsCouponModalOpen] = useState(false);
    const [couponCode, setCouponCode] = useState("");

    const { selectedShippingAddress, appliedCoupon, setAppliedCoupon } =
        useCartStore();

    const { data: userCart } = trpc.general.users.cart.getCartForUser.useQuery(
        { userId },
        { enabled: !!userId }
    );

    const { data: user, isPending: isUserFetching } =
        trpc.general.users.currentUser.useQuery();

    const availableItems = useMemo(
        () =>
            userCart?.filter(
                (item) =>
                    item.product.isPublished &&
                    item.product.verificationStatus === "approved" &&
                    !item.product.isDeleted &&
                    item.product.isAvailable &&
                    (!!item.product.quantity
                        ? item.product.quantity > 0
                        : true) &&
                    item.product.isActive &&
                    (!item.variant ||
                        (item.variant &&
                            !item.variant.isDeleted &&
                            item.variant.quantity > 0)) &&
                    item.status
            ) || [],
        [userCart]
    );

    useEffect(() => {
        if (availableItems.length === 0 && userCart) {
            router.push("/mycart");
        }
    }, [availableItems.length, userCart, router]);

    const itemsCount = useMemo(
        () => availableItems.reduce((acc, item) => acc + item.quantity, 0),
        [availableItems]
    );

    const priceList = useMemo(() => {
        const items = availableItems.map((item) => {
            const itemPrice = item.variantId
                ? (item.product.variants?.find((v) => v.id === item.variantId)
                      ?.price ??
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
    }, [availableItems, appliedCoupon]);

    const { mutateAsync: createOrderIntent, isPending: isCreatingOrderIntent } =
        trpc.general.orderIntent.createIntent.useMutation();
    const { mutateAsync: linkOrderIntentToOrder } =
        trpc.general.orderIntent.linkToOrder.useMutation();

    const retryCreateOrder = async (
        orderDetails: any,
        attempt = 1
    ): Promise<any> => {
        try {
            return await createOrder(orderDetails);
        } catch (error) {
            if (attempt >= MAX_RETRIES) throw error;
            const delay = RETRY_DELAY_BASE * Math.pow(2, attempt - 1);
            await new Promise((resolve) => setTimeout(resolve, delay));
            return retryCreateOrder(orderDetails, attempt + 1);
        }
    };

    const { mutateAsync: createOrder, isPending: isOrderCreating } =
        trpc.general.orders.createOrder.useMutation({
            onError: (err) => {
                console.error("Error creating order:", err);
                handleClientError(err);
            },
        });

    const { mutate: deleteItemFromCart, isPending: isRemoving } =
        trpc.general.orders.deleteItemFromCart.useMutation({
            onError: (err, _, ctx) => handleClientError(err, ctx?.toastId),
        });

    const { mutate: validateCoupon, isPending: isValidatingCoupon } =
        trpc.general.coupons.validateCoupon.useMutation({
            onMutate: () => ({
                toastId: toast.loading("Validating coupon..."),
            }),
            onSuccess: (data, _, { toastId }) => {
                toast.success("Coupon applied successfully", { id: toastId });
                setAppliedCoupon(data);
                setIsCouponModalOpen(false);
                setCouponCode("");
            },
            onError: (err, _, ctx) => handleClientError(err, ctx?.toastId),
        });

    const { mutate: initPayment, isPending: isPaymentInitializing } =
        useMutation({
            onMutate: () => ({
                toastId: toast.loading("Initializing payment..."),
            }),
            mutationFn: async () => {
                if (!selectedShippingAddress)
                    throw new Error("No shipping address selected");
                if (availableItems.length === 0)
                    throw new Error("Cart is empty");
                if (!user) throw new Error("User data missing");

                const productsForIntent = availableItems.map((item) => ({
                    productId: item.product.id,
                    variantId: item.variantId || undefined,
                    quantity: item.quantity,
                    price: item.variantId
                        ? (item.product.variants?.find(
                              (v) => v.id === item.variantId
                          )?.price ??
                          item.product.price ??
                          0)
                        : (item.product.price ?? 0),
                    sku: item.variant?.nativeSku ?? item.product.nativeSku,
                }));

                const orderIntent = await createOrderIntent({
                    userId: user.id,
                    // @ts-ignore
                    products: productsForIntent,
                    totalAmount: priceList.total,
                });
                const intentId = orderIntent?.id;

                const razorpayOrderId = await getShiprocketBalance(
                    priceList.total
                );
                if (!razorpayOrderId)
                    throw new Error("Failed to create Razorpay order");

                setIsProcessing(true);

                const itemsByBrand = availableItems.reduce(
                    (acc, item) => {
                        const brandId = item.product.brandId;
                        if (!acc[brandId]) acc[brandId] = [];
                        acc[brandId].push(item);
                        return acc;
                    },
                    {} as Record<string, typeof availableItems>
                );

                const orderDetailsByBrand = Object.entries(itemsByBrand).map(
                    ([brandId, brandItems]) => {
                        const brandTotal = brandItems.reduce((acc, item) => {
                            const price = item.variantId
                                ? (item.product.variants?.find(
                                      (v) => v.id === item.variantId
                                  )?.price ??
                                  item.product.price ??
                                  0)
                                : (item.product.price ?? 0);
                            return acc + price * item.quantity;
                        }, 0);

                        return {
                            userId: user.id,
                            coupon: appliedCoupon?.code,
                            addressId: selectedShippingAddress.id,
                            deliveryAmount: priceList.delivery,
                            taxAmount: 0,
                            totalAmount: Number(brandTotal.toFixed(2)),
                            discountAmount: Number(
                                (
                                    priceList.discount *
                                    (brandTotal / priceList.items)
                                ).toFixed(2)
                            ),
                            paymentMethod: "razorpay",
                            totalItems: brandItems.reduce(
                                (acc, item) => acc + item.quantity,
                                0
                            ),
                            shiprocketOrderId: null,
                            shiprocketShipmentId: null,
                            items: brandItems.map((item) => ({
                                price: item.variantId
                                    ? (item.product.variants.find(
                                          (v) => v.id === item.variantId
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
                            })),
                            razorpayOrderId: razorpayOrderId,
                        };
                    }
                );

                const options = createRazorpayPaymentOptions({
                    orderId: razorpayOrderId,
                    deliveryAddress: selectedShippingAddress,
                    prices: priceList,
                    user,
                    setIsProcessing,
                    setIsProcessingModalOpen,
                    setProcessingModalTitle,
                    setProcessingModalDescription,
                    setProcessingModalState,
                    refetch: () => {},
                    createOrder: async (orderDetails: any) => {
                        try {
                            const createdOrder = await retryCreateOrder({
                                ...orderDetails,
                                intentId,
                            });
                            if (orderIntent?.id && createdOrder?.id) {
                                await linkOrderIntentToOrder({
                                    userId: user.id,
                                    intentId: orderIntent.id,
                                    orderId: createdOrder.id,
                                });
                            }
                            fbEvent("Purchase", {
                                value: orderDetails.totalAmount,
                                currency: "INR",
                                contents: orderDetails.items.map(
                                    (item: any) => ({
                                        id: item.productId,
                                        quantity: item.quantity,
                                        price: item.price,
                                    })
                                ),
                                content_type: "product",
                            });
                        } catch (error: any) {
                            throw new Error(
                                `Order creation failed: ${error.message}`
                            );
                        }
                    },
                    orderDetailsByBrand,
                    deleteItemFromCart,
                    orderIntentId: orderIntent.id,
                });

                initializeRazorpayPayment(options);
            },
            onSuccess: (_data, _variables, context) => {
                toast.success("Payment initialized!", { id: context?.toastId });
            },
            onError: (err, _, ctx) => {
                setIsProcessing(false);
                setProcessingModalTitle("Payment Failed");
                setProcessingModalDescription(
                    `Failed to initialize payment: ${err.message}`
                );
                setProcessingModalState("error");
                setIsProcessingModalOpen(true);
                return handleClientError(err, ctx?.toastId);
            },
        });

    const handlePayNow = () => {
        if (!userCart || !selectedShippingAddress)
            return toast.error("Cart or address missing");
        if (!user) return toast.error("User missing");

        const eventId = crypto.randomUUID();
        fbEvent(
            "InitiateCheckout",
            {
                content_ids: availableItems.map((item) => item.product.id),
                value: convertPaiseToRupees(priceList.total),
                currency: "INR",
                contents: availableItems.map((item) => ({
                    id: item.product.id,
                    name: item.product.title,
                    quantity: item.quantity,
                    price:
                        (item.variantId
                            ? (item.product.variants?.find(
                                  (v) => v.id === item.variantId
                              )?.price ??
                              item.product.price ??
                              0)
                            : (item.product.price ?? 0)) / 100,
                })),
                content_type: "product",
                num_items: itemsCount,
                em: user.emailAddresses?.[0]?.emailAddress,
                ph: selectedShippingAddress.phone,
                fn: user.firstName ?? undefined,
                ln: user.lastName ?? undefined,
                ct: selectedShippingAddress.city,
                st: selectedShippingAddress.state,
                zp: selectedShippingAddress.zip,
                external_id: user.id,
            },
            { eventId }
        );

        trackInitiateCheckoutCapi(
            eventId,
            {
                em: user?.emailAddresses?.[0]?.emailAddress,
                ph: selectedShippingAddress.phone,
                fn: user.firstName ?? undefined,
                ln: user.lastName ?? undefined,
                ct: selectedShippingAddress.city,
                st: selectedShippingAddress.state,
                zp: selectedShippingAddress.zip,
                external_id: user.id,
            },
            {
                content_ids: availableItems.map((item) => item.product.id),
                content_type: "product",
                value: parseFloat(convertPaiseToRupees(priceList.total)),
                currency: "INR",
                num_items: itemsCount,
            },
            getAbsoluteURL(window.location.href)
        ).catch((err) => console.error("CAPI InitiateCheckout Error:", err));

        initPayment();
    };

    return (
        <div className="pb-24">
            {/* Header */}
            <div className="sticky top-0 z-40 flex items-center justify-between border-b border-gray-200 bg-white px-4 py-3 shadow-sm">
                <button
                    onClick={() => router.back()}
                    className="flex size-8 items-center justify-center rounded-full bg-gray-50 hover:bg-gray-100"
                >
                    <ArrowLeft className="size-5 text-gray-700" />
                </button>
                <div className="text-center">
                    <h1 className="text-base font-bold leading-tight text-gray-900">
                        Review Order
                    </h1>
                </div>
                <div className="size-8" />
            </div>

            <div className="space-y-4 p-4">
                {/* Delivery Details */}
                <div className="mb-2 flex items-center gap-2">
                    <MapPin className="size-4 text-gray-500" />
                    <h2 className="text-sm font-semibold text-gray-700">
                        Delivery Details
                    </h2>
                </div>
                <div className="rounded-2xl border border-gray-50 bg-white p-4 shadow-sm">
                    <ShippingAddress className="border-none !bg-transparent p-0 shadow-none" />
                </div>

                {/* Coupons */}
                <div className="mb-2 mt-6 flex items-center gap-2">
                    <Ticket className="size-4 text-gray-500" />
                    <h2 className="text-sm font-semibold text-gray-700">
                        Coupons & Bank Offers
                    </h2>
                </div>
                <div className="flex items-center justify-between rounded-2xl border border-gray-50 bg-white p-4 shadow-sm">
                    <div>
                        {appliedCoupon ? (
                            <>
                                <h3 className="flex items-center gap-2 text-sm font-bold text-gray-900">
                                    {appliedCoupon.code} applied
                                    <span className="rounded bg-green-100 px-1.5 py-0.5 text-[10px] uppercase text-green-700">
                                        {appliedCoupon.discountType}
                                    </span>
                                </h3>
                                <p className="mt-0.5 text-xs text-gray-500">
                                    Extra savings with coupon
                                </p>
                            </>
                        ) : (
                            <>
                                <h3 className="text-sm font-semibold text-gray-900">
                                    Apply a Coupon
                                </h3>
                                <p className="mt-0.5 text-xs text-gray-500">
                                    Login to view exclusive offers
                                </p>
                            </>
                        )}
                    </div>
                    {appliedCoupon ? (
                        <button
                            onClick={() => setAppliedCoupon(null)}
                            className="text-xs font-semibold uppercase tracking-wide text-blue-600"
                        >
                            Remove
                        </button>
                    ) : (
                        <button
                            onClick={() => setIsCouponModalOpen(true)}
                            className="flex items-center text-xs font-semibold uppercase tracking-wide text-blue-600 hover:underline"
                        >
                            Apply <ChevronRight className="ml-0.5 size-3" />
                        </button>
                    )}
                </div>

                {/* Price Details */}
                <div className="mb-2 mt-6 flex items-center gap-2">
                    <Icons.Tag className="size-4 text-gray-500" />
                    <h2 className="text-sm font-semibold text-gray-700">
                        Price Details
                    </h2>
                </div>
                <div className="space-y-3 rounded-2xl border border-gray-50 bg-white p-4 shadow-sm">
                    <div className="flex justify-between text-sm font-medium text-gray-600">
                        <span>Total MRP</span>
                        <span>
                            {formatPriceTag(
                                +convertPaiseToRupees(
                                    priceList.items + priceList.discount
                                ),
                                true
                            )}
                        </span>
                    </div>
                    {priceList.discount > 0 && (
                        <div className="flex justify-between text-sm font-medium text-green-600">
                            <span>Discount on MRP</span>
                            <span>
                                -{" "}
                                {formatPriceTag(
                                    +convertPaiseToRupees(priceList.discount),
                                    true
                                )}
                            </span>
                        </div>
                    )}
                    {appliedCoupon && (
                        <div className="flex justify-between text-sm font-medium text-green-600">
                            <span>Coupon Discount</span>
                            <span>
                                -{" "}
                                {formatPriceTag(
                                    +convertPaiseToRupees(priceList.coupon),
                                    true
                                )}
                            </span>
                        </div>
                    )}
                    <div className="flex justify-between text-sm font-medium text-gray-600">
                        <span>Platform Fee</span>
                        <span>{formatPriceTag(0, true)}</span>
                    </div>

                    <Separator className="my-3" />

                    <div className="flex justify-between text-base font-bold text-gray-900">
                        <span>Total Amount</span>
                        <span>
                            {formatPriceTag(
                                +convertPaiseToRupees(priceList.total),
                                true
                            )}
                        </span>
                    </div>
                </div>
            </div>

            {/* Sticky Bottom Bar */}
            <div className="fixed bottom-0 left-0 right-0 z-50 border-t border-gray-200 bg-white p-3 shadow-[0_-4px_6px_-1px_rgb(0,0,0,0.05)]">
                <div className="mx-auto max-w-2xl space-y-3">
                    <div className="flex items-center justify-between rounded-xl border border-gray-100 bg-white p-2 px-3 shadow-sm">
                        <div className="flex items-center gap-3">
                            <div className="rounded-md bg-gray-100 p-1">
                                <CreditCard className="size-5 text-gray-700" />
                            </div>
                            <div className="text-xs">
                                <p className="font-semibold text-gray-900">
                                    Razorpay Secure
                                </p>
                                <p className="line-clamp-1 text-gray-500">
                                    UPI, Credit/Debit Card, NetBanking
                                </p>
                            </div>
                        </div>
                        <ShieldCheck className="size-5 text-green-600" />
                    </div>

                    <Button
                        size="lg"
                        className="h-12 w-full rounded-xl bg-[#fca5cb] text-lg font-bold text-white shadow-none hover:bg-[#eb8cb6]"
                        onClick={handlePayNow}
                        disabled={
                            isProcessing ||
                            isPaymentInitializing ||
                            isOrderCreating ||
                            isCreatingOrderIntent ||
                            isRemoving ||
                            !selectedShippingAddress ||
                            availableItems.length === 0
                        }
                    >
                        {isProcessing || isPaymentInitializing
                            ? "Processing..."
                            : `Confirm & Pay ${formatPriceTag(+convertPaiseToRupees(priceList.total), true)}`}
                    </Button>
                </div>
            </div>

            <Dialog
                open={isCouponModalOpen}
                onOpenChange={(val) => {
                    setIsCouponModalOpen(val);
                    if (!val) setCouponCode("");
                }}
            >
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Apply Coupon</DialogTitle>
                    </DialogHeader>
                    <div className="flex items-center gap-2">
                        <Input
                            value={couponCode}
                            onChange={(e) => setCouponCode(e.target.value)}
                            disabled={isValidatingCoupon}
                            placeholder="Enter Code"
                        />
                        <Button
                            onClick={() =>
                                validateCoupon({
                                    code: couponCode,
                                    totalAmount: priceList.total,
                                })
                            }
                            disabled={isValidatingCoupon}
                        >
                            Apply
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>

            <PaymentProcessingModal
                isOpen={isProcessingModalOpen}
                setIsOpen={setIsProcessingModalOpen}
                title={processingModalTitle}
                description={processingModalDescription}
                state={processingModalState}
            />
        </div>
    );
}
