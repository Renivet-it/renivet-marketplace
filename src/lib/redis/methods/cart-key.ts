export const CART_CACHE_TTL_SECONDS = 60 * 60 * 24 * 7;

export const cartIndexKey = (userId: string) => `cart:index:${userId}`;

export const cartItemKey = (
    userId: string,
    productId: string,
    variantId?: string
) =>
    variantId
        ? `cart:${userId}:${productId}:${variantId}`
        : `cart:${userId}:${productId}`;

export const cartMembershipMatches = (
    expectedKeys: string[],
    indexedKeys: string[]
) => {
    const indexedKeySet = new Set(indexedKeys);
    return (
        expectedKeys.length === indexedKeySet.size &&
        expectedKeys.every((key) => indexedKeySet.has(key))
    );
};
