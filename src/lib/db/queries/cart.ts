import { mediaCache } from "@/lib/redis/methods";
import {
    cachedCartSchema,
    CachedCart,
    CreateCart,
    UpdateCart,
} from "@/lib/validations";
import { and, eq, inArray } from "drizzle-orm";
import { db } from "..";
import { carts } from "../schema";

const toNonNegativeInt = (value: unknown) => {
    const numeric = Number(value);
    if (!Number.isFinite(numeric)) return 0;
    return Math.max(0, Math.trunc(numeric));
};

const sanitizeCartQuantities = (cart: any) => ({
    ...cart,
    product: cart.product
        ? {
              ...cart.product,
              quantity:
                  cart.product.quantity === null ||
                  cart.product.quantity === undefined
                      ? cart.product.quantity
                      : toNonNegativeInt(cart.product.quantity),
              variants: Array.isArray(cart.product.variants)
                  ? cart.product.variants.map((variant: any) => ({
                        ...variant,
                        quantity: toNonNegativeInt(variant.quantity),
                    }))
                  : cart.product.variants,
          }
        : cart.product,
    variant: cart.variant
        ? {
              ...cart.variant,
              quantity: toNonNegativeInt(cart.variant.quantity),
          }
        : cart.variant,
});

const parseCartArraySafely = (cartsData: any[]): CachedCart[] => {
    const sanitizedCarts = cartsData.map(sanitizeCartQuantities);
    const parsed = cachedCartSchema.array().safeParse(sanitizedCarts);

    if (parsed.success) {
        return parsed.data;
    }

    console.error(
        "cart query: array validation failed, returning sanitized fallback",
        parsed.error.issues
    );
    return sanitizedCarts as CachedCart[];
};

const parseSingleCartSafely = (cartData: any): CachedCart | null => {
    if (!cartData) return null;

    const sanitizedCart = sanitizeCartQuantities(cartData);
    const parsed = cachedCartSchema.safeParse(sanitizedCart);

    if (parsed.success) {
        return parsed.data;
    }

    console.error(
        "cart query: single validation failed, returning sanitized fallback",
        parsed.error.issues
    );
    return sanitizedCart as CachedCart;
};

class UserCartQuery {
    async getCartProductCountForUser(userId: string) {
        const data = await db.$count(carts, eq(carts.userId, userId));
        return +data || 0;
    }

    async getCartForUser(userId: string) {
        const data = await db.query.carts.findMany({
            with: {
                product: {
                    with: {
                        brand: true,
                        variants: true,
                        category: true,
                        subcategory: true,
                        productType: true,
                        options: true,
                    },
                },
                variant: true,
            },
            where: eq(carts.userId, userId),
        });

        const products = data.map((d) => d.product);

        const mediaIds = new Set<string>();
        for (const product of products) {
            product.media.forEach((media) => mediaIds.add(media.id));
            product.variants.forEach((variant) => {
                if (variant.image) mediaIds.add(variant.image);
            });
            if (product.sustainabilityCertificate)
                mediaIds.add(product.sustainabilityCertificate);
        }

        const mediaItems = await mediaCache.getByIds(Array.from(mediaIds));
        const mediaMap = new Map(
            mediaItems.data.map((item) => [item.id, item])
        );

        const enhancedProducts = products.map((product) => ({
            ...product,
            media: product.media.map((media) => ({
                ...media,
                mediaItem: mediaMap.get(media.id),
            })),
            sustainabilityCertificate: product.sustainabilityCertificate
                ? mediaMap.get(product.sustainabilityCertificate)
                : null,
            variants: product.variants.map((variant) => ({
                ...variant,
                mediaItem: variant.image ? mediaMap.get(variant.image) : null,
            })),
        }));

        const enhancedData = data.map((d) => ({
            ...d,
            product: enhancedProducts.find((p) => p.id === d.productId),
        }));

        return parseCartArraySafely(enhancedData);
    }

    async getProductInCart({
        userId,
        productId,
        variantId,
    }: {
        userId: string;
        productId: string;
        variantId?: string;
    }) {
        const data = await db.query.carts.findFirst({
            with: {
                product: {
                    with: {
                        brand: true,
                        variants: true,
                        category: true,
                        subcategory: true,
                        productType: true,
                        options: true,
                    },
                },
                variant: true,
            },
            where: and(
                eq(carts.userId, userId),
                eq(carts.productId, productId),
                variantId ? eq(carts.variantId, variantId) : undefined
            ),
        });

        const product = data?.product;
        if (!product) return null;

        const mediaIds = new Set<string>();
        product.media.forEach((media) => mediaIds.add(media.id));
        product.variants.forEach((variant) => {
            if (variant.image) mediaIds.add(variant.image);
        });
        if (product.sustainabilityCertificate)
            mediaIds.add(product.sustainabilityCertificate);

        const mediaItems = await mediaCache.getByIds(Array.from(mediaIds));
        const mediaMap = new Map(
            mediaItems.data.map((item) => [item.id, item])
        );

        const enhancedProduct = {
            ...product,
            media: product.media.map((media) => ({
                ...media,
                mediaItem: mediaMap.get(media.id),
            })),
            sustainabilityCertificate: product.sustainabilityCertificate
                ? mediaMap.get(product.sustainabilityCertificate)
                : null,
            variants: product.variants.map((variant) => ({
                ...variant,
                mediaItem: variant.image ? mediaMap.get(variant.image) : null,
            })),
        };

        const enhancedData = {
            ...data,
            product: enhancedProduct,
        };

        return parseSingleCartSafely(enhancedData);
    }

    async addProductToCart(values: CreateCart) {
        const data = await db
            .insert(carts)
            .values(values)
            .returning()
            .then((res) => res[0]);

        return data;
    }

    async updateProductInCart(id: string, values: UpdateCart) {
        const data = await db
            .update(carts)
            .set({
                ...values,
                updatedAt: new Date(),
            })
            .where(eq(carts.id, id))
            .returning()
            .then((res) => res[0]);

        return data;
    }

    async updateStatusInCart(userId: string, status: boolean) {
        const data = await db
            .update(carts)
            .set({
                status,
                updatedAt: new Date(),
            })
            .where(eq(carts.userId, userId))
            .returning()
            .then((res) => res[0]);

        return data;
    }

    async deleteProductFromCart(id: string) {
        const data = await db
            .delete(carts)
            .where(eq(carts.id, id))
            .returning()
            .then((res) => res[0]);

        return data;
    }

    async deleteProductsFromCart(userId: string, ids: string[]) {
        const data = await db
            .delete(carts)
            .where(and(inArray(carts.id, ids), eq(carts.userId, userId)))
            .returning()
            .then((res) => res[0]);

        return data;
    }

    async dropCartOfUser(userId: string) {
        const data = await db
            .delete(carts)
            .where(eq(carts.userId, userId))
            .returning()
            .then((res) => res[0]);

        return data;
    }

    async dropActiveItemsFromCart(userId: string) {
        const data = await db
            .delete(carts)
            .where(and(eq(carts.userId, userId), eq(carts.status, true)))
            .returning()
            .then((res) => res[0]);

        return data;
    }
}

export const userCartQueries = new UserCartQuery();
