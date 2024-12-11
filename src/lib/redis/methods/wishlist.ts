import { userWishlistQueries } from "@/lib/db/queries";
import { parseToJSON } from "@/lib/utils";
import { CachedWishlist, cachedWishlistSchema } from "@/lib/validations";
import { redis } from "..";

class UserWishlistCache {
    async get(userId: string) {
        const [dbWishlistsCount, keys] = await Promise.all([
            userWishlistQueries.getUserWishlistCount(userId),
            redis.keys(`wishlist:${userId}:*`),
        ]);

        if (keys.length !== dbWishlistsCount) {
            await this.drop(userId);

            const dbWishlists =
                await userWishlistQueries.getUserWishlist(userId);
            if (!dbWishlists.length) return [];

            const cachedWishlists = cachedWishlistSchema
                .array()
                .parse(dbWishlists)
                .sort(
                    (a, b) =>
                        new Date(b.createdAt).getTime() -
                        new Date(a.createdAt).getTime()
                );

            await this.addBulk(cachedWishlists);
            return cachedWishlists;
        }
        if (!keys.length) return [];

        const cachedWishlists = await redis.mget(...keys);
        return cachedWishlistSchema.array().parse(
            cachedWishlists
                .map((sub) => parseToJSON<CachedWishlist>(sub))
                .filter((sub): sub is CachedWishlist => sub !== null)
                .sort(
                    (a, b) =>
                        new Date(b.createdAt).getTime() -
                        new Date(a.createdAt).getTime()
                )
        );
    }

    async getProduct(userId: string, productId: string) {
        const key = `wishlist:${userId}:${productId}`;
        const cachedWishlist = await redis.get(key);

        if (!cachedWishlist) {
            const dbWishlist = await userWishlistQueries.getProductInWishlist(
                userId,
                productId
            );
            if (!dbWishlist) return null;

            const cachedWishlist = cachedWishlistSchema.parse(dbWishlist);

            await this.add(cachedWishlist);
            return dbWishlist;
        }

        return cachedWishlistSchema.parse(parseToJSON(cachedWishlist));
    }

    async add(wishlist: CachedWishlist) {
        return await redis.set(
            `wishlist:${wishlist.userId}:${wishlist.productId}`,
            JSON.stringify(wishlist),
            "EX",
            60 * 60 * 24 * 7
        );
    }

    async addBulk(wishlists: CachedWishlist[]) {
        const pipeline = redis.pipeline();

        await Promise.all(
            wishlists.map((wishlist) => {
                pipeline.set(
                    `wishlist:${wishlist.userId}:${wishlist.productId}`,
                    JSON.stringify(wishlist),
                    "EX",
                    60 * 60 * 24 * 7
                );
            })
        );

        return await pipeline.exec();
    }

    async remove(userId: string, productId: string) {
        return await redis.del(`wishlist:${userId}:${productId}`);
    }

    async drop(userId: string) {
        const keys = await redis.keys(`wishlist:${userId}:*`);
        if (!keys.length) return 0;
        return await redis.del(...keys);
    }

    async dropAll() {
        const keys = await redis.keys("wishlist:*");
        if (!keys.length) return 0;
        return await redis.del(...keys);
    }
}

export const userWishlistCache = new UserWishlistCache();
