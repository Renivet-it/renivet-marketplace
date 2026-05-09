import { userWithAddressesRolesAndBrandSchema } from "@/lib/validations";
import { desc, eq, ilike } from "drizzle-orm";
import { db } from "..";
import { users } from "../schema";

class UserQuery {
    async getUsers({
        limit,
        page,
        search,
    }: {
        limit: number;
        page: number;
        search?: string;
    }) {
        const data = await db.query.users.findMany({
            where: !!search?.length
                ? ilike(users.email, `%${search}%`)
                : undefined,
            with: {
                addresses: true,
                roles: {
                    with: {
                        role: true,
                    },
                },
                brand: true,
            },
            limit,
            offset: (page - 1) * limit,
            orderBy: [desc(users.createdAt)],
            extras: {
                count: db
                    .$count(
                        users,
                        !!search?.length
                            ? ilike(users.email, `%${search}%`)
                            : undefined
                    )
                    .as("user_count"),
            },
        });

        const parsed = userWithAddressesRolesAndBrandSchema.array().parse(
            data.map((user) => ({
                ...user,
                email: user.email ?? "",
                roles: user.roles.map((role) => role.role),
                brand: user?.brand ?? null,
            }))
        );

        return {
            data: parsed,
            count: +data?.[0]?.count || 0,
        };
    }

    async getAllUsers({ search }: { search?: string } = {}) {
        const data = await db.query.users.findMany({
            where: !!search?.length
                ? ilike(users.email, `%${search}%`)
                : undefined,
            with: {
                addresses: true,
                roles: {
                    with: {
                        role: true,
                    },
                },
                brand: true,
            },
            orderBy: [desc(users.createdAt)],
        });

        return userWithAddressesRolesAndBrandSchema
            .array()
            .parse(
                data.map((user) => ({
                    ...user,
                    email: user.email ?? "",
                    roles: user.roles.map((role) => role.role),
                    brand: user?.brand ?? null,
                }))
            );
    }

    async getUser(id: string) {
        const user = await db.query.users.findFirst({
            where: eq(users.id, id),
            with: {
                addresses: true,
                roles: {
                    with: {
                        role: true,
                    },
                },
                brand: true,
                brandMember: {
                    with: {
                        brand: true,
                    },
                },
            },
        });
        if (!user) return null;

        return userWithAddressesRolesAndBrandSchema.parse({
            ...user,
            email: user.email ?? "",
            roles: user.roles.map((role) => role.role),
            brand: user?.brand ?? user?.brandMember?.brand ?? null,
        });
    }
}

export const userQueries = new UserQuery();
