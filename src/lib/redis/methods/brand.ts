import { brandQueries } from "@/lib/db/queries";
import { generateCacheKey, parseToJSON } from "@/lib/utils";
import { CachedBrand, cachedBrandSchema } from "@/lib/validations";
import { redis } from "..";

class BrandCache {
    set: any;
    set(id: any, arg1: { delhiveryWarehouseName: string; }) {
        throw new Error("Method not implemented.");
    }
    private genKey: (...args: string[]) => string;

    constructor() {
        this.genKey = generateCacheKey(":", "brand");
    }

    async getAll() {
        const [dbBrandsCount, keys] = await Promise.all([
            brandQueries.getCount(),
            redis.keys(this.genKey("*")),
        ]);

        if (keys.length !== dbBrandsCount) {
            await this.drop();

            const dbBrands = await brandQueries.getAllBrands();
            if (!dbBrands.length) return [];

            const cachedBrands = dbBrands;

            await this.addBulk(cachedBrands);
            return cachedBrands;
        }
        if (!keys.length) return [];

        const cachedBrands = await redis.mget(...keys);
        return cachedBrandSchema
            .array()
            .parse(
                cachedBrands
                    .map((brand) => parseToJSON<CachedBrand>(brand))
                    .filter((brand): brand is CachedBrand => brand !== null)
            );
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

    async addBulk(brands: CachedBrand[]) {
        const pipeline = redis.pipeline();

        await Promise.all(
            brands.map((brand) => {
                pipeline.set(
                    this.genKey(brand.id),
                    JSON.stringify(brand),
                    "EX",
                    60 * 60 * 24 * 7
                );
            })
        );

        await pipeline.exec();
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
