import { generateCacheKey, parseToJSON } from "@/lib/utils";
import { CachedUser } from "@/lib/validations";
import { redis } from "..";

class UserCache {
    private genKey: (...args: string[]) => string;

    constructor() {
        this.genKey = generateCacheKey(":", "user");
    }

    async get(id: string) {
        return parseToJSON<CachedUser>(await redis.get(this.genKey(id)));
    }

    async add(user: CachedUser) {
        return await redis.set(
            this.genKey(user.id),
            JSON.stringify(user),
            "EX",
            60 * 60 * 24
        );
    }

    async update(user: CachedUser) {
        await this.remove(user.id);
        return await this.add(user);
    }

    async remove(id: string) {
        return await redis.del(this.genKey(id));
    }
}

export const userCache = new UserCache();
