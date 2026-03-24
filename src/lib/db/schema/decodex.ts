import { relations } from "drizzle-orm";
import {
    boolean,
    index,
    pgTable,
    text,
    uniqueIndex,
    uuid,
} from "drizzle-orm/pg-core";
import { timestamps } from "../helper";
import { brands } from "./brand";
import { subCategories } from "./category";

export const brandSubcategoryDecodeXJourneys = pgTable(
    "brand_subcategory_decodex_journeys",
    {
        id: uuid("id").primaryKey().notNull().unique().defaultRandom(),
        brandId: uuid("brand_id")
            .notNull()
            .references(() => brands.id, { onDelete: "cascade" }),
        subcategoryId: uuid("subcategory_id")
            .notNull()
            .references(() => subCategories.id, { onDelete: "cascade" }),
        mainMaterial: text("main_material"),
        rawMaterialSupplierName: text("raw_material_supplier_name"),
        rawMaterialSupplierLocation: text("raw_material_supplier_location"),
        manufacturerName: text("manufacturer_name"),
        manufacturingLocation: text("manufacturing_location"),
        packingDispatchSource: text("packing_dispatch_source"),
        packingDispatchLocation: text("packing_dispatch_location"),
        virginPlasticUsed: boolean("virgin_plastic_used"),
        supplierDeclarationAvailable: boolean("supplier_declaration_available"),
        certifications: text("certifications"),
        certificationShareable: boolean("certification_shareable"),
        ...timestamps,
    },
    (table) => ({
        decodeXJourneyBrandIdx: index("decodex_journey_brand_idx").on(
            table.brandId
        ),
        decodeXJourneySubcategoryIdx: index("decodex_journey_subcategory_idx").on(
            table.subcategoryId
        ),
        decodeXJourneyBrandSubcategoryUq: uniqueIndex(
            "decodex_journey_brand_subcategory_uq"
        ).on(table.brandId, table.subcategoryId),
    })
);

export const brandSubcategoryDecodeXStories = pgTable(
    "brand_subcategory_decodex_stories",
    {
        id: uuid("id").primaryKey().notNull().unique().defaultRandom(),
        brandId: uuid("brand_id")
            .notNull()
            .references(() => brands.id, { onDelete: "cascade" }),
        subcategoryId: uuid("subcategory_id")
            .notNull()
            .references(() => subCategories.id, { onDelete: "cascade" }),
        storyHuman: text("story_human"),
        storyTruth: text("story_truth"),
        storyImpact: text("story_impact"),
        storyWhy: text("story_why"),
        storyPriceBreakdown: text("story_price_breakdown"),
        ...timestamps,
    },
    (table) => ({
        decodeXStoryBrandIdx: index("decodex_story_brand_idx").on(
            table.brandId
        ),
        decodeXStorySubcategoryIdx: index("decodex_story_subcategory_idx").on(
            table.subcategoryId
        ),
        decodeXStoryBrandSubcategoryUq: uniqueIndex(
            "decodex_story_brand_subcategory_uq"
        ).on(table.brandId, table.subcategoryId),
    })
);

export const brandSubcategoryDecodeXJourneysRelations = relations(
    brandSubcategoryDecodeXJourneys,
    ({ one }) => ({
        brand: one(brands, {
            fields: [brandSubcategoryDecodeXJourneys.brandId],
            references: [brands.id],
        }),
        subcategory: one(subCategories, {
            fields: [brandSubcategoryDecodeXJourneys.subcategoryId],
            references: [subCategories.id],
        }),
    })
);

export const brandSubcategoryDecodeXStoriesRelations = relations(
    brandSubcategoryDecodeXStories,
    ({ one }) => ({
        brand: one(brands, {
            fields: [brandSubcategoryDecodeXStories.brandId],
            references: [brands.id],
        }),
        subcategory: one(subCategories, {
            fields: [brandSubcategoryDecodeXStories.subcategoryId],
            references: [subCategories.id],
        }),
    })
);
