import { CachedCart } from "@/lib/validations";

export function isCartItemAvailable(
    item: Pick<CachedCart, "product" | "variant">
) {
    return (
        item.product.isPublished &&
        item.product.verificationStatus === "approved" &&
        !item.product.isDeleted &&
        item.product.isAvailable &&
        (!!item.product.quantity ? item.product.quantity > 0 : true) &&
        item.product.isActive &&
        (!item.variant ||
            (!item.variant.isDeleted && item.variant.quantity > 0))
    );
}
