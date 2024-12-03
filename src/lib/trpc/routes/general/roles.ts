import { BitFieldSitePermission } from "@/config/permissions";
import { roleCache, userCache } from "@/lib/redis/methods";
import {
    createTRPCRouter,
    isTRPCAuth,
    protectedProcedure,
} from "@/lib/trpc/trpc";
import { slugify } from "@/lib/utils";
import {
    createRoleSchema,
    reorderRolesSchema,
    updateRoleSchema,
} from "@/lib/validations";
import { TRPCError } from "@trpc/server";
import { and, eq, gt, sql } from "drizzle-orm";
import { z } from "zod";

export const rolesRouter = createTRPCRouter({
    getRoles: protectedProcedure
        .use(isTRPCAuth(BitFieldSitePermission.VIEW_ROLES))
        .query(async () => {
            const cachedRoles = await roleCache.getAll();
            return cachedRoles
                .filter((role) => role.isSiteRole)
                .sort((a, b) => a.position - b.position);
        }),
    getRole: protectedProcedure
        .input(
            z.object({
                id: z.string(),
            })
        )
        .use(isTRPCAuth(BitFieldSitePermission.VIEW_ROLES))
        .query(async ({ input }) => {
            const { id } = input;

            const cachedRole = await roleCache.get(id);
            return cachedRole;
        }),
    createRole: protectedProcedure
        .input(createRoleSchema)
        .use(isTRPCAuth(BitFieldSitePermission.MANAGE_ROLES))
        .mutation(async ({ ctx, input }) => {
            const { queries } = ctx;

            const slug = slugify(input.name);

            const [cachedRoles, existingRole] = await Promise.all([
                roleCache.getAll(),
                queries.roles.getRoleBySlug(slug),
            ]);
            if (existingRole)
                throw new TRPCError({
                    code: "CONFLICT",
                    message: "Another role with the same name exists",
                });

            const newRole = await queries.roles.createRole({
                ...input,
                slug,
                position: cachedRoles.length + 1,
            });

            await roleCache.add({
                ...newRole,
                users: 0,
            });

            return newRole;
        }),
    updateRole: protectedProcedure
        .input(
            z.object({
                id: z.string(),
                data: updateRoleSchema,
            })
        )
        .use(isTRPCAuth(BitFieldSitePermission.MANAGE_ROLES))
        .mutation(async ({ ctx, input }) => {
            const { queries } = ctx;
            const { id, data } = input;

            const existingRole = await roleCache.get(id);
            if (!existingRole)
                throw new TRPCError({
                    code: "NOT_FOUND",
                    message: "Role not found",
                });

            const slug = slugify(data.name);

            const existingOtherRole = await queries.roles.getOtherRole(
                slug,
                id
            );
            if (existingOtherRole)
                throw new TRPCError({
                    code: "CONFLICT",
                    message: "Another role with the same name exists",
                });

            const [updatedRole] = await Promise.all([
                queries.roles.updateRole(id, {
                    ...data,
                    slug,
                }),
                roleCache.remove(id),
            ]);

            return updatedRole;
        }),
    reorderRoles: protectedProcedure
        .input(reorderRolesSchema)
        .use(isTRPCAuth(BitFieldSitePermission.MANAGE_ROLES))
        .mutation(async ({ ctx, input }) => {
            const { db, schemas } = ctx;

            const existingRoles = await roleCache.getAll();
            if (existingRoles.length !== input.length)
                throw new TRPCError({
                    code: "BAD_REQUEST",
                    message: "Invalid data",
                });

            await db.transaction(async (tx) => {
                for (const role of input) {
                    await tx
                        .update(schemas.roles)
                        .set({ position: role.position })
                        .where(eq(schemas.roles.id, role.id));
                }

                await roleCache.drop();
            });

            return true;
        }),
    deleteRole: protectedProcedure
        .input(
            z.object({
                id: z.string(),
            })
        )
        .use(isTRPCAuth(BitFieldSitePermission.MANAGE_ROLES))
        .mutation(async ({ ctx, input }) => {
            const { db, schemas } = ctx;
            const { id } = input;

            const existingRoles = await roleCache.getAll();
            const existingRole = existingRoles.find((role) => role.id === id);
            if (!existingRole)
                throw new TRPCError({
                    code: "NOT_FOUND",
                    message: "Role not found",
                });

            await db.transaction(async (tx) => {
                await Promise.all([
                    tx.delete(schemas.roles).where(eq(schemas.roles.id, id)),
                    tx
                        .update(schemas.roles)
                        .set({ position: sql`${schemas.roles.position} - 1` })
                        .where(
                            and(
                                gt(
                                    schemas.roles.position,
                                    existingRole.position
                                ),
                                eq(schemas.roles.isSiteRole, true)
                            )
                        ),
                    roleCache.drop(),
                ]);

                const updateRoles = existingRoles
                    .map((role) =>
                        role.position > existingRole.position
                            ? {
                                  ...role,
                                  position: role.position - 1,
                              }
                            : role
                    )
                    .filter((role) => role.id !== id);

                await Promise.all([
                    roleCache.addBulk(updateRoles),
                    userCache.drop(),
                ]);
            });

            return true;
        }),
});
