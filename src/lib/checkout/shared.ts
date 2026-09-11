export const AUTO_COUPON_CODE = "TRYNEW20";
export const AUTO_COUPON_MIN_CART_VALUE = 3000 * 100;

type CheckoutProduct = {
    isPublished?: boolean;
    verificationStatus?: string | null;
    isDeleted?: boolean;
    isAvailable?: boolean;
    quantity?: number | null;
    isActive?: boolean;
    price?: number | null;
    compareAtPrice?: number | null;
    categoryId: string;
    subcategoryId: string;
    productTypeId: string;
    brandId: string;
    variants?: Array<{
        id: string;
        price?: number | null;
        compareAtPrice?: number | null;
    }> | null;
};

type AvailabilityItem = {
    product: CheckoutProduct;
    variant?: {
        id?: string;
        isDeleted?: boolean;
        quantity?: number | null;
    } | null;
    status?: boolean;
};

export function isCheckoutItemAvailable(
    item: AvailabilityItem,
    requireSelected = true
) {
    const { product, variant } = item;
    return Boolean(
        (!requireSelected || item.status) &&
            product.isPublished &&
            product.verificationStatus === "approved" &&
            !product.isDeleted &&
            product.isAvailable &&
            (product.quantity ? product.quantity > 0 : true) &&
            product.isActive &&
            (!variant || (!variant.isDeleted && (variant.quantity ?? 0) > 0))
    );
}

export function filterAvailableCheckoutItems<T extends AvailabilityItem>(
    items: T[] | null | undefined,
    requireSelected = true
) {
    return (
        items?.filter((item) =>
            isCheckoutItemAvailable(item, requireSelected)
        ) ?? []
    );
}

type PricingItem = {
    product: CheckoutProduct;
    variantId?: string | null;
    quantity: number;
    isSwapRewardItem?: boolean;
    rewardValue?: number | null;
};

export function toCheckoutPriceItems(items: PricingItem[]) {
    return items.map((item) => {
        const variant = item.variantId
            ? item.product.variants?.find(
                  (candidate) => candidate.id === item.variantId
              )
            : undefined;
        const paidPrice = variant?.price ?? item.product.price ?? 0;
        const price = item.isSwapRewardItem ? 0 : paidPrice;
        const compareAtPrice = item.isSwapRewardItem
            ? (item.rewardValue ?? 0)
            : (variant?.compareAtPrice ??
              item.product.compareAtPrice ??
              paidPrice);

        return {
            price,
            compareAtPrice,
            quantity: item.quantity,
            categoryId: item.product.categoryId,
            subCategoryId: item.product.subcategoryId,
            productTypeId: item.product.productTypeId,
        };
    });
}

export type AutoCouponAction =
    | { type: "apply"; code: typeof AUTO_COUPON_CODE }
    | { type: "clear" }
    | { type: "none" };

export function getAutoCouponAction(
    paidSubtotal: number,
    appliedCode?: string | null
): AutoCouponAction {
    if (paidSubtotal > AUTO_COUPON_MIN_CART_VALUE && !appliedCode) {
        return { type: "apply", code: AUTO_COUPON_CODE };
    }
    if (
        paidSubtotal <= AUTO_COUPON_MIN_CART_VALUE &&
        appliedCode === AUTO_COUPON_CODE
    ) {
        return { type: "clear" };
    }
    return { type: "none" };
}

export function groupCheckoutItemsByBrand<
    T extends { product: { brandId: string } },
>(items: T[]) {
    const groups = new Map<string, T[]>();
    for (const item of items) {
        const group = groups.get(item.product.brandId);
        if (group) group.push(item);
        else groups.set(item.product.brandId, [item]);
    }
    return [...groups.values()];
}

type OrderAssemblyItem = PricingItem & {
    id: string;
    productId: string;
    variant?: { nativeSku?: string | null } | null;
    product: CheckoutProduct & { id?: string; nativeSku?: string | null };
    customizationRequest?: string | null;
    swapRewardRedemptionId?: string | null;
};

