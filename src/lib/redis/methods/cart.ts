import { userCartQueries } from "@/lib/db/queries";
import { parseToJSON } from "@/lib/utils";
import { CachedCart, cachedCartSchema } from "@/lib/validations";
import { redis } from "..";
import {
    CART_CACHE_TTL_SECONDS,
    cartIndexKey,
    cartItemKey,
    cartMembershipMatches,
} from "./cart-key";

const toNonNegativeInt = (value: unknown) => {
    const numeric = Number(value);
    if (!Number.isFinite(numeric)) return 0;
    return Math.max(0, Math.trunc(numeric));
};

const sanitizeCachedCartQuantities = (cart: any) => ({
    ...cart,
    product: cart?.product
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
        : cart?.product,
    variant: cart?.variant
        ? {
              ...cart.variant,
              quantity: toNonNegativeInt(cart.variant.quantity),
          }
        : cart?.variant,
});

const parseCachedCartArraySafely = (carts: any[]): CachedCart[] => {
    const sanitized = carts.map(sanitizeCachedCartQuantities);
    const parsed = cachedCartSchema.array().safeParse(sanitized);
    if (parsed.success) return parsed.data;
    console.error(
        "cart cache: array validation failed, returning sanitized fallback",
        parsed.error.issues
    );
    return sanitized as CachedCart[];
};

const parseCachedCartSafely = (cart: any): CachedCart | null => {
    if (!cart) return null;
    const sanitized = sanitizeCachedCartQuantities(cart);
    const parsed = cachedCartSchema.safeParse(sanitized);
    if (parsed.success) return parsed.data;
    console.error(
        "cart cache: single validation failed, returning sanitized fallback",
        parsed.error.issues
    );
    return sanitized as CachedCart;
};

class UserCartCache {
    async get(userId: string) {
        const [dbCarts, indexedKeys] = await Promise.all([
            userCartQueries.getCartForUser(userId),
            redis.smembers(cartIndexKey(userId)),
        ]);
        const expectedKeys = dbCarts.map((cart) =>
            cartItemKey(cart.userId, cart.productId, cart.variantId ?? undefined)
        );
        const membershipMatches = cartMembershipMatches(
            expectedKeys,
            indexedKeys
        );

        if (!membershipMatches) {
            await this.drop(userId);
            if (!dbCarts.length) return [];

            const cachedCarts = parseCachedCartArraySafely(dbCarts)
                .sort(
                    (a, b) =>
                        new Date(b.createdAt).getTime() -
                        new Date(a.createdAt).getTime()
                )
                .sort((a, b) => {
                    if (a.status === b.status) return 0;
                    return a.status ? -1 : 1;
                });

            await this.addBulk(cachedCarts);
            return cachedCarts;
        }
        if (!expectedKeys.length) return [];

        const cachedCarts = await redis.mget(...expectedKeys);
        const parsedCachedCarts = parseCachedCartArraySafely(
            cachedCarts
                .map((sub) => parseToJSON<CachedCart>(sub))
                .filter((sub): sub is CachedCart => sub !== null)
        );

        const cachedKeys = new Set(
            parsedCachedCarts.map((cart) =>
                cartItemKey(cart.userId, cart.productId, cart.variantId ?? undefined)
            )
        );
        if (
            parsedCachedCarts.length !== dbCarts.length ||
            cachedKeys.size !== expectedKeys.length ||
            expectedKeys.some((key) => !cachedKeys.has(key))
        ) {
            await this.drop(userId);
            await this.addBulk(dbCarts);
            return dbCarts;
        }

        return parsedCachedCarts
            .sort(
                (a, b) =>
                    new Date(b.createdAt).getTime() -
                    new Date(a.createdAt).getTime()
            )
            .sort((a, b) => {
                if (a.status === b.status) return 0;
                return a.status ? -1 : 1;
            });
    }

    async getProduct({
        userId,
        productId,
        variantId,
    }: {
        userId: string;
        productId: string;
        variantId?: string;
    }) {
        const key = cartItemKey(userId, productId, variantId);

        const cachedCart = await redis.get(key);

        if (!cachedCart) {
            const dbCart = await userCartQueries.getProductInCart({
                userId,
                productId,
                variantId,
            });
            if (!dbCart) return null;

            const cachedCart = parseCachedCartSafely(dbCart);
            if (!cachedCart) return null;

            await this.add(cachedCart);
            return cachedCart;
        }

        return parseCachedCartSafely(parseToJSON(cachedCart));
    }

    async add(cart: CachedCart) {
        const key = cartItemKey(
            cart.userId,
            cart.productId,
            cart.variantId ?? undefined
        );
        const pipeline = redis.pipeline();
        pipeline
            .set(key, JSON.stringify(cart), "EX", CART_CACHE_TTL_SECONDS)
            .sadd(cartIndexKey(cart.userId), key)
            .expire(cartIndexKey(cart.userId), CART_CACHE_TTL_SECONDS);
        return pipeline.exec();
    }

    async addBulk(carts: CachedCart[]) {
        const pipeline = redis.pipeline();
        if (!carts.length) return [];

        carts.forEach((cart) => {
            const key = cartItemKey(
                cart.userId,
                cart.productId,
                cart.variantId ?? undefined
            );
            pipeline
                .set(key, JSON.stringify(cart), "EX", CART_CACHE_TTL_SECONDS)
                .sadd(cartIndexKey(cart.userId), key);
        });
        pipeline.expire(cartIndexKey(carts[0].userId), CART_CACHE_TTL_SECONDS);

        return pipeline.exec();
    }

    async remove({
        userId,
        productId,
        variantId,
    }: {
        userId: string;
        productId: string;
        variantId?: string;
    }) {
        const key = cartItemKey(userId, productId, variantId);
        const pipeline = redis.pipeline();
        pipeline.del(key).srem(cartIndexKey(userId), key);
        return pipeline.exec();
    }

    async drop(userId: string) {
        const keys = await redis.smembers(cartIndexKey(userId));
        return await redis.del(...keys, cartIndexKey(userId));
    }

    async dropAll() {
        const keys = await redis.keys("cart:*");
        if (!keys.length) return 0;
        return await redis.del(...keys);
    }
}

export const userCartCache = new UserCartCache();
