import { hasFinanceAdminAccess } from "@/lib/finance/access";
import {
    applyProductSlugMigrationBatch,
    getSlugMigrationRun,
    previewProductSlugMigration,
    SLUG_MIGRATION_BATCH_SIZE,
} from "@/lib/services/product-slug-migration";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "../../trpc";

const slugMigrationAdminProcedure = protectedProcedure.use(({ ctx, next }) => {
    const allowed = hasFinanceAdminAccess({
        sitePermissions: ctx.user.sitePermissions,
        roles: ctx.user.roles,
    });

    if (!allowed) {
        throw new TRPCError({
            code: "UNAUTHORIZED",
            message: "Administrator access is required",
        });
    }

    return next();
});

export const productSlugMigrationRouter = createTRPCRouter({
    preview: slugMigrationAdminProcedure.mutation(({ ctx }) =>
        previewProductSlugMigration(ctx.user.id)
    ),
    getRun: slugMigrationAdminProcedure
        .input(z.object({ runId: z.string().uuid() }))
        .query(({ input }) => getSlugMigrationRun(input.runId)),
    applyBatch: slugMigrationAdminProcedure
        .input(
            z.object({
                runId: z.string().uuid(),
                manifestHash: z.string().length(64),
                batchNumber: z.number().int().nonnegative(),
                approvedConflictKeys: z.array(z.string()).default([]),
            })
        )
        .mutation(({ ctx, input }) =>
            applyProductSlugMigrationBatch({
                ...input,
                actorId: ctx.user.id,
            })
        ),
    batchSize: slugMigrationAdminProcedure.query(
        () => SLUG_MIGRATION_BATCH_SIZE
    ),
});
