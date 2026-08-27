const toNonNegativeInt = (value: unknown) => {
    const numeric = Number(value);
    if (!Number.isFinite(numeric)) return 0;
    return Math.max(0, Math.trunc(numeric));
};

export const sanitizeWishlistQuantities = (wishlist: any) => ({
    ...wishlist,
    product: wishlist.product
        ? {
              ...wishlist.product,
              quantity:
                  wishlist.product.quantity === null ||
                  wishlist.product.quantity === undefined
                      ? wishlist.product.quantity
                      : toNonNegativeInt(wishlist.product.quantity),
              variants: Array.isArray(wishlist.product.variants)
                  ? wishlist.product.variants.map((variant: any) => ({
                        ...variant,
                        quantity: toNonNegativeInt(variant.quantity),
                    }))
                  : wishlist.product.variants,
          }
        : wishlist.product,
});
