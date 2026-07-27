/** Products retain the New badge for 30 full days from their creation time. */
export const NEW_PRODUCT_WINDOW_MS = 30 * 24 * 60 * 60 * 1000;

export function isNewProduct(
    createdAt: Date | string | null | undefined,
    now = Date.now()
) {
    if (!createdAt) return false;

    const createdAtMs = new Date(createdAt).getTime();
    return (
        Number.isFinite(createdAtMs) &&
        createdAtMs <= now &&
        now - createdAtMs < NEW_PRODUCT_WINDOW_MS
    );
}
