export const BRAND_EVENTS = {
    ORDER: {
        CREATED: "order_created",
        DELIVERED: "order_delivered",
        CANCELLED: "order_cancelled",
    },
    PAYMENT: {
        SUCCESS: "payment_success",
        FAILURE: "payment_failure",
    },
    REFUND: {
        CREATED: "refund_created",
        COMPLETED: "refund_completed",
        FAILED: "refund_failed",
    },
    PRODUCT: {
        VIEWED: "product_viewed",
        CREATED: "product_created",
        DELETED: "product_deleted",
    },
    CART: {
        ADDED: "cart_added",
        REMOVED: "cart_removed",
    },
    WISHLIST: {
        ADDED: "wishlist_added",
        REMOVED: "wishlist_removed",
    },
} as const;

export const BRAND_EVENT_NAMESPACES = Object.values(BRAND_EVENTS).flatMap(
    (eventGroup) => Object.values(eventGroup)
);
