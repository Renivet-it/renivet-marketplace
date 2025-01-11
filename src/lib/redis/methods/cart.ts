import { userCartQueries } from "@/lib/db/queries";
import { parseToJSON } from "@/lib/utils";
import { CachedCart, cachedCartSchema } from "@/lib/validations";
import { redis } from "..";

class UserCartCache {
    async get(userId: string) {
        const [dbCartsCount, keys] = await Promise.all([
            userCartQueries.getCartProductCountForUser(userId),
            redis.keys(`cart:${userId}:*`),
        ]);

        if (keys.length !== dbCartsCount) {
            await this.drop(userId);

            const dbCarts = await userCartQueries.getCartForUser(userId);
            if (!dbCarts.length) return [];

            const cachedCarts = cachedCartSchema
                .array()
                .parse(dbCarts)
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
        if (!keys.length) return [];

        const cachedCarts = await redis.mget(...keys);
        return cachedCartSchema.array().parse(
            cachedCarts
                .map((sub) => parseToJSON<CachedCart>(sub))
                .filter((sub): sub is CachedCart => sub !== null)
                .sort(
                    (a, b) =>
                        new Date(b.createdAt).getTime() -
                        new Date(a.createdAt).getTime()
                )
                .sort((a, b) => {
                    if (a.status === b.status) return 0;
                    return a.status ? -1 : 1;
                })
        );
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
        const keyArray = ["cart", userId, productId, variantId];
        const key = keyArray.filter(Boolean).join(":");

        const cachedCart = await redis.get(key);

        if (!cachedCart) {
            const dbCart = await userCartQueries.getProductInCart({
                userId,
                productId,
                variantId,
            });
            if (!dbCart) return null;

            const cachedCart = cachedCartSchema.parse(dbCart);

            await this.add(cachedCart);
            return cachedCart;
        }

        return cachedCartSchema.parse(parseToJSON(cachedCart));
    }

    async add(cart: CachedCart) {
        const keyArray = ["cart", cart.userId, cart.productId, cart.variantId];
        const key = keyArray.filter(Boolean).join(":");

        return await redis.set(
            key,
            JSON.stringify(cart),
            "EX",
            60 * 60 * 24 * 7
        );
    }

    async addBulk(carts: CachedCart[]) {
        const pipeline = redis.pipeline();

        await Promise.all(
            carts.map((cart) => {
                const keyArray = [
                    "cart",
                    cart.userId,
                    cart.productId,
                    cart.variantId,
                ];
                const key = keyArray.filter(Boolean).join(":");

                pipeline.set(key, JSON.stringify(cart), "EX", 60 * 60 * 24 * 7);
            })
        );

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
        const keyArray = ["cart", userId, productId, variantId];
        const key = keyArray.filter(Boolean).join(":");

        return await redis.del(key);
    }

    async drop(userId: string) {
        const keys = await redis.keys(`cart:${userId}:*`);
        if (!keys.length) return 0;
        return await redis.del(...keys);
    }

    async dropAll() {
        const keys = await redis.keys("cart:*");
        if (!keys.length) return 0;
        return await redis.del(...keys);
    }
}

export const userCartCache = new UserCartCache();
