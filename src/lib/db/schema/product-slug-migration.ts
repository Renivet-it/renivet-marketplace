import {
    index,
    jsonb,
    pgTable,
    text,
    timestamp,
    uniqueIndex,
    uuid,
} from "drizzle-orm/pg-core";
import { products } from "./product";

export const productSlugHistory = pgTable(
    "product_slug_history",
    {
        id: uuid("id").primaryKey().defaultRandom(),
        productId: uuid("product_id")
            .notNull()
            .references(() => products.id, { onDelete: "restrict" }),
        oldSlug: text("old_slug").notNull(),
        newSlug: text("new_slug").notNull(),
        runId: uuid("run_id").notNull(),
        batchId: uuid("batch_id").notNull(),
        actorId: text("actor_id").notNull(),
        migratedAt: timestamp("migrated_at").defaultNow().notNull(),
    },
    (table) => ({
        oldSlugUnique: uniqueIndex("product_slug_history_old_slug_unique").on(
            table.oldSlug
        ),
        productIdIdx: index("product_slug_history_product_id_idx").on(
            table.productId
        ),
        runIdIdx: index("product_slug_history_run_id_idx").on(table.runId),
    })
);

export const productSlugMigrationRuns = pgTable(
    "product_slug_migration_runs",
    {
        id: uuid("id").primaryKey().defaultRandom(),
        manifestHash: text("manifest_hash").notNull(),
        actorId: text("actor_id").notNull(),
        status: text("status").notNull(),
        expiresAt: timestamp("expires_at").notNull(),
        manifest: jsonb("manifest").notNull(),
        counts: jsonb("counts").notNull(),
        createdAt: timestamp("created_at").defaultNow().notNull(),
        updatedAt: timestamp("updated_at").defaultNow().notNull(),
    },
    (table) => ({
        manifestHashIdx: index(
            "product_slug_migration_runs_manifest_hash_idx"
        ).on(table.manifestHash),
        actorIdIdx: index("product_slug_migration_runs_actor_id_idx").on(
            table.actorId
        ),
    })
);

export const productSlugMigrationBatches = pgTable(
    "product_slug_migration_batches",
    {
        id: uuid("id").primaryKey().defaultRandom(),
        runId: uuid("run_id")
            .notNull()
            .references(() => productSlugMigrationRuns.id, {
                onDelete: "cascade",
            }),
        batchNumber: text("batch_number").notNull(),
        status: text("status").notNull(),
        counts: jsonb("counts").notNull(),
        error: text("error"),
        startedAt: timestamp("started_at"),
        completedAt: timestamp("completed_at"),
    },
    (table) => ({
        runBatchUnique: uniqueIndex(
            "product_slug_migration_run_batch_unique"
        ).on(table.runId, table.batchNumber),
        runIdIdx: index("product_slug_migration_batches_run_id_idx").on(
            table.runId
        ),
    })
);
