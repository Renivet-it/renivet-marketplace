import { legalQueries } from "@/lib/db/queries";
import { generateCacheKey, parseToJSON } from "@/lib/utils";
import { CachedLegal, cachedLegalSchema } from "@/lib/validations";
import { redis } from "..";

class LegalCache {
    private genKey: (...args: string[]) => string;

    constructor() {
        this.genKey = generateCacheKey(":", "legal");
    }

    async get() {
        const cachedLegalRaw = await redis.get(this.genKey());
        const cachedLegalResult = cachedLegalSchema
            .nullable()
            .safeParse(parseToJSON<CachedLegal>(cachedLegalRaw));
        let cachedLegal = cachedLegalResult.success
            ? cachedLegalResult.data
            : null;

        if (!cachedLegalResult.success && cachedLegalRaw) {
            await this.remove();
        }

        if (!cachedLegal) {
            const dbLegal = await legalQueries.getLegal();
            if (!dbLegal) return null;

            cachedLegal = cachedLegalSchema.parse(dbLegal);
            await this.add(cachedLegal);
        }

        return cachedLegal;
    }

    async add(data: CachedLegal) {
        return await redis.set(this.genKey(), JSON.stringify(data));
    }

    async remove() {
        return await redis.del(this.genKey());
    }
}

export const legalCache = new LegalCache();
