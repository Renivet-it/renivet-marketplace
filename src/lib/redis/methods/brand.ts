import { brandQueries } from "@/lib/db/queries";
import { generateCacheKey, parseToJSON } from "@/lib/utils";
import { CachedBrand, cachedBrandSchema } from "@/lib/validations";
import { redis } from "..";

const UUID_PATTERN =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

class BrandCache {
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
        const parsed = cachedBrandSchema
            .array()
            .safeParse(
                cachedBrands
                    .map((brand) => parseToJSON<CachedBrand>(brand))
                    .filter((brand): brand is CachedBrand => brand !== null)
            );

        if (parsed.success) return parsed.data;

        await this.drop();
        const dbBrands = await brandQueries.getAllBrands();
        if (!dbBrands.length) return [];

        await this.addBulk(dbBrands);
        return dbBrands;
    }

    async get(id: string) {
        const cachedBrandRaw = await redis.get(this.genKey(id));
        const cachedBrandJson = parseToJSON<CachedBrand>(cachedBrandRaw);
        const parsedCachedBrand = cachedBrandSchema
            .nullable()
            .safeParse(cachedBrandJson);
        let cachedBrand = parsedCachedBrand.success
            ? parsedCachedBrand.data
            : null;

        if (!parsedCachedBrand.success) {
            await this.remove(id);
        }

        if (!cachedBrand) {
            if (!UUID_PATTERN.test(id)) return null;

            const dbBrand = await brandQueries.getBrand(id);
            if (!dbBrand) return null;

            const parsedDbBrand = cachedBrandSchema.safeParse({
                ...dbBrand,
                createdAt: dbBrand.createdAt.toString(),
                updatedAt: dbBrand.updatedAt.toString(),
            });
            cachedBrand = parsedDbBrand.success
                ? parsedDbBrand.data
                : (dbBrand as CachedBrand);
            await this.add(cachedBrand);
        }

        return cachedBrand;
    }

    async getBySlug(slug: string) {
        const brands = await this.getAll();
        const matchingBrand = brands.find((brand) => brand.slug === slug) ?? null;

        if (!matchingBrand) return null;

        return await this.get(matchingBrand.id);
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
