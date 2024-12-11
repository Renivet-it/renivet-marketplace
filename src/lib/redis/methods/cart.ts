import { userCartQueries } from "@/lib/db/queries";
import { parseToJSON } from "@/lib/utils";
import { CachedCart, cachedCartSchema, Product } from "@/lib/validations";
import { redis } from "..";

class UserCartCache {
    async get(userId: string) {
        const [dbCartsCount, keys] = await Promise.all([
            userCartQueries.getUserCartProductCount(userId),
            redis.keys(`cart:${userId}:*`),
        ]);

        if (keys.length !== dbCartsCount) {
            await this.drop(userId);

            const dbCarts = await userCartQueries.getUserCart(userId);
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
        size,
        color,
    }: {
        userId: string;
        productId: string;
        size?: Product["sizes"][number]["name"];
        color?: string;
    }) {
        const keyArray = ["cart", userId, productId];

        if (size && color) keyArray.push(size, color);
        else if (size) keyArray.push(size, "*");
        else if (color) keyArray.push("*", color);
        else keyArray.push("*");

        const key = keyArray.join(":");

        const cachedCart = await redis.get(key);

        if (!cachedCart) {
            const dbCart = await userCartQueries.getProductInCart({
                userId,
                productId,
                size,
                color,
            });
            if (!dbCart) return null;

            const cachedCart = cachedCartSchema.parse(dbCart);

            await this.add(cachedCart);
            return cachedCart;
        }

        return cachedCartSchema.parse(parseToJSON(cachedCart));
    }

    async add(cart: CachedCart) {
        const key = `cart:${cart.userId}:${cart.productId}:${cart.size}${cart.color ? `:${cart.color.hex}` : ""}`;

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
                const key = `cart:${cart.userId}:${cart.productId}:${cart.size}${cart.color ? `:${cart.color.hex}` : ""}`;

                pipeline.set(key, JSON.stringify(cart), "EX", 60 * 60 * 24 * 7);
            })
        );

        return pipeline.exec();
    }

    async remove({
        userId,
        productId,
        size,
        color,
    }: {
        userId: string;
        productId: string;
        size: string;
        color?: string;
    }) {
        const keyArray = ["cart", userId, productId, size];

        if (color) keyArray.push(color);
        const key = keyArray.join(":");

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
