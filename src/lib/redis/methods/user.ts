import { generateCacheKey, parseToJSON } from "@/lib/utils";
import { CachedUser, cachedUserSchema } from "@/lib/validations";
import { redis } from "..";

class UserCache {
    private genKey: (...args: string[]) => string;

    constructor() {
        this.genKey = generateCacheKey(":", "user");
    }

    async getAll() {
        const keys = await redis.keys(this.genKey("*"));
        if (!keys.length) return [];
        const users = await redis.mget(...keys);
        return cachedUserSchema
            .array()
            .parse(
                users
                    .map((user) => parseToJSON<CachedUser>(user))
                    .filter((user): user is CachedUser => user !== null)
            );
    }

    async get(id: string) {
        const user = await redis.get(this.genKey(id));
        return cachedUserSchema.nullable().parse(parseToJSON<CachedUser>(user));
    }

    async add(user: CachedUser) {
        return await redis.set(
            this.genKey(user.id),
            JSON.stringify(user),
            "EX",
            60 * 60 * 24
        );
    }

    async addBulk(users: CachedUser[]) {
        const pipeline = redis.pipeline();

        await Promise.all(
            users.map((user) => {
                pipeline.set(
                    this.genKey(user.id),
                    JSON.stringify(user),
                    "EX",
                    60 * 60 * 24
                );
            })
        );

        return await pipeline.exec();
    }

    async update(user: CachedUser) {
        await this.remove(user.id);
        return await this.add(user);
    }

    async remove(id: string) {
        return await redis.del(this.genKey(id));
    }

    async drop() {
        const keys = await redis.keys(this.genKey("*"));
        if (!keys.length) return;
        await redis.del(...keys);
    }
}

export const userCache = new UserCache();
