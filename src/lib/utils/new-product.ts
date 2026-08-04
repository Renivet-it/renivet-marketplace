import { addMonths } from "date-fns";

/**
 * Products uploaded from June 2026 onward can receive the storefront NEW tag.
 * June 2026 was given a one-off three-month window; subsequent uploads keep
 * the standard two-month window.
 */
export const NEW_PRODUCT_ELIGIBILITY_START = new Date(
    "2026-06-01T00:00:00+05:30"
);
export const JUNE_2026_NEW_PRODUCT_END = new Date("2026-07-01T00:00:00+05:30");

export function isNewProduct(product: unknown, now = new Date()) {
    if (!product || typeof product !== "object") return false;

    const { createdAt: createdAtValue, publishedAt } = product as {
        publishedAt?: Date | string | number | null;
        createdAt?: Date | string | number | null;
    };
    const listingDate = createdAtValue ?? publishedAt;
    const createdAt =
        listingDate instanceof Date ? listingDate : new Date(listingDate ?? "");

    if (Number.isNaN(createdAt.getTime())) return false;
    if (createdAt < NEW_PRODUCT_ELIGIBILITY_START || createdAt > now) {
        return false;
    }

    const displayMonths = createdAt < JUNE_2026_NEW_PRODUCT_END ? 3 : 2;

    return now < addMonths(createdAt, displayMonths);
}
