import { relations, sql } from "drizzle-orm";
import {
    check,
    date,
    index,
    integer,
    pgTable,
    text,
    timestamp,
    uniqueIndex,
    uuid,
} from "drizzle-orm/pg-core";
import { timestamps } from "../helper";
import { brands } from "./brand";
import { users } from "./user";

export const brandAgreements = pgTable(
    "brand_agreements",
    {
        id: uuid("id").primaryKey().notNull().defaultRandom(),
        brandId: uuid("brand_id")
            .notNull()
            .references(() => brands.id, { onDelete: "restrict" }),
        version: integer("version").notNull(),
        fileKey: text("file_key").notNull(),
        fileName: text("file_name").notNull(),
        contentType: text("content_type").notNull(),
        fileSizeBytes: integer("file_size_bytes").notNull(),
        signedDate: date("signed_date").notNull(),
        effectiveDate: date("effective_date").notNull(),
        expiryDate: date("expiry_date"),
        status: text("status", {
            enum: ["draft", "active", "expired", "superseded"],
        })
            .notNull()
            .default("active"),
        uploadedBy: text("uploaded_by").references(() => users.id, {
            onDelete: "set null",
        }),
        ...timestamps,
    },
    (table) => ({
        brandAgreementVersionUnique: uniqueIndex(
            "brand_agreements_brand_version_unique"
        ).on(table.brandId, table.version),
        brandAgreementBrandIdx: index("brand_agreements_brand_idx").on(
            table.brandId
        ),
        brandAgreementStatusIdx: index("brand_agreements_status_idx").on(
            table.status
        ),
        brandAgreementDateCheck: check(
            "brand_agreements_expiry_after_effective_check",
            sql`${table.expiryDate} IS NULL OR ${table.expiryDate} >= ${table.effectiveDate}`
        ),
        brandAgreementSizeCheck: check(
            "brand_agreements_file_size_check",
            sql`${table.fileSizeBytes} > 0 AND ${table.fileSizeBytes} <= 16777216`
        ),
    })
);

export const brandAgreementRelations = relations(brandAgreements, ({ one }) => ({
    brand: one(brands, {
        fields: [brandAgreements.brandId],
        references: [brands.id],
    }),
    uploader: one(users, {
        fields: [brandAgreements.uploadedBy],
        references: [users.id],
    }),
}));
