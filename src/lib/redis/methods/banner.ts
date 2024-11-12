import { generateCacheKey, parseToJSON } from "@/lib/utils";
import { CachedBanner, cachedBannerSchema } from "@/lib/validations";
import { redis } from "..";

class BannerCache {
    private genKey: (...args: string[]) => string;

    constructor() {
        this.genKey = generateCacheKey(":", "banner");
    }

    async getAll() {
        const keys = await redis.keys(this.genKey("*"));
        if (!keys.length) return [];

        const banners = await redis.mget(...keys);
        return cachedBannerSchema
            .array()
            .parse(
                banners
                    .map((banner) => parseToJSON<CachedBanner>(banner))
                    .filter((banner): banner is CachedBanner => banner !== null)
            );
    }

    async get(id: string) {
        const banner = await redis.get(this.genKey(id));
        return cachedBannerSchema.parse(parseToJSON<CachedBanner>(banner));
    }

    async add(banner: CachedBanner) {
        return await redis.set(this.genKey(banner.id), JSON.stringify(banner));
    }

    async addBulk(banners: CachedBanner[]) {
        const pipeline = redis.pipeline();

        await Promise.all(
            banners.map((banner) => {
                pipeline.set(this.genKey(banner.id), JSON.stringify(banner));
            })
        );

        return await pipeline.exec();
    }

    async update(banner: CachedBanner) {
        await this.remove(banner.id);
        return await this.add(banner);
    }

    async remove(id: string) {
        return await redis.del(this.genKey(id));
    }

    async drop() {
        const keys = await redis.keys(this.genKey("*"));
        if (!keys.length) return 0;
        return await redis.del(...keys);
    }
}

export const bannerCache = new BannerCache();
