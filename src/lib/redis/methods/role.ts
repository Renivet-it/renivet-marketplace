import { roleQueries } from "@/lib/db/queries";
import { generateCacheKey, parseToJSON } from "@/lib/utils";
import { CachedRole, cachedRoleSchema } from "@/lib/validations";
import { redis } from "..";

class RoleCache {
    private genKey: (...args: string[]) => string;

    constructor() {
        this.genKey = generateCacheKey(":", "role");
    }

    async getAll() {
        const [dbRolesCount, keys] = await Promise.all([
            roleQueries.getCount(),
            redis.keys(this.genKey("*")),
        ]);

        if (keys.length !== dbRolesCount) {
            await this.drop();

            const dbRoles = await roleQueries.getRoles();
            if (!dbRoles.length) return [];

            const cachedRoles = dbRoles.map((role) => ({
                ...role,
                users: role.userRoles.length,
            }));

            await this.addBulk(cachedRoles);
            return cachedRoles;
        }
        if (!keys.length) return [];

        const cachedRoles = await redis.mget(...keys);
        return cachedRoleSchema
            .array()
            .parse(
                cachedRoles
                    .map((role) => parseToJSON<CachedRole>(role))
                    .filter((role): role is CachedRole => role !== null)
            );
    }

    async get(id: string) {
        const cachedRoleRaw = await redis.get(this.genKey(id));
        let cachedRole = cachedRoleSchema
            .nullable()
            .parse(parseToJSON<CachedRole>(cachedRoleRaw));

        if (!cachedRole) {
            const dbRole = await roleQueries.getRole(id);
            if (!dbRole) return null;

            cachedRole = {
                ...dbRole,
                users: dbRole.userRoles.length,
            };

            await this.add(cachedRole);
        }

        return cachedRole;
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
