import { generateCacheKey, parseToJSON } from "@/lib/utils";
import { CachedRole, cachedRoleSchema } from "@/lib/validations";
import { redis } from "..";

class RoleCache {
    private genKey: (...args: string[]) => string;

    constructor() {
        this.genKey = generateCacheKey(":", "role");
    }

    async getAll() {
        const keys = await redis.keys(this.genKey("*"));
        if (!keys.length) return [];
        const roles = await redis.mget(...keys);
        return cachedRoleSchema
            .array()
            .parse(
                roles
                    .map((role) => parseToJSON<CachedRole>(role))
                    .filter((role): role is CachedRole => role !== null)
            );
    }

    async get(id: string) {
        const role = await redis.get(this.genKey(id));
        return cachedRoleSchema.parse(parseToJSON<CachedRole>(role));
    }

    async add(role: CachedRole) {
        return await redis.set(
            this.genKey(role.id),
            JSON.stringify(role),
            "EX",
            60 * 60 * 24 * 7
        );
    }

    async addBulk(roles: CachedRole[]) {
        const pipeline = redis.pipeline();

        await Promise.all(
            roles.map((role) => {
                pipeline.set(
                    this.genKey(role.id),
                    JSON.stringify(role),
                    "EX",
                    60 * 60 * 24 * 7
                );
            })
        );

        return await pipeline.exec();
    }

    async update(role: CachedRole) {
        await this.remove(role.id);
        return await this.add(role);
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

export const roleCache = new RoleCache();
