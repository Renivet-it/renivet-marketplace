export interface GuestWishlistItem {
    fullProduct: {
        slug: string;
        media?: Array<{ mediaItem?: { url?: string } }>;
        [key: string]: any;
    };
    id: string;
    title: string;
    slug: string;
    brand: string;
    price: number;
    media?: string[];
}

function asRecord(value: unknown): Record<string, any> {
    return value && typeof value === "object"
        ? (value as Record<string, any>)
        : {};
}

export function normalizeGuestWishlistItems(raw: unknown): GuestWishlistItem[] {
    if (!Array.isArray(raw)) return [];

    return raw.flatMap((value) => {
        const item = asRecord(value);
        const product = asRecord(item.fullProduct ?? item.product ?? item);
        const productId = String(item.productId ?? product.id ?? item.id ?? "");
        if (!productId) return [];
        const variantId = item.variantId == null ? "" : String(item.variantId);
        const slug = String(item.slug ?? product.slug ?? productId);
        const media = Array.isArray(item.media)
            ? item.media.filter((url): url is string => typeof url === "string")
            : undefined;

        return [
            {
                fullProduct: { ...product, slug },
                id: String(item.id ?? `${productId}:${variantId}`),
                title: String(
                    item.title ?? product.title ?? product.name ?? "Product"
                ),
                slug,
                brand: String(
                    item.brand ??
                        product.brand?.name ??
                        product.brand ??
                        "Renivet"
                ),
                price: Number(
                    item.price ?? item.itemPrice ?? product.price ?? 0
                ),
                media,
            },
        ];
    });
}
