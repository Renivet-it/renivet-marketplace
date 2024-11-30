import { CreateRole, UpdateRole } from "@/lib/validations";
import { and, eq, ne } from "drizzle-orm";
import { db } from "..";
import { roles } from "../schema";

class RoleQuery {
    async getCount() {
        const data = await db.$count(roles, eq(roles.isSiteRole, true));
        return +data || 0;
    }

    async getRoles() {
        const data = await db.query.roles.findMany({
            where: eq(roles.isSiteRole, true),
            with: {
                userRoles: true,
            },
        });

        return data;
    }

    async getRole(id: string) {
        const data = await db.query.roles.findFirst({
            where: eq(roles.id, id),
            with: {
                userRoles: true,
            },
        });

        return data;
    }

    async getRoleBySlug(slug: string) {
        const data = await db.query.roles.findFirst({
            where: and(eq(roles.slug, slug), eq(roles.isSiteRole, true)),
        });

        return data;
    }

    async getOtherRole(slug: string, id: string) {
        const data = await db.query.roles.findFirst({
            where: and(
                eq(roles.slug, slug),
                ne(roles.id, id),
                eq(roles.isSiteRole, true)
            ),
        });

        return data;
    }

    async createRole(
        values: CreateRole & {
            slug: string;
            position: number;
        }
    ) {
        const data = await db
            .insert(roles)
            .values(values)
            .returning()
            .then((res) => res[0]);

        return data;
    }

    async updateRole(id: string, values: UpdateRole) {
        const data = await db
            .update(roles)
            .set({
                ...values,
                updatedAt: new Date(),
            })
            .where(eq(roles.id, id))
            .returning()
            .then((res) => res[0]);

        return data;
    }
}

export const roleQueries = new RoleQuery();
