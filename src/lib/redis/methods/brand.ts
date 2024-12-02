import { brandQueries } from "@/lib/db/queries";
import { generateCacheKey, parseToJSON } from "@/lib/utils";
import { CachedBrand, cachedBrandSchema } from "@/lib/validations";
import { redis } from "..";

class BrandCache {
    private genKey: (...args: string[]) => string;

    constructor() {
        this.genKey = generateCacheKey(":", "brand");
    }

    async get(id: string) {
        const cachedBrandRaw = await redis.get(this.genKey(id));
        let cachedBrand = cachedBrandSchema
            .nullable()
            .parse(parseToJSON<CachedBrand>(cachedBrandRaw));

        if (!cachedBrand) {
            const dbBrand = await brandQueries.getBrand(id);
            if (!dbBrand) return null;

            cachedBrand = cachedBrandSchema.parse({
                ...dbBrand,
                createdAt: dbBrand.createdAt.toString(),
                updatedAt: dbBrand.updatedAt.toString(),
            });
            await this.add(cachedBrand);
        }

        return cachedBrand;
    }

    async add(brand: CachedBrand) {
        return await redis.set(
            this.genKey(brand.id),
            JSON.stringify(brand),
            "EX",
            60 * 60 * 24 * 7
        );
    }

    async update(brand: CachedBrand) {
        await this.remove(brand.id);
        return await this.add(brand);
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

export const brandCache = new BrandCache();
