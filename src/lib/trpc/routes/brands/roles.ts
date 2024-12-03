import { BitFieldBrandPermission } from "@/config/permissions";
import { brandCache, userCache } from "@/lib/redis/methods";
import {
    createTRPCRouter,
    isTRPCAuth,
    protectedProcedure,
} from "@/lib/trpc/trpc";
import { generateBrandRoleSlug } from "@/lib/utils";
import {
    createRoleSchema,
    roleSchema,
    updateRoleSchema,
} from "@/lib/validations";
import { TRPCError } from "@trpc/server";
import { and, eq, gt, inArray, sql } from "drizzle-orm";
import { z } from "zod";

export const rolesRouter = createTRPCRouter({
    getRoles: protectedProcedure
        .input(
            z.object({
                id: z.string(),
            })
        )
        .use(isTRPCAuth(BitFieldBrandPermission.MANAGE_ROLES, "all", "brand"))
        .query(async ({ input }) => {
            const { id } = input;

            const existingBrand = await brandCache.get(id);
            if (!existingBrand)
                throw new TRPCError({
                    code: "NOT_FOUND",
                    message: "Brand not found",
                });

            return existingBrand.roles;
        }),
    createRole: protectedProcedure
        .input(createRoleSchema.extend({ brandId: z.string() }))
        .use(isTRPCAuth(BitFieldBrandPermission.MANAGE_ROLES, "all", "brand"))
        .mutation(async ({ ctx, input }) => {
            const { db, schemas } = ctx;
            const { brandId, name } = input;

            const existingBrand = await brandCache.get(brandId);
            if (!existingBrand)
                throw new TRPCError({
                    code: "NOT_FOUND",
                    message: "Brand not found",
                });

            const slug = generateBrandRoleSlug(name, brandId);

            const existingRole = existingBrand.roles.find(
                (role) => role.slug === slug
            );
            if (existingRole)
                throw new TRPCError({
                    code: "CONFLICT",
                    message: "Another role with the same name exists",
                });

            const brandRolesCount = await db.$count(
                schemas.brandRoles,
                eq(schemas.brandRoles.brandId, brandId)
            );

            const newRole = await db.transaction(async (tx) => {
                const role = await tx
                    .insert(schemas.roles)
                    .values({
                        ...input,
                        slug,
                        position: +brandRolesCount + 1,
                    })
                    .returning()
                    .then((res) => res[0]);

                await Promise.all([
                    tx.insert(schemas.brandRoles).values({
                        brandId,
                        roleId: role.id,
                    }),
                    brandCache.remove(brandId),
                ]);

                return role;
            });

            return newRole;
        }),
    updateRole: protectedProcedure
        .input(
            z.object({
                roleId: z.string(),
                brandId: z.string(),
                data: updateRoleSchema,
            })
        )
        .use(isTRPCAuth(BitFieldBrandPermission.MANAGE_ROLES, "all", "brand"))
        .mutation(async ({ ctx, input }) => {
            const { queries } = ctx;
            const { roleId, brandId, data } = input;

            const existingBrand = await brandCache.get(brandId);
            if (!existingBrand)
                throw new TRPCError({
                    code: "NOT_FOUND",
                    message: "Brand not found",
                });

            const existingRole = existingBrand.roles.find(
                (role) => role.id === roleId
            );
            if (!existingRole)
                throw new TRPCError({
                    code: "NOT_FOUND",
                    message: "Role not found",
                });

            const slug = generateBrandRoleSlug(data.name, brandId);

            const existingOtherRole = existingBrand.roles.find(
                (role) => role.slug === slug && role.id !== roleId
            );
            if (existingOtherRole)
                throw new TRPCError({
                    code: "CONFLICT",
                    message: "Another role with the same name exists",
                });

            const [updatedRole] = await Promise.all([
                queries.roles.updateRole(roleId, {
                    ...data,
                    slug,
                }),
                brandCache.remove(brandId),
            ]);

            return updatedRole;
        }),
    reorderRoles: protectedProcedure
        .input(
            z.object({
                id: z.string(),
                roles: z.array(
                    roleSchema.omit({
                        isSiteRole: true,
                    })
                ),
            })
        )
        .use(isTRPCAuth(BitFieldBrandPermission.MANAGE_ROLES, "all", "brand"))
        .mutation(async ({ ctx, input }) => {
            const { db, schemas } = ctx;
            const { id, roles } = input;

            const existingBrand = await brandCache.get(id);
            if (!existingBrand)
                throw new TRPCError({
                    code: "NOT_FOUND",
                    message: "Brand not found",
                });

            if (existingBrand.roles.length !== roles.length)
                throw new TRPCError({
                    code: "BAD_REQUEST",
                    message: "Invalid roles",
                });

            await db.transaction(async (tx) => {
                for (const role of roles) {
                    await tx
                        .update(schemas.roles)
                        .set({ position: role.position })
                        .where(eq(schemas.roles.id, role.id));
                }

                await brandCache.remove(id);
            });

            return true;
        }),
    deleteRole: protectedProcedure
        .input(
            z.object({
                roleId: z.string(),
                brandId: z.string(),
            })
        )
        .use(isTRPCAuth(BitFieldBrandPermission.MANAGE_ROLES, "all", "brand"))
        .mutation(async ({ ctx, input }) => {
            const { db, schemas } = ctx;
            const { roleId, brandId } = input;

            const existingBrand = await brandCache.get(brandId);
            if (!existingBrand)
                throw new TRPCError({
                    code: "NOT_FOUND",
                    message: "Brand not found",
                });

            const existingRole = existingBrand.roles.find(
                (role) => role.id === roleId
            );
            if (!existingRole)
                throw new TRPCError({
                    code: "NOT_FOUND",
                    message: "Role not found",
                });

            await db.transaction(async (tx) => {
                await Promise.all([
                    tx
                        .delete(schemas.roles)
                        .where(eq(schemas.roles.id, roleId)),
                    tx
                        .update(schemas.roles)
                        .set({ position: sql`${schemas.roles.position} - 1` })
                        .where(
                            and(
                                eq(schemas.roles.isSiteRole, false),
                                inArray(
                                    schemas.roles.id,
                                    existingBrand.roles
                                        .filter((role) => role.id !== roleId)
                                        .map((role) => role.id)
                                ),
                                gt(
                                    schemas.roles.position,
                                    existingRole.position
                                )
                            )
                        ),
                    brandCache.remove(brandId),
                    userCache.drop(),
                ]);
            });
        }),
});
