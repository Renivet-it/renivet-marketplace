import { productTypeQueries } from "@/lib/db/queries";
import { generateCacheKey, parseToJSON } from "@/lib/utils";
import { CachedProductType, cachedProductTypeSchema } from "@/lib/validations";
import { redis } from "..";

class ProductTypeCache {
    private genKey: (...args: string[]) => string;

    constructor() {
        this.genKey = generateCacheKey(":", "product-type");
    }

    async getAll(): Promise<CachedProductType[]> {
        const [dbProductTypesCount, keys] = await Promise.all([
            productTypeQueries.getCount(),
            redis.keys(this.genKey("*")),
        ]);

        if (keys.length !== dbProductTypesCount) {
            await this.drop();

            const dbProductTypes = await productTypeQueries.getProductTypes();
            if (!dbProductTypes.length) return [];

            const cachedProductTypes = cachedProductTypeSchema
                .array()
                .parse(
                    dbProductTypes.sort(
                        (a, b) =>
                            new Date(b.createdAt).getTime() -
                            new Date(a.createdAt).getTime()
                    )
                );

            await this.addBulk(cachedProductTypes);
            return cachedProductTypes;
        }
        if (!keys.length) return [];

        const cachedProductTypes = await redis.mget(...keys);
        return cachedProductTypeSchema.array().parse(
            cachedProductTypes
                .map((sub) => parseToJSON<CachedProductType>(sub))
                .filter((sub): sub is CachedProductType => sub !== null)
                .sort(
                    (a, b) =>
                        new Date(b.createdAt).getTime() -
                        new Date(a.createdAt).getTime()
                )
        );
    }

    async get(id: string): Promise<CachedProductType | null> {
        const cachedProductTypeRaw = await redis.get(this.genKey(id));
        let cachedProductType = cachedProductTypeSchema
            .nullable()
            .parse(parseToJSON<CachedProductType>(cachedProductTypeRaw));

        if (!cachedProductType) {
            const dbProductType = await productTypeQueries.getProductType(id);
            if (!dbProductType) return null;

            cachedProductType = cachedProductTypeSchema.parse(dbProductType);
            await this.add(cachedProductType);
        }

        return cachedProductType;
    }

    async add(subCategory: CachedProductType) {
        return await redis.set(
            this.genKey(subCategory.id),
            JSON.stringify(subCategory),
            "EX",
            60 * 60 * 24 * 7
        );
    }

    async addBulk(subCategories: CachedProductType[]) {
        const pipeline = redis.pipeline();

        await Promise.all(
            subCategories.map((sub) => {
                pipeline.set(
                    this.genKey(sub.id),
                    JSON.stringify(sub),
                    "EX",
                    60 * 60 * 24 * 7
                );
            })
        );

        await pipeline.exec();
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

export const productTypeCache = new ProductTypeCache();
