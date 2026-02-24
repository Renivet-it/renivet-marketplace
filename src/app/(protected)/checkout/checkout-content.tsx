"use client";

import { getShiprocketBalance } from "@/actions";
import { trackInitiateCheckoutCapi } from "@/actions/analytics";
import { PaymentProcessingModal } from "@/components/globals/modals";
import { Icons } from "@/components/icons";
import { Button } from "@/components/ui/button-general";
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
    Clock,
    CreditCard,
    Loader2,
    MapPin,
    ShieldCheck,
    Tag,
    Ticket,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import ShippingAddress from "../mycart/Component/address-stepper/address-stepper";
import { OrderProductCard } from "../mycart/Component/payment-stepper/ordered-product-card-view";

const MAX_RETRIES = 3;
const RETRY_DELAY_BASE = 1000;

export default function CheckoutContent({ userId }: { userId: string }) {
    const router = useRouter();
    const searchParams = useSearchParams();

    const isBuyNow = searchParams.get("buy_now") === "true";
    const buyNowItemId = searchParams.get("item");
    const buyNowVariantId = searchParams.get("variant");
    const buyNowQty = searchParams.get("qty");

    const [isProcessingModalOpen, setIsProcessingModalOpen] = useState(false);
    const [processingModalTitle, setProcessingModalTitle] = useState("");
    const [processingModalDescription, setProcessingModalDescription] =
        useState("");
    const [processingModalState, setProcessingModalState] = useState<
        "pending" | "success" | "error"
    >("pending");
    const [isProcessing, setIsProcessing] = useState(false);

    const [isCouponExpanded, setIsCouponExpanded] = useState(false);
    const [couponCode, setCouponCode] = useState("");

    const { selectedShippingAddress, appliedCoupon, setAppliedCoupon } =
        useCartStore();

    const {
        data: userCart,
        isLoading: isCartLoading,
        refetch: refetchCart,
    } = trpc.general.users.cart.getCartForUser.useQuery(
        { userId },
        { enabled: !!userId }
    );

    const { data: user, isPending: isUserFetching } =
        trpc.general.users.currentUser.useQuery();

    const { data: activeCoupons, isLoading: isCouponsLoading } =
        trpc.general.coupons.getActiveCoupons.useQuery(undefined, {
            enabled: isCouponExpanded,
        });

    const availableItems = useMemo(() => {
        if (!userCart) return [];

        const filtered = userCart.filter(
            (item) =>
                item.product.isPublished &&
                item.product.verificationStatus === "approved" &&
                !item.product.isDeleted &&
                item.product.isAvailable &&
                (!!item.product.quantity ? item.product.quantity > 0 : true) &&
                item.product.isActive &&
                (!item.variant ||
                    (item.variant &&
                        !item.variant.isDeleted &&
                        item.variant.quantity > 0)) &&
                item.status
        );

        if (isBuyNow && buyNowItemId) {
            const buyNowItem = filtered.find(
                (item) =>
                    item.productId === buyNowItemId &&
                    (buyNowVariantId
                        ? item.variantId === buyNowVariantId
                        : !item.variantId)
            );
            if (!buyNowItem) return [];
            const qty = parseInt(buyNowQty || "1", 10);
            return [{ ...buyNowItem, quantity: qty }];
        }

        return filtered;
    }, [userCart, isBuyNow, buyNowItemId, buyNowQty, buyNowVariantId]);

    useEffect(() => {
        if (
            !isBuyNow &&
            !isCartLoading &&
            availableItems.length === 0 &&
            userCart
        ) {
            router.push("/mycart");
        }
    }, [availableItems.length, userCart, router, isBuyNow, isCartLoading]);

    useEffect(() => {
        if (!(window as any).Razorpay) {
            const script = document.createElement("script");
            script.src = "https://checkout.razorpay.com/v1/checkout.js";
            script.async = true;
            document.body.appendChild(script);
        }
    }, []);

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

    const { mutate: removeProduct, isPending: isRemovingProduct } =
        trpc.general.users.cart.removeProductInCart.useMutation({
            onMutate: () => ({
                toastId: toast.loading("Removing product from cart..."),
            }),
            onSuccess: (_, __, { toastId }) => {
                toast.success("Product removed from cart", { id: toastId });
                refetchCart();
            },
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
                    deleteItemFromCart: isBuyNow
                        ? undefined
                        : deleteItemFromCart,
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
                {/* Order Items */}
                <div className="mb-6 rounded-2xl border border-gray-50 bg-white p-4 shadow-sm">
                    <OrderProductCard
                        orderItems={availableItems as any}
                        className="border border-gray-100 shadow-none"
                        isRemoving={isRemovingProduct}
                        onRemove={
                            !isBuyNow
                                ? (item: any) =>
                                      removeProduct({
                                          userId,
                                          productId: item.product.id,
                                          variantId: item.variantId,
                                      })
                                : undefined
                        }
                    />
                </div>

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
                        Coupons & Offers
                    </h2>
                </div>
                <div className="overflow-hidden rounded-2xl border border-gray-50 bg-white shadow-sm">
                    {/* Header row */}
                    <button
                        onClick={() => setIsCouponExpanded((v) => !v)}
                        className="flex w-full items-center justify-between p-4"
                    >
                        <div className="text-left">
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
                                        View available coupons
                                    </p>
                                </>
                            )}
                        </div>
                        <ChevronRight
                            className={cn(
                                "size-4 text-gray-400 transition-transform duration-200",
                                isCouponExpanded && "rotate-90"
                            )}
                        />
                    </button>

                    {/* Inline expandable coupon list */}
                    {isCouponExpanded && (
                        <div className="border-t border-gray-100 p-4 pt-3">
                            {/* Applied coupon remove button */}
                            {appliedCoupon && (
                                <div className="mb-3 flex items-center justify-between rounded-lg border border-green-200 bg-green-50/60 px-3 py-2">
                                    <span className="text-xs font-semibold text-green-700">
                                        {appliedCoupon.code} — saving{" "}
                                        {formatPriceTag(
                                            +convertPaiseToRupees(
                                                priceList.coupon
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
                            <div className="mb-3 flex items-center gap-2 rounded-xl border border-dashed border-gray-300 bg-gray-50/50 p-2.5">
                                <Input
                                    value={couponCode}
                                    onChange={(e) =>
                                        setCouponCode(
                                            e.target.value.toUpperCase()
                                        )
                                    }
                                    disabled={isValidatingCoupon}
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
                                        isValidatingCoupon || !couponCode.trim()
                                    }
                                    className="h-9 shrink-0 bg-blue-600 px-4 hover:bg-blue-700"
                                >
                                    {isValidatingCoupon ? (
                                        <Loader2 className="size-4 animate-spin" />
                                    ) : (
                                        "Apply"
                                    )}
                                </Button>
                            </div>

                            {/* Coupon Cards */}
                            <div className="space-y-2.5">
                                {isCouponsLoading ? (
                                    <div className="flex items-center justify-center py-8">
                                        <Loader2 className="size-5 animate-spin text-gray-400" />
                                    </div>
                                ) : !activeCoupons?.length ? (
                                    <div className="py-8 text-center">
                                        <Ticket className="mx-auto size-8 text-gray-300" />
                                        <p className="mt-1.5 text-xs text-gray-500">
                                            No coupons available right now
                                        </p>
                                    </div>
                                ) : (
                                    activeCoupons.map((coupon) => {
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
                                                        {/* Code Badge */}
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

                                                        {/* Discount Info */}
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

                                                        {/* Description */}
                                                        {coupon.description && (
                                                            <p className="mt-0.5 text-xs text-gray-500">
                                                                {
                                                                    coupon.description
                                                                }
                                                            </p>
                                                        )}

                                                        {/* Meta */}
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

                                                    {/* Apply / Remove */}
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
                                                                    isValidatingCoupon
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
                        className="h-12 w-full rounded-xl bg-[#84abd6] text-lg font-bold text-white shadow-none hover:bg-[#6d96c2]"
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
