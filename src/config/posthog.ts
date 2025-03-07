export const POSTHOG_EVENTS = {
    AUTH: {
        SIGNIN_INITIATED: "auth_signin_initiated",
        SIGNED_IN: "auth_signed_in",
        SIGNOUT_INITIATED: "auth_signout_initiated",
        SIGNED_OUT: "auth_signed_out",
    },
    USER: {
        ACCOUNT: {
            CREATED: "user_account_created",
            UPDATED: "user_account_updated",
            DELETED: "user_account_deleted",
            PASSWORD: {
                UPDATED: "user_account_password_updated",
            },
        },
        ADDRESS: {
            ADDED: "user_address_added",
            UPDATED: "user_address_updated",
            DELETED: "user_address_deleted",
        },
    },
    BLOG: {
        VIEWED: "blog_viewed",
        CREATED: "blog_created",
        UPDATED: "blog_updated",
        DELETED: "blog_deleted",
    },
    BRAND: {
        CREATED: "brand_created",
        REQUEST: {
            CREATED: "brand_request_created",
            APPROVED: "brand_request_approved",
            REJECTED: "brand_request_rejected",
            DELETED: "brand_request_deleted",
        },
        INVITE: {
            CREATED: "brand_invite_created",
            DELETED: "brand_invite_deleted",
            ACCEPTED: "brand_invite_accepted",
        },
        WAITLIST: {
            ADDED: "brand_waitlist_added",
            REMOVED: "brand_waitlist_removed",
        },
        MEMBER: {
            JOINED: "brand_member_joined",
            BAN: {
                ADDED: "brand_member_ban_added",
                REMOVED: "brand_member_ban_removed",
            },
            KICKED: "brand_member_kicked",
        },
    },
    TICKET: {
        CREATED: "ticket_created",
        DELETED: "ticket_deleted",
    },
    PRODUCT: {
        CREATED: "product_created",
        BULK_CREATED: "product_bulk_created",
        PUBLISHED: "product_published",
        SENT_FOR_REVIEW: "product_sent_for_review",
        DELETED: "product_deleted",
        APRROVED: "product_approved",
        REJECTED: "product_rejected",
    },
    WISHLIST: {
        ADDED: "wishlist_added",
        REMOVED: "wishlist_removed",
    },
    CART: {
        ADDED: "cart_added",
        REMOVED: "cart_removed",
        BULK_REMOVED: "cart_bulk_removed",
    },
    NEWSLETTER: {
        SUBSCRIBED: "newsletter_subscribed",
        UNSUBSCRIBED: "newsletter_unsubscribed",
        DELETED: "newsletter_deleted",
    },
} as const;