export function assembleOrderDetailsByBrand<T extends OrderAssemblyItem>({
    items,
    userId,
    addressId,
    couponCode,
    deliveryAmount,
    couponDiscount,
    productDiscount,
    itemsSubtotal,
    paymentMethod,
    paymentOrderId,
    paymentId,
    taxForItem,
    customizationForItem,
    rewardRedemptionId,
    hasPaidItems = true,
    zeroRewardItemPrice = true,
}: {
    items: T[];
    userId: string;
    addressId: string;
    couponCode?: string;
    deliveryAmount: number;
    couponDiscount: number;
    productDiscount: number;
    itemsSubtotal: number;
    paymentMethod: "razorpay" | "COD" | "reward";
    paymentOrderId: string;
    paymentId?: string;
    taxForItem: (id: string) => number;
    customizationForItem: (item: T) => string | null;
    rewardRedemptionId?: string;
    hasPaidItems?: boolean;
    zeroRewardItemPrice?: boolean;
}) {
    return groupCheckoutItemsByBrand(items).map((brandItems) => {
        const brandTotal = brandItems.reduce(
            (sum, item) => sum + getCheckoutItemPrice(item) * item.quantity,
            0
        );
        const isRewardPayment = paymentMethod === "reward";
        const brandCouponDiscount = Number(
            (isRewardPayment
                ? 0
                : couponDiscount *
                  (brandTotal / Math.max(itemsSubtotal - productDiscount, 1))
            ).toFixed(2)
        );

        return {
            userId,
            coupon: isRewardPayment || !hasPaidItems ? undefined : couponCode,
            addressId,
            deliveryAmount,
            taxAmount: isRewardPayment
                ? 0
                : brandItems.reduce(
                      (sum, item) => sum + taxForItem(String(item.id)),
                      0
                  ),
            totalAmount: isRewardPayment
                ? 0
                : Math.max(
                      0,
                      Number((brandTotal - brandCouponDiscount).toFixed(2))
                  ),
            discountAmount: isRewardPayment ? brandTotal : 0,
            couponDiscountAmount: brandCouponDiscount,
            paymentMethod,
            totalItems: brandItems.reduce(
                (sum, item) => sum + item.quantity,
                0
            ),
            shiprocketOrderId: null,
            shiprocketShipmentId: null,
            items: brandItems.map((item) => ({
                price:
                    zeroRewardItemPrice && item.isSwapRewardItem
                        ? 0
                        : getCheckoutItemPrice(item),
                brandId: item.product.brandId,
                productId: item.productId,
                variantId: item.variantId ?? null,
                sku:
                    item.variant?.nativeSku ??
                    item.product.nativeSku ??
                    `sku-${item.productId}`,
                quantity: item.quantity,
                customizationRequest: customizationForItem(item),
                categoryId: item.product.categoryId,
                isSwapRewardItem: Boolean(item.isSwapRewardItem),
                swapRewardRedemptionId:
                    item.swapRewardRedemptionId ?? undefined,
            })),
            razorpayOrderId: paymentOrderId,
            ...(paymentId ? { razorpayPaymentId: paymentId } : {}),
            ...(isRewardPayment
                ? {
                      isSwapRewardOrder: true,
                      swapRewardRedemptionId: rewardRedemptionId,
                  }
                : {}),
        };
    });
}

function getCheckoutItemPrice(item: PricingItem) {
    if (item.isSwapRewardItem) return 0;
    return item.variantId
        ? (item.product.variants?.find(
              (variant) => variant.id === item.variantId
          )?.price ??
              item.product.price ??
              0)
        : (item.product.price ?? 0);
}

export function createLatestWriteQueue<T>(
    write: (value: T) => Promise<void>,
    onDrain: () => Promise<void> | void
) {
    let active: Promise<void> | null = null;
    let queued: T | undefined;
    let hasQueued = false;

    const drain = async () => {
        while (hasQueued) {
            const value = queued as T;
            hasQueued = false;
            await write(value);
        }
        await onDrain();
    };

    return {
        enqueue(value: T) {
            queued = value;
            hasQueued = true;
            if (!active) {
                active = drain().finally(() => {
                    active = null;
                });
            }
            return active;
        },
        get isPending() {
            return active !== null;
        },
    };
}

export function createRequestGuard() {
    let current = 0;
    return {
        next: () => ++current,
        invalidate: () => {
            current += 1;
        },
        isCurrent: (request: number) => request === current,
    };
}

export function createCustomizationPersistence({
    userId,
    write,
    refetch,
}: {
    userId: string;
    write: (input: {
        userId: string;
        productId: string;
        variantId: string | null;
        customizationRequest: string | null;
    }) => Promise<unknown>;
    refetch: () => Promise<unknown>;
}) {
    const queues = new Map<
        string,
        ReturnType<typeof createLatestWriteQueue<string | null>>
    >();
    const queueFor = (item: {
        id: string;
        productId: string;
        variantId?: string | null;
    }) => {
        let queue = queues.get(item.id);
        if (!queue) {
            queue = createLatestWriteQueue(
                async (customizationRequest) => {
                    await write({
                        userId,
                        productId: item.productId,
                        variantId: item.variantId ?? null,
                        customizationRequest,
                    });
                },
                async () => {
                    await refetch();
                }
            );
            queues.set(item.id, queue);
        }
        return queue;
    };
    return {
        save(
            item: { id: string; productId: string; variantId?: string | null },
            value: string
        ) {
            return queueFor(item).enqueue(value.trim().slice(0, 500) || null);
        },
        isPending(itemId: string) {
            return queues.get(itemId)?.isPending ?? false;
        },
    };
}
