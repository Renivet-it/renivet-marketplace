"use client";

import { getShiprocketBalance } from "@/actions";
import {
    trackInitiateCheckoutCapi,
    trackPurchaseCapi,
} from "@/actions/analytics";
// Impoert actions
import { PaymentProcessingModal } from "@/components/globals/modals";
import { Button } from "@/components/ui/button-general";
import { Separator } from "@/components/ui/separator";
// import { orderQueries } from "@/lib/db/queries"; // No longer needed directly for client-side intent creation
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
import { CachedUser, OrderWithItemAndBrand } from "@/lib/validations";
import { useMutation } from "@tanstack/react-query";
import { CreditCard, Leaf, Shield, Truck } from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";
import { toast } from "sonner";

// Retry configuration
const MAX_RETRIES = 3;
const RETRY_DELAY_BASE = 1000; // 1 second base delay

interface PageProps extends GenericProps {
    initialData: OrderWithItemAndBrand;
    user: CachedUser;
}

export function OrderPage({
    className,
    initialData,
    user,
    ...props
}: PageProps) {
    const [isProcessingModalOpen, setIsProcessingModalOpen] = useState(false);
    const [processingModalTitle, setProcessingModalTitle] = useState("");
    const [processingModalDescription, setProcessingModalDescription] =
        useState("");
    const [processingModalState, setProcessingModalState] = useState<
        "pending" | "success" | "error"
    >("pending");
    const [isProcessing, setIsProcessing] = useState(false);

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

    const unavailableItems =
        userCart?.filter(
            (item) => !availableItems.map((i) => i.id).includes(item.id)
        ) || [];
    console.log("Available Items:", availableItems);
    console.log("Unavailable Items:", unavailableItems);

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

        const priceDetails = calculateTotalPriceWithCoupon(
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
        console.log("Price List:", priceDetails);
        return priceDetails;
    }, [availableItems, appliedCoupon]);

    const totalQuantity = availableItems.reduce(
        (acc, item) => acc + item.quantity,
        0
    );

    // Use tRPC mutation for creating order intent
    const { mutateAsync: createOrderIntent, isPending: isCreatingOrderIntent } =
        trpc.general.orderIntent.createIntent.useMutation();
    const { mutateAsync: linkOrderIntentToOrder } =
        trpc.general.orderIntent.linkToOrder.useMutation();

    // Retry function with exponential backoff
    const retryCreateOrder = async (
        orderDetails: any,
        attempt = 1
    ): Promise<any> => {
        try {
            return await createOrder(orderDetails);
        } catch (error) {
            if (attempt >= MAX_RETRIES) {
                throw error;
            }
            const delay = RETRY_DELAY_BASE * Math.pow(2, attempt - 1);
            console.log(
                `Retrying order creation (attempt ${attempt + 1}/${MAX_RETRIES}) after ${delay}ms`
            );
            await new Promise((resolve) => setTimeout(resolve, delay));
            return retryCreateOrder(orderDetails, attempt + 1);
        }
    };

    const { mutate: createOrder, isPending: isOrderCreating } =
        trpc.general.orders.createOrder.useMutation({
            onSuccess: (newOrder) => {
                console.log("Successfully created order:", newOrder);
            },
            onError: (err) => {
                console.error("Error creating order:", {
                    message: err.message,
                    shape: err.shape,
                });
                handleClientError(err);
            },
        });

    const { mutate: deleteItemFromCart, isPending: isRemoving } =
        trpc.general.orders.deleteItemFromCart.useMutation({
            onMutate: () => {
                const toastId = toast.loading("Clearing cart...");
                return { toastId };
            },
            onSuccess: (_, __, { toastId }) => {
                toast.success("Cart cleared", { id: toastId });
            },
            onError: (err, _, ctx) => {
                console.error("Error clearing cart:", {
                    message: err.message,
                    shape: err.shape,
                });

                return handleClientError(err, ctx?.toastId);
            },
        });

    const { mutate: initPayment, isPending: isPaymentInitializing } =
        useMutation({
            onMutate: () => {
                const toastId = toast.loading("Initializing payment...");
                return { toastId };
            },
            mutationFn: async () => {
                if (!selectedShippingAddress)
                    throw new Error("No shipping address selected");
                if (availableItems.length === 0)
                    throw new Error("Cart is empty");

                console.log(
                    "Initiating payment with total amount (in paise):",
                    priceList.total
                );

                // Prepare product details for order intent
                // @ts-ignore
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
                console.log("Order intent processed:", productsForIntent);
                console.log("Order intent user :", user);

                // Create order intent before initiating payment using tRPC mutation
                const orderIntent = await createOrderIntent({
                    userId: user.id,
                    //@ts-ignore
                    products: productsForIntent,
                    totalAmount: priceList.total,
                });
                const intentId = orderIntent?.id;

                console.log("Order intent created:", orderIntent);

                // Create a single Razorpay order for the total amount
                const razorpayOrderId = await getShiprocketBalance(
                    priceList.total
                );
                if (!razorpayOrderId)
                    throw new Error("Failed to create Razorpay order");

                console.log("Razorpay order ID created:", razorpayOrderId);

                setIsProcessing(true);

                // Group items by brand to create multiple orders after payment
                const itemsByBrand = availableItems.reduce(
                    (acc, item) => {
                        const brandId = item.product.brandId;
                        if (!acc[brandId]) {
                            acc[brandId] = [];
                        }
                        acc[brandId].push(item);
                        return acc;
                    },
                    {} as Record<string, typeof availableItems>
                );

                console.log("Items grouped by brand:", itemsByBrand);

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

                        const orderDetails = {
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

                        return orderDetails;
                    }
                );

                console.log(
                    "Order details by brand before payment:",
                    orderDetailsByBrand
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
                                intentId, // ✅ Pass intentId to backend
                            }); // After successful order creation, link the intent to the order
                            if (orderIntent?.id && createdOrder?.id) {
                                // Assuming createdOrder will have an ID after creation
                                await linkOrderIntentToOrder({
                                    userId: user.id,
                                    intentId: orderIntent.id,
                                    orderId: createdOrder.id,
                                });
                                console.log(
                                    `Intent ${orderIntent.id} linked to order ${createdOrder.id}`
                                );
                            }
                            console.log(orderDetails, "orderDetails for fb");

                            // ✅ Fire Facebook Pixel Purchase Event here
                            fbEvent("Purchase", {
                                value: orderDetails.totalAmount, // Pass actual total amount
                                currency: "INR",
                                contents: orderDetails.items.map(
                                    (item: any) => ({
                                        id: item.productId,
                                        // name: item.product.title, // ✅ Include product title
                                        quantity: item.quantity,
                                        price: item.price,
                                    })
                                ),
                                content_type: "product",
                            });
                        } catch (error: any) {
                            console.error(
                                "Failed to create order after retries:",
                                error
                            );
                            throw new Error(
                                `Order creation failed after ${MAX_RETRIES} attempts: ${error.message}`
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
                console.error("Payment initialization failed:", {
                    message: err.message,
                    stack: err.stack,
                });
                setIsProcessing(false);
                setProcessingModalTitle("Payment Initialization Failed");
                setProcessingModalDescription(
                    `Failed to initialize payment: ${err.message}. Please try again.`
                );
                setProcessingModalState("error");
                setIsProcessingModalOpen(true);
                return handleClientError(err, ctx?.toastId);
            },
        });

    const handlePayNow = () => {
        if (!userCart || !selectedShippingAddress) {
            toast.error("Cart or address missing");
            return;
        }
        // 🔹 Generate Event ID
        const eventId = crypto.randomUUID();

        // 🔹 FB Pixel (Client)
        fbEvent(
            "InitiateCheckout",
            {
                content_ids: availableItems.map((item) => item.product.id),
                value: convertPaiseToRupees(priceList.total), // Convert paise to rupees
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
                            : (item.product.price ?? 0)) / 100, // convert to rupees
                })),
                content_type: "product",
                num_items: totalQuantity, // Number of items
                // User Data
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

        // 🔹 CAPI (Server)
        const userData = {
            em: user?.emailAddresses?.[0]?.emailAddress,
            ph: selectedShippingAddress.phone,
            fn: user.firstName ?? undefined,
            ln: user.lastName ?? undefined,
            ct: selectedShippingAddress.city,
            st: selectedShippingAddress.state,
            zp: selectedShippingAddress.zip,
            external_id: user.id,
            fb_login_id: user.externalAccounts.find(
                (acc) => acc.provider === "oauth_facebook"
            )?.externalId,
        };

        trackInitiateCheckoutCapi(
            eventId,
            userData,
            {
                content_ids: availableItems.map((item) => item.product.id),
                content_type: "product",
                value: parseFloat(convertPaiseToRupees(priceList.total)),
                currency: "INR",
                num_items: totalQuantity,
            },
            getAbsoluteURL(window.location.href)
        ).catch((err) => console.error("CAPI InitiateCheckout Error:", err));

        initPayment();
    };

    return (
        <>
            <div {...props}>
                <div className="space-y-4 rounded-xl border border-gray-200 bg-white p-5">
                    <h2 className="text-base font-semibold text-gray-900">
                        Price Details ({totalQuantity}{" "}
                        {totalQuantity === 1 ? "item" : "items"})
                    </h2>
                    <div className="space-y-2">
                        <ul className="space-y-1.5">
                            {Object.entries(priceList)
                                .filter(
                                    ([key]) =>
                                        key !== "total" && key !== "delivery"
                                )
                                .map(([key, value]) => (
                                    <li
                                        key={key}
                                        className="flex justify-between text-sm text-gray-600"
                                    >
                                        <span>{convertValueToLabel(key)}</span>
                                        <span>
                                            {key === "discount" && value > 0
                                                ? "-"
                                                : ""}
                                            {formatPriceTag(
                                                +convertPaiseToRupees(value),
                                                true
                                            )}
                                        </span>
                                    </li>
                                ))}
                            <li className="flex justify-between text-sm">
                                <span className="text-gray-600">Delivery</span>
                                <span className="font-medium text-blue-600">
                                    FREE
                                </span>
                            </li>
                        </ul>
                        <Separator className="my-2" />
                        <div className="flex items-center justify-between pt-1">
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
                    </div>
                </div>

                {/* Trust badges */}
                <div className="mt-3 flex items-center justify-center gap-4">
                    <div className="flex items-center gap-1.5 text-[11px] text-gray-500">
                        <Shield className="size-3.5 text-blue-600" />
                        <span>Secure Payment</span>
                    </div>
                    <div className="h-3 w-px bg-gray-200" />
                    <div className="flex items-center gap-1.5 text-[11px] text-gray-500">
                        <Truck className="size-3.5 text-blue-600" />
                        <span>Free Delivery</span>
                    </div>
                    <div className="h-3 w-px bg-gray-200" />
                    <div className="flex items-center gap-1.5 text-[11px] text-gray-500">
                        <Leaf className="size-3.5 text-blue-600" />
                        <span>Eco Friendly</span>
                    </div>
                </div>

                <div className="mt-4 space-y-3">
                    <Button
                        size="lg"
                        className="group w-full rounded-xl bg-[#95b6da] text-sm font-semibold text-white shadow-sm transition-all hover:bg-[#82a3c7] hover:shadow-md"
                        disabled={
                            isProcessing ||
                            isPaymentInitializing ||
                            isOrderCreating ||
                            isRemoving ||
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
                                  : order?.paymentStatus === "failed" &&
                                      order?.status === "pending"
                                    ? "Retry Payment"
                                    : order?.paymentStatus === "refund_pending"
                                      ? "Refund Pending"
                                      : order?.paymentStatus === "refunded"
                                        ? "Refunded"
                                        : order?.paymentStatus ===
                                            "refund_failed"
                                          ? "Refund Failed"
                                          : "Order Cancelled"}
                    </Button>
                    <p className="text-center text-xs text-gray-500">
                        By placing an order, you agree to our{" "}
                        <Link
                            href="/terms"
                            target="_blank"
                            className="text-blue-600 hover:underline"
                        >
                            Terms of Service
                        </Link>{" "}
                        and{" "}
                        <Link
                            href="/privacy"
                            target="_blank"
                            className="text-blue-600 hover:underline"
                        >
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
