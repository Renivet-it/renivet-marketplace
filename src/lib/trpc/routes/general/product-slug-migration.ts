import {
    applyProductSlugMigrationBatch,
    getSlugMigrationRun,
    previewProductSlugMigration,
    SLUG_MIGRATION_BATCH_SIZE,
} from "@/lib/services/product-slug-migration";
import { z } from "zod";
import { adminProcedure, createTRPCRouter } from "../../trpc";

export const productSlugMigrationRouter = createTRPCRouter({
    preview: adminProcedure.mutation(({ ctx }) =>
        previewProductSlugMigration(ctx.user.id)
    ),
    getRun: adminProcedure
        .input(z.object({ runId: z.string().uuid() }))
        .query(({ input }) => getSlugMigrationRun(input.runId)),
    applyBatch: adminProcedure
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
    batchSize: adminProcedure.query(() => SLUG_MIGRATION_BATCH_SIZE),
});
