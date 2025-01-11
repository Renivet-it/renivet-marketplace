import { relations } from "drizzle-orm";
import { index, integer, pgTable, text, uuid } from "drizzle-orm/pg-core";
import { timestamps } from "../helper";
import { brands } from "./brand";

export const brandMediaItems = pgTable(
    "brand_media_items",
    {
        id: uuid("id").primaryKey().notNull().unique().defaultRandom(),
        brandId: uuid("brand_id")
            .notNull()
            .references(() => brands.id, { onDelete: "cascade" }),
        url: text("url").notNull(),
        type: text("type").notNull(),
        name: text("name").notNull(),
        alt: text("alt"),
        size: integer("size").notNull(),
        ...timestamps,
    },
    (table) => ({
        brandMediaItemBrandIdIdx: index("brand_media_item_brand_id_idx").on(
            table.brandId
        ),
    })
);

export const brandMediaItemRelations = relations(
    brandMediaItems,
    ({ one }) => ({
        bucket: one(brands, {
            fields: [brandMediaItems.brandId],
            references: [brands.id],
        }),
    })
);
