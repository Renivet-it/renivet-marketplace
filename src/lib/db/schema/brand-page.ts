import { relations } from "drizzle-orm";
import { index, integer, pgTable, text, uuid } from "drizzle-orm/pg-core";
import { timestamps } from "../helper";
import { brands } from "./brand";
import { products } from "./product";

export const brandPageSections = pgTable(
    "brand_page_sections",
    {
        id: uuid("id").primaryKey().notNull().unique().defaultRandom(),
        brandId: uuid("brand_id")
            .notNull()
            .references(() => brands.id, {
                onDelete: "cascade",
            }),
        name: text("name").notNull(),
        description: text("description"),
        position: integer("position").notNull().default(0),
        ...timestamps,
    },
    (table) => ({
        brandPageSectionBrandIdIdx: index(
            "brand_page_section_brand_id_index"
        ).on(table.brandId),
    })
);

export const brandPageSectionProducts = pgTable(
    "brand_section_products",
    {
        id: uuid("id").primaryKey().notNull().unique().defaultRandom(),
        brandPageSectionId: uuid("brand_page_section_id")
            .notNull()
            .references(() => brandPageSections.id, {
                onDelete: "cascade",
            }),
        productId: uuid("product_id")
            .notNull()
            .references(() => products.id, {
                onDelete: "cascade",
            }),
        position: integer("position").notNull().default(0),
        ...timestamps,
    },
    (table) => ({
        brandSectionProductSectionIdIdx: index(
            "brand_section_product_section_id_index"
        ).on(table.brandPageSectionId),
        brandSectionProductProductIdIdx: index(
            "brand_section_product_product_id_index"
        ).on(table.productId),
    })
);

export const brandPageSectionRelations = relations(
    brandPageSections,
    ({ one, many }) => ({
        brand: one(brands, {
            fields: [brandPageSections.brandId],
            references: [brands.id],
        }),
        sectionProducts: many(brandPageSectionProducts),
    })
);

export const brandPageSectionProductRelations = relations(
    brandPageSectionProducts,
    ({ one }) => ({
        section: one(brandPageSections, {
            fields: [brandPageSectionProducts.brandPageSectionId],
            references: [brandPageSections.id],
        }),
        product: one(products, {
            fields: [brandPageSectionProducts.productId],
            references: [products.id],
        }),
    })
);
