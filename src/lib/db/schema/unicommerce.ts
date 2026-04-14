import { relations } from "drizzle-orm";
import {
    boolean,
    index,
    pgTable,
    text,
    timestamp,
    uniqueIndex,
    uuid,
} from "drizzle-orm/pg-core";
import { timestamps } from "../helper";
import { brands } from "./brand";

export const brandUnicommerceIntegrations = pgTable(
    "brand_unicommerce_integrations",
    {
        id: uuid("id").primaryKey().notNull().defaultRandom(),
        brandId: uuid("brand_id")
            .notNull()
            .references(() => brands.id, { onDelete: "cascade" }),
        tenant: text("tenant"),
        facilityId: text("facility_id"),
        baseUrl: text("base_url"),
        username: text("username").notNull(),
        encryptedPassword: text("encrypted_password").notNull(),
        isActive: boolean("is_active").notNull().default(true),
        lastSyncAt: timestamp("last_sync_at"),
        lastSyncStatus: text("last_sync_status", {
            enum: ["idle", "success", "failed"],
        })
            .notNull()
            .default("idle"),
        lastError: text("last_error"),
        ...timestamps,
    },
    (table) => ({
        brandUnicommerceIntegrationBrandIdUniqueIdx: uniqueIndex(
            "brand_unicommerce_integration_brand_id_unique_idx"
        ).on(table.brandId),
        brandUnicommerceIntegrationActiveIdx: index(
            "brand_unicommerce_integration_active_idx"
        ).on(table.isActive),
        brandUnicommerceIntegrationSyncStatusIdx: index(
            "brand_unicommerce_integration_sync_status_idx"
        ).on(table.lastSyncStatus),
    })
);

export const brandUnicommerceIntegrationsRelations = relations(
    brandUnicommerceIntegrations,
    ({ one }) => ({
        brand: one(brands, {
            fields: [brandUnicommerceIntegrations.brandId],
            references: [brands.id],
        }),
    })
);