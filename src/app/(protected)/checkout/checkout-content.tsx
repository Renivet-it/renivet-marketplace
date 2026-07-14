"use client";
import { Spinner } from "@/components/ui/spinner";

import { getShiprocketBalance } from "@/actions";
import {
    trackInitiateCheckoutCapi,
    trackPurchaseCapi,
} from "@/actions/analytics";
import { POSTHOG_EVENTS } from "@/config/posthog";
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
    Gift,
    MapPin,
    ShieldCheck,
    Tag,
    Ticket,
    Truck,
} from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { usePostHog } from "posthog-js/react";
import { toast } from "sonner";
import ShippingAddress from "../mycart/Component/address-stepper/address-stepper";
import { OrderProductCard } from "../mycart/Component/payment-stepper/ordered-product-card-view";

const MAX_RETRIES = 3;
const RETRY_DELAY_BASE = 1000;
const AUTO_COUPON_CODE = "TRYNEW20";
const AUTO_COUPON_MIN_CART_VALUE = 3000 * 100;

export default function CheckoutContent({ userId }: { userId: string }) {
    const router = useRouter();
    const searchParams = useSearchParams();
    const posthog = usePostHog();

    const isBuyNow = searchParams.get("buy_now") === "true";
    const buyNowItemId = searchParams.get("item");
    const buyNowVariantId = searchParams.get("variant");
    const buyNowQty = searchParams.get("qty");
    const isSwapReward = searchParams.get("swap_reward") === "true";
    const rewardRedemptionId = searchParams.get("redemption");

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
    const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<
        "online" | "cod"
    >("online");

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

    const { data: user } = trpc.general.users.currentUser.useQuery();

    const rewardCheckoutQuery =
        trpc.general.swapRewards.getRewardCheckoutItem.useQuery(
            {
                redemptionId: rewardRedemptionId ?? "",
            },
            {
                enabled: isSwapReward && !!rewardRedemptionId,
            }
        );

    const activeRewardCartItemQuery =
        trpc.general.swapRewards.getActiveRewardCartItem.useQuery(undefined, {
            enabled: !isSwapReward,
        });

    const { data: activeCoupons, isLoading: isCouponsLoading } =
        trpc.general.coupons.getActiveCoupons.useQuery(undefined, {
            enabled: isCouponExpanded,
        });

    const availableItems = useMemo(() => {
        if (isSwapReward) {
            const checkoutItem = rewardCheckoutQuery.data?.selection;
            if (!checkoutItem) return [];

            return [
                {
                    id: `reward-${checkoutItem.product.id}-${checkoutItem.variant?.id ?? "default"}`,
                    productId: checkoutItem.product.id,
                    variantId: checkoutItem.variant?.id ?? null,
                    quantity: 1,
                    product: checkoutItem.product,
                    variant: checkoutItem.variant,
                    status: true,
                    isSwapRewardItem: true,
                    rewardValue: checkoutItem.rewardValue,
                    swapRewardRedemptionId: rewardCheckoutQuery.data?.redemption.id,
                    createdAt:
                        checkoutItem.product.createdAt ?? new Date().toISOString(),
                },
            ];
        }

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

        const rewardCartSelection = activeRewardCartItemQuery.data?.selection;
        const rewardCartRedemption = activeRewardCartItemQuery.data?.redemption;

        if (!rewardCartSelection || !rewardCartRedemption) {
            return filtered;
        }

        return [
            {
                id: `reward-cart-${rewardCartSelection.product.id}-${rewardCartSelection.variant?.id ?? "default"}`,
                productId: rewardCartSelection.product.id,
                variantId: rewardCartSelection.variant?.id ?? null,
                quantity: 1,
                product: rewardCartSelection.product,
                variant: rewardCartSelection.variant,
                status: true,
                isSwapRewardItem: true,
                rewardValue: rewardCartSelection.rewardValue,
                swapRewardRedemptionId: rewardCartRedemption.id,
                createdAt:
                    rewardCartSelection.product.createdAt ??
                    new Date().toISOString(),
            },
            ...filtered,
        ];
    }, [
        userCart,
        isBuyNow,
        buyNowItemId,
        buyNowQty,
        buyNowVariantId,
        isSwapReward,
        rewardCheckoutQuery.data,
        activeRewardCartItemQuery.data,
    ]);

    const hasRewardItem = availableItems.some(
        (item: any) => item.isSwapRewardItem
    );
    const hasPaidItems = availableItems.some(
        (item: any) => !item.isSwapRewardItem
    );
    const isRewardOnlyCheckout = hasRewardItem && !hasPaidItems;

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
            // Check if at least one cart item matches all non-null coupon filters
            return availableItems.some((item) => {
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
    }, [activeCoupons, availableItems]);

    useEffect(() => {
        if (
            !isSwapReward &&
            !isBuyNow &&
            !isCartLoading &&
            availableItems.length === 0 &&
            userCart &&
            !activeRewardCartItemQuery.isLoading
        ) {
            router.push("/mycart");
        }
    }, [
        availableItems.length,
        userCart,
        router,
        isBuyNow,
        isCartLoading,
        isSwapReward,
        activeRewardCartItemQuery.isLoading,
    ]);

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
        if (isSwapReward) {
            const rewardValue = rewardCheckoutQuery.data?.selection.rewardValue ?? 0;
            return {
                items: rewardValue,
                total: 0,
                discount: rewardValue,
                couponDiscount: rewardValue,
                productDiscount: 0,
                delivery: 0,
            };
        }

        const items = availableItems.map((item) => {
            const checkoutItem = item as any;
            const itemPrice = checkoutItem.isSwapRewardItem
                ? 0
                : checkoutItem.variantId
                ? (checkoutItem.product.variants?.find((v: any) => v.id === checkoutItem.variantId)
                      ?.price ??
                  checkoutItem.product.price ??
                  0)
                : (checkoutItem.product.price ?? 0);

            const compareAtPrice = checkoutItem.variantId
                ? (checkoutItem.product.variants?.find((v: any) => v.id === checkoutItem.variantId)
                      ?.compareAtPrice ??
                  checkoutItem.product.compareAtPrice ??
                  itemPrice)
                : (checkoutItem.product.compareAtPrice ?? itemPrice);

            return {
                price: itemPrice,
                compareAtPrice: compareAtPrice,
                quantity: checkoutItem.quantity,
                categoryId: checkoutItem.product.categoryId,
                subCategoryId: checkoutItem.product.subcategoryId,
                productTypeId: checkoutItem.product.productTypeId,
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
    }, [availableItems, appliedCoupon, isSwapReward, rewardCheckoutQuery.data]);

    const checkoutTaxLines = useMemo(
        () =>
            availableItems.map((item) => {
                const checkoutItem = item as any;
                return {
                lineId: String(checkoutItem.id),
                hsnCode: checkoutItem.product.hsCode ?? "",
                unitPricePaise: checkoutItem.isSwapRewardItem
                    ? 0
                    : checkoutItem.variantId
                    ? (checkoutItem.product.variants?.find((v: any) => v.id === checkoutItem.variantId)?.price ??
                      checkoutItem.product.price ??
                      0)
                    : (checkoutItem.product.price ?? 0),
                quantity: checkoutItem.quantity,
            };
            }),
        [availableItems]
    );

    const checkoutTaxQuery = trpc.general.orders.previewCheckoutTax.useQuery(
        {
            lines: checkoutTaxLines,
            discountAmountPaise: priceList.discount,
        },
        {
            enabled: !isSwapReward && checkoutTaxLines.length > 0,
        }
    );

    const taxLinesById = useMemo(
        () =>
            new Map(
                (checkoutTaxQuery.data?.lines ?? []).map((line) => [line.lineId, line])
            ),
        [checkoutTaxQuery.data]
    );
    const gstAmountPaise = isSwapReward ? 0 : checkoutTaxQuery.data?.totalTaxPaise ?? 0;
    const payableTotalPaise = isSwapReward ? priceList.total : priceList.total + gstAmountPaise;

    const cartValue = useMemo(
        () =>
            isSwapReward
                ? rewardCheckoutQuery.data?.selection.rewardValue ?? 0
                :
            availableItems.reduce((acc, item) => {
                const checkoutItem = item as any;
                const itemPrice = checkoutItem.isSwapRewardItem
                    ? 0
                    : checkoutItem.variantId
                    ? (checkoutItem.product.variants?.find(
                          (v: any) => v.id === checkoutItem.variantId
                      )?.price ??
                      checkoutItem.product.price ??
                      0)
                    : (checkoutItem.product.price ?? 0);
                return acc + itemPrice * checkoutItem.quantity;
            }, 0),
        [availableItems, isSwapReward, rewardCheckoutQuery.data]
    );

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
            onSuccess: (order, variables) => {
                const totalAmountPaise = Number(variables.totalAmount ?? 0);
                const orderIds = Array.isArray(order)
                    ? order.map((entry) => entry.id)
                    : [];
                const eventId =
                    typeof crypto !== "undefined" && crypto.randomUUID
                        ? crypto.randomUUID()
                        : "evt_" +
                          new Date().getTime() +
                          "_" +
                          Math.random().toString(36).substr(2, 9);

                posthog?.capture(POSTHOG_EVENTS.COMMERCE.PURCHASE_COMPLETED, {
                    order_ids: orderIds,
                    product_ids: variables.items.map((item: any) => item.productId),
                    brand_ids: variables.items.map((item: any) => item.brandId),
                    total_amount: Number(convertPaiseToRupees(totalAmountPaise)),
                    currency: "INR",
                    total_items: variables.totalItems,
                    payment_method: variables.paymentMethod,
                });

                fbEvent(
                    "Purchase",
                    {
                        value: totalAmountPaise,
                        currency: "INR",
                        content_type: "product",
                        content_ids: variables.items.map(
                            (item: any) => item.productId
                        ),
                        num_items: variables.totalItems,
                    },
                    { eventId }
                );

                trackPurchaseCapi(
                    eventId,
                    {
                        em: user?.email,
                        ph: selectedShippingAddress?.phone,
                        fn: user?.firstName ?? undefined,
                        ln: user?.lastName ?? undefined,
                        ct: selectedShippingAddress?.city,
                        st: selectedShippingAddress?.state,
                        zp: selectedShippingAddress?.zip,
                        external_id: user?.id,
                    },
                    {
                        value: totalAmountPaise,
                        currency: "INR",
                        content_type: "product",
                        content_ids: variables.items.map(
                            (item: any) => item.productId
                        ),
                        num_items: variables.totalItems,
                    },
                    getAbsoluteURL(window.location.href)
                ).catch((err) => console.error("CAPI Purchase Error:", err));
            },
            onError: (err) => {
                console.error("Error creating order:", err);
                handleClientError(err);
            },
        });

    const buildOrderDetailsByBrand = ({
        paymentMethod,
        razorpayOrderId,
        razorpayPaymentId,
    }: {
        paymentMethod: "razorpay" | "COD" | "reward";
        razorpayOrderId: string;
        razorpayPaymentId?: string;
    }) => {
        if (!selectedShippingAddress || !user) return [];

        const itemsByBrand = (availableItems as any[]).reduce(
            (acc, item) => {
                const brandId = item.product.brandId;
                if (!acc[brandId]) acc[brandId] = [];
                acc[brandId].push(item);
                return acc;
            },
            {} as Record<string, typeof availableItems>
        );

        return (Object.entries(itemsByBrand) as [string, any[]][]).map(
            ([, brandItems]) => {
                const brandTotal = brandItems.reduce(
                    (acc: number, item: any) => {
                        const price = item.isSwapRewardItem
                            ? 0
                            : item.variantId
                            ? (item.product.variants?.find(
                                  (v: any) => v.id === item.variantId
                              )?.price ??
                              item.product.price ??
                              0)
                            : (item.product.price ?? 0);
                        return acc + price * item.quantity;
                    },
                    0
                );
                const brandDiscount = Number(
                    paymentMethod === "reward"
                        ? brandTotal
                        : (
                              priceList.discount *
                              (brandTotal / Math.max(priceList.items, 1))
                          ).toFixed(2)
                );
                const brandTaxAmount =
                    paymentMethod === "reward"
                        ? 0
                        : brandItems.reduce(
                              (sum: number, item: any) =>
                                  sum + (taxLinesById.get(String(item.id))?.taxPaise ?? 0),
                              0
                          );

                return {
                    userId: user.id,
                    coupon:
                        paymentMethod === "reward" || !hasPaidItems
                            ? undefined
                            : appliedCoupon?.code,
                    addressId: selectedShippingAddress.id,
                    deliveryAmount: priceList.delivery,
                    taxAmount: brandTaxAmount,
                    totalAmount:
                        paymentMethod === "reward"
                            ? 0
                            : Math.max(
                                  0,
                                  Number((brandTotal - brandDiscount + brandTaxAmount).toFixed(2))
                              ),
                    discountAmount: brandDiscount,
                    paymentMethod,
                    totalItems: brandItems.reduce(
                        (acc: number, item: any) => acc + item.quantity,
                        0
                    ),
                    shiprocketOrderId: null,
                    shiprocketShipmentId: null,
                    items: brandItems.map((item: any) => ({
                        price: item.variantId
                            ? (item.product.variants.find(
                                  (v: any) => v.id === item.variantId
                              )?.price ??
                              item.product.price ??
                              0)
                            : (item.product.price ?? 0),
                        brandId: item.product.brandId,
                        productId: item.product.id,
                        variantId: item.variantId,
                        sku: item.variant?.nativeSku ?? item.product.nativeSku,
                        quantity: item.quantity,
                        categoryId: item.product.categoryId,
                        isSwapRewardItem: !!item.isSwapRewardItem,
                        swapRewardRedemptionId:
                            item.swapRewardRedemptionId ?? undefined,
                    })),
                    razorpayOrderId,
                    ...(razorpayPaymentId ? { razorpayPaymentId } : {}),
                    ...(paymentMethod === "reward"
                        ? {
                              isSwapRewardOrder: true,
                              swapRewardRedemptionId:
                                  rewardRedemptionId ?? undefined,
                          }
                        : {}),
                };
            }
        );
    };

    const { mutate: deleteItemFromCart, isPending: isRemoving } =
        trpc.general.orders.deleteItemFromCart.useMutation({
            onError: (err) => handleClientError(err),
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

    const { mutate: removeRewardCartItem, isPending: isRemovingRewardCartItem } =
        trpc.general.swapRewards.removeRewardCartItem.useMutation({
            onMutate: () => ({
                toastId: toast.loading("Removing reward from checkout..."),
            }),
            onSuccess: async (_, __, ctx) => {
                toast.success("Reward removed from checkout", {
                    id: ctx?.toastId,
                });
                await activeRewardCartItemQuery.refetch();
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
                setCouponCode("");
            },
            onError: (err, _, ctx) => handleClientError(err, ctx?.toastId),
        });

    const { mutateAsync: validateCouponSilently, isPending: isAutoCouponChecking } =
        trpc.general.coupons.validateCoupon.useMutation();

    useEffect(() => {
        const shouldAutoApply = cartValue > AUTO_COUPON_MIN_CART_VALUE;
        const isTryNewCouponApplied =
            appliedCoupon?.code?.toUpperCase() === AUTO_COUPON_CODE;

        if (!shouldAutoApply) {
            if (isTryNewCouponApplied) setAppliedCoupon(null);
            return;
        }

        if (appliedCoupon || isAutoCouponChecking) return;

        validateCouponSilently({
            code: AUTO_COUPON_CODE,
            totalAmount: cartValue,
        })
            .then((data) => {
                setAppliedCoupon(data);
                setCouponCode("");
            })
            .catch(() => {
                // Keep checkout smooth even if auto coupon is not available/valid.
            });
    }, [
        appliedCoupon,
        cartValue,
        isAutoCouponChecking,
        setAppliedCoupon,
        validateCouponSilently,
    ]);

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
                    totalAmount: payableTotalPaise,
                });
                const intentId = orderIntent?.id;

                const razorpayOrderId = await getShiprocketBalance(
                    payableTotalPaise
                );
                if (!razorpayOrderId)
                    throw new Error("Failed to create Razorpay order");

                setIsProcessing(true);

                const orderDetailsByBrand = buildOrderDetailsByBrand({
                    paymentMethod: "razorpay",
                    razorpayOrderId,
                });

                const options = createRazorpayPaymentOptions({
                    orderId: razorpayOrderId,
                    deliveryAddress: selectedShippingAddress,
                    prices: {
                        ...priceList,
                        total: payableTotalPaise,
                    },
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
                        } catch (error: any) {
                            throw new Error(
                                `Order creation failed: ${error.message}`
                            );
                        }
                    },
                    orderDetailsByBrand,
                    deleteItemFromCart: (input: { userId: string }) => {
                        if (!isBuyNow) deleteItemFromCart(input);
                    },
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

    const handleCodOrder = async () => {
        if ((!userCart && !isSwapReward) || !selectedShippingAddress)
            return toast.error("Cart or address missing");
        if (!user) return toast.error("User missing");
        if (availableItems.length === 0)
            return toast.error("No items available for checkout");

        const codRef = `cod_${Date.now()}`;
        const orderDetailsByBrand = buildOrderDetailsByBrand({
            paymentMethod: "COD",
            razorpayOrderId: codRef,
            razorpayPaymentId: `${codRef}_pending`,
        });

        if (!orderDetailsByBrand.length) {
            return toast.error("Unable to build COD order details");
        }

        setIsProcessing(true);
        setProcessingModalTitle("Placing COD Order...");
        setProcessingModalDescription(
            "Please wait while we place your Cash on Delivery order."
        );
        setProcessingModalState("pending");
        setIsProcessingModalOpen(true);

        try {
            for (const orderDetails of orderDetailsByBrand) {
                await retryCreateOrder(orderDetails);
            }

            if (!isBuyNow) {
                deleteItemFromCart({ userId });
            }

            setProcessingModalTitle("Order Placed Successfully");
            setProcessingModalDescription(
                "Your COD order has been placed successfully. Redirecting to your orders..."
            );
            setProcessingModalState("success");

            await new Promise((resolve) => setTimeout(resolve, 1500));
            setIsProcessingModalOpen(false);
            window.location.href = "/profile/orders";
        } catch (error: any) {
            setProcessingModalTitle("COD Order Failed");
            setProcessingModalDescription(
                error?.message || "Failed to place COD order. Please try again."
            );
            setProcessingModalState("error");
        } finally {
            setIsProcessing(false);
        }
    };

    const handleRewardOrder = async () => {
        if (!selectedShippingAddress) return toast.error("Address missing");
        if (!user) return toast.error("User missing");
        const rewardItem = availableItems.find(
            (item: any) => item.isSwapRewardItem
        ) as any;
        const activeRewardRedemptionId =
            rewardRedemptionId ?? rewardItem?.swapRewardRedemptionId;

        if (!activeRewardRedemptionId)
            return toast.error("Reward session missing");
        if (availableItems.length === 0)
            return toast.error("No reward item available for checkout");

        const rewardRef = `reward_${Date.now()}`;
        const orderDetailsByBrand = buildOrderDetailsByBrand({
            paymentMethod: "reward",
            razorpayOrderId: rewardRef,
            razorpayPaymentId: rewardRef,
        });

        setIsProcessing(true);
        setProcessingModalTitle("Redeeming Reward...");
        setProcessingModalDescription(
            "Please wait while we place your zero-pay reward order."
        );
        setProcessingModalState("pending");
        setIsProcessingModalOpen(true);

        try {
            for (const orderDetails of orderDetailsByBrand) {
                await retryCreateOrder(orderDetails);
            }

            setProcessingModalTitle("Reward Redeemed Successfully");
            setProcessingModalDescription(
                "Your reward order has been placed successfully. Redirecting to your orders..."
            );
            setProcessingModalState("success");

            await new Promise((resolve) => setTimeout(resolve, 1500));
            setIsProcessingModalOpen(false);
            window.location.href = "/profile/orders";
        } catch (error: any) {
            setProcessingModalTitle("Reward Redemption Failed");
            setProcessingModalDescription(
                error?.message ||
                    "We could not place your reward order. Please try again."
            );
            setProcessingModalState("error");
        } finally {
            setIsProcessing(false);
        }
    };

    const handlePlaceOrder = () => {
        if ((!userCart && !isSwapReward) || !selectedShippingAddress)
            return toast.error("Cart or address missing");
        if (!user) return toast.error("User missing");

        if (isRewardOnlyCheckout) {
            void handleRewardOrder();
            return;
        }

        const eventId =
            typeof crypto !== "undefined" && crypto.randomUUID
                ? crypto.randomUUID()
                : "evt_" +
                  new Date().getTime() +
                  "_" +
                  Math.random().toString(36).substring(2, 9);
        posthog?.capture(POSTHOG_EVENTS.COMMERCE.CHECKOUT_STARTED, {
            product_ids: availableItems.map((item) => item.product.id),
            brand_ids: availableItems.map((item) => item.product.brandId),
            total_amount: Number(convertPaiseToRupees(payableTotalPaise)),
            currency: "INR",
            total_items: itemsCount,
            payment_method: selectedPaymentMethod,
        });

        if (isSwapReward) {
            posthog?.capture(POSTHOG_EVENTS.SWAP_REWARD.CHECKOUT_STARTED, {
                redemption_id: rewardRedemptionId,
                product_ids: availableItems.map((item) => item.product.id),
                total_amount: 0,
                total_items: itemsCount,
            });
            void handleRewardOrder();
            return;
        }

        fbEvent(
            "InitiateCheckout",
            {
                content_ids: availableItems.map((item) => item.product.id),
                value: convertPaiseToRupees(payableTotalPaise),
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
            },
            { eventId }
        );

        trackInitiateCheckoutCapi(
            eventId,
            {
                em: user?.email,
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
                value: parseFloat(convertPaiseToRupees(payableTotalPaise)),
                currency: "INR",
                num_items: itemsCount,
            },
            getAbsoluteURL(window.location.href)
        ).catch((err) => console.error("CAPI InitiateCheckout Error:", err));

        if (selectedPaymentMethod === "cod") {
            void handleCodOrder();
            return;
        }

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
                        {isSwapReward ? "Redeem Reward" : "Review Order"}
                    </h1>
                </div>
                <div className="size-8" />
            </div>

            <div className="space-y-4 p-4">
                {(isSwapReward || hasRewardItem) && (
                    <div className="rounded-[24px] border border-[#d8c59e] bg-[linear-gradient(135deg,#f7eddc_0%,#fffaf1_100%)] p-4 text-[#4a3617] shadow-sm">
                        <div className="flex items-start gap-3">
                            <div className="rounded-full bg-white/80 p-2 text-[#9c6d3c]">
                                <Gift className="size-5" />
                            </div>
                            <div>
                                <p className="text-sm font-semibold">
                                    Swap &amp; Reward checkout
                                </p>
                                <p className="mt-1 text-xs leading-5 text-[#7b643b]">
                                    Your reward line stays{" "}
                                    {formatPriceTag(0)} in checkout, and you can
                                    still purchase regular items alongside it.
                                </p>
                            </div>
                        </div>
                    </div>
                )}

                {/* Order Items */}
                <div className="mb-6 rounded-2xl border border-gray-50 bg-white p-4 shadow-sm">
                    <OrderProductCard
                        orderItems={availableItems as any}
                        className="border border-gray-100 shadow-none"
                        isRemoving={
                            isRemovingProduct || isRemovingRewardCartItem
                        }
                        onRemove={
                            !isBuyNow
                                ? (item: any) =>
                                      item.isSwapRewardItem
                                          ? removeRewardCartItem({
                                                redemptionId:
                                                    item.swapRewardRedemptionId,
                                            })
                                          : removeProduct({
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

                {!isRewardOnlyCheckout && (
                    <>
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
                                                priceList.discount
                                            )
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
                                        <Spinner className="size-4 animate-spin" />
                                    ) : (
                                        "Apply"
                                    )}
                                </Button>
                            </div>

                            {/* Coupon Cards */}
                            <div className="space-y-2.5">
                                {isCouponsLoading ? (
                                    <div className="flex items-center justify-center py-8">
                                        <Spinner className="size-5 animate-spin text-gray-400" />
                                    </div>
                                ) : !filteredCoupons?.length ? (
                                    <div className="py-8 text-center">
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
                                                                : `${formatPriceTag(+convertPaiseToRupees(coupon.discountValue))} OFF`}
                                                            {coupon.maxDiscountAmount &&
                                                                coupon.discountType ===
                                                                    "percentage" && (
                                                                    <span className="ml-1 text-xs font-normal text-gray-500">
                                                                        (up to{" "}
                                                                        {formatPriceTag(
                                                                            +convertPaiseToRupees(
                                                                                coupon.maxDiscountAmount
                                                                            )
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
                                                                    Min{" "}
                                                                    {formatPriceTag(
                                                                        +convertPaiseToRupees(
                                                                            coupon.minOrderAmount
                                                                        )
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
                    </>
                )}

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
                                +convertPaiseToRupees(priceList.items)
                            )}
                        </span>
                    </div>
                    {!isSwapReward &&
                        priceList.productDiscount !== undefined &&
                        priceList.productDiscount > 0 && (
                            <div className="flex justify-between text-sm font-medium text-green-600">
                                <span>Discount on MRP</span>
                                <span>
                                    -{" "}
                                    {formatPriceTag(
                                        +convertPaiseToRupees(
                                            priceList.productDiscount
                                        )
                                    )}
                                </span>
                            </div>
                        )}
                    {isSwapReward && (
                        <div className="flex justify-between text-sm font-medium text-green-600">
                            <span>Swap Reward Discount</span>
                            <span>
                                -{" "}
                                {formatPriceTag(
                                    +convertPaiseToRupees(priceList.items)
                                )}
                            </span>
                        </div>
                    )}
                    {appliedCoupon &&
                        !isSwapReward &&
                        priceList.couponDiscount !== undefined &&
                        priceList.couponDiscount > 0 && (
                            <div className="flex justify-between text-sm font-medium text-green-600">
                                <span>Coupon Discount</span>
                                <span>
                                    -{" "}
                                    {formatPriceTag(
                                        +convertPaiseToRupees(
                                            priceList.couponDiscount
                                        )
                                    )}
                                </span>
                            </div>
                        )}
                    <div className="flex justify-between text-sm font-medium text-gray-600">
                        <span>Platform Fee</span>
                        <span>{formatPriceTag(0)}</span>
                    </div>
                    {!isSwapReward && gstAmountPaise > 0 ? (
                        <div className="flex justify-between text-sm font-medium text-gray-600">
                            <span>GST</span>
                            <span>{formatPriceTag(+convertPaiseToRupees(gstAmountPaise))}</span>
                        </div>
                    ) : null}

                    <Separator className="my-3" />

                    <div className="flex justify-between text-base font-bold text-gray-900">
                        <span>Total Amount</span>
                        <span>
                            {formatPriceTag(
                                +convertPaiseToRupees(payableTotalPaise)
                            )}
                        </span>
                    </div>
                </div>
            </div>

            {/* Sticky Bottom Bar */}
            <div className="fixed bottom-0 left-0 right-0 z-50 border-t border-gray-200 bg-white p-3 shadow-[0_-4px_6px_-1px_rgb(0,0,0,0.05)]">
                <div className="mx-auto max-w-2xl space-y-3">
                    {!isRewardOnlyCheckout && (
                    <div className="rounded-xl border border-gray-100 bg-white p-2 px-3 shadow-sm">
                        <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-500">
                            Payment Method
                        </p>
                        <div className="grid grid-cols-2 gap-2">
                            <button
                                type="button"
                                onClick={() => setSelectedPaymentMethod("online")}
                                className={cn(
                                    "flex items-center justify-center gap-2 rounded-lg border px-3 py-2 text-xs font-semibold transition-colors",
                                    selectedPaymentMethod === "online"
                                        ? "border-blue-600 bg-blue-50 text-blue-700"
                                        : "border-gray-200 text-gray-700 hover:bg-gray-50"
                                )}
                            >
                                <CreditCard className="size-4" />
                                <span>Pay Online</span>
                            </button>
                            <button
                                type="button"
                                onClick={() => setSelectedPaymentMethod("cod")}
                                className={cn(
                                    "flex items-center justify-center gap-2 rounded-lg border px-3 py-2 text-xs font-semibold transition-colors",
                                    selectedPaymentMethod === "cod"
                                        ? "border-blue-600 bg-blue-50 text-blue-700"
                                        : "border-gray-200 text-gray-700 hover:bg-gray-50"
                                )}
                            >
                                <Truck className="size-4" />
                                <span>Cash on Delivery</span>
                            </button>
                        </div>
                        <div className="mt-2 flex items-center justify-between">
                            <p className="text-[11px] text-gray-500">
                                {selectedPaymentMethod === "cod"
                                    ? "COD fulfilled via Delhivery"
                                    : "Razorpay Secure: UPI, Card, NetBanking"}
                            </p>
                            <ShieldCheck className="size-4 text-green-600" />
                        </div>
                    </div>
                    )}

                    <Button
                        size="lg"
                        className="h-12 w-full rounded-xl bg-[#84abd6] text-lg font-bold text-white shadow-none hover:bg-[#6d96c2]"
                        onClick={handlePlaceOrder}
                        disabled={
                            isProcessing ||
                            isPaymentInitializing ||
                            isOrderCreating ||
                            isCreatingOrderIntent ||
                            isRemoving ||
                            !selectedShippingAddress ||
                            rewardCheckoutQuery.isLoading ||
                            activeRewardCartItemQuery.isLoading ||
                            availableItems.length === 0
                        }
                    >
                        {isProcessing || isPaymentInitializing
                            ? "Processing..."
                            : isRewardOnlyCheckout
                              ? "Redeem Reward for Free"
                            : selectedPaymentMethod === "cod"
                              ? `Place COD Order ${formatPriceTag(+convertPaiseToRupees(payableTotalPaise))}`
                              : `Confirm & Pay ${formatPriceTag(+convertPaiseToRupees(payableTotalPaise))}`}
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





