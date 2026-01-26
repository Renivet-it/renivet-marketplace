import { relations } from "drizzle-orm";
import { index, pgTable, text, uuid } from "drizzle-orm/pg-core";
import { timestamps } from "../helper";
import { brands } from "./brand";
import { categories, productTypes, subCategories } from "./category";

/**
 * Search Intent Table
 * Stores keyword-to-intent mappings for the search engine
 * Based on the Phase-1 Intent Table from the Search Engine Flow document
 */
export const searchIntents = pgTable(
    "search_intents",
    {
        id: uuid("id").primaryKey().notNull().unique().defaultRandom(),
        // The keyword that triggers this intent (lowercase, normalized)
        keyword: text("keyword").notNull().unique(),
        // Intent type: CATEGORY, PRODUCT, or BRAND
        intentType: text("intent_type", {
            enum: ["CATEGORY", "PRODUCT", "BRAND"],
        }).notNull(),
        // Pipe-separated category path (e.g., "Women|Bags" or "Men|Bottomwear")
        categoryIds: text("category_ids").notNull(),
        // Priority level for ranking/ordering
        priority: text("priority", {
            enum: ["high", "medium", "low"],
        })
            .notNull()
            .default("medium"),
        // Source of the intent mapping
        source: text("source", {
            enum: ["category", "subcategory", "product_type", "manual"],
        }).notNull(),
        ...timestamps,
    },
    (table) => ({
        searchIntentKeywordIdx: index("search_intent_keyword_idx").on(
            table.keyword
        ),
        searchIntentTypeIdx: index("search_intent_type_idx").on(
            table.intentType
        ),
    })
);

/**
 * Brand Alias Table
 * Stores alternative names/spellings for brands to improve brand detection
 */
export const brandAliases = pgTable(
    "brand_aliases",
    {
        id: uuid("id").primaryKey().notNull().unique().defaultRandom(),
        // Reference to the brand
        brandId: uuid("brand_id")
            .notNull()
            .references(() => brands.id, {
                onDelete: "cascade",
            }),
        // The alias (lowercase, normalized)
        alias: text("alias").notNull(),
        ...timestamps,
    },
    (table) => ({
        brandAliasIdx: index("brand_alias_idx").on(table.alias),
        brandAliasBrandIdIdx: index("brand_alias_brand_id_idx").on(
            table.brandId
        ),
    })
);

/**
 * Search Analytics Table
 * Logs search queries for analytics and intent improvement
 */
export const searchAnalytics = pgTable(
    "search_analytics",
    {
        id: uuid("id").primaryKey().notNull().unique().defaultRandom(),
        // Original query as typed by user
        originalQuery: text("original_query").notNull(),
        // Normalized query
        normalizedQuery: text("normalized_query").notNull(),
        // Detected intent type
        intentType: text("intent_type", {
            enum: ["BRAND", "CATEGORY", "PRODUCT", "UNKNOWN"],
        }).notNull(),
        // Matched brand ID if brand intent
        matchedBrandId: uuid("matched_brand_id").references(() => brands.id, {
            onDelete: "set null",
        }),
        // Matched category ID
        matchedCategoryId: uuid("matched_category_id").references(
            () => categories.id,
            {
                onDelete: "set null",
            }
        ),
        // Matched subcategory ID
        matchedSubcategoryId: uuid("matched_subcategory_id").references(
            () => subCategories.id,
            {
                onDelete: "set null",
            }
        ),
        // Matched product type ID
        matchedProductTypeId: uuid("matched_product_type_id").references(
            () => productTypes.id,
            {
                onDelete: "set null",
            }
        ),
        // Session/user ID for tracking (optional)
        sessionId: text("session_id"),
        userId: text("user_id"),
        // Result count returned
        resultCount: text("result_count"),
        // Clicked product ID (populated on click)
        clickedProductId: uuid("clicked_product_id"),
        ...timestamps,
    },
    (table) => ({
        searchAnalyticsQueryIdx: index("search_analytics_query_idx").on(
            table.normalizedQuery
        ),
        searchAnalyticsIntentIdx: index("search_analytics_intent_idx").on(
            table.intentType
        ),
        searchAnalyticsCreatedIdx: index("search_analytics_created_idx").on(
            table.createdAt
        ),
    })
);

// Relations
export const searchIntentsRelations = relations(searchIntents, () => ({}));

export const brandAliasesRelations = relations(brandAliases, ({ one }) => ({
    brand: one(brands, {
        fields: [brandAliases.brandId],
        references: [brands.id],
    }),
}));

export const searchAnalyticsRelations = relations(
    searchAnalytics,
    ({ one }) => ({
        brand: one(brands, {
            fields: [searchAnalytics.matchedBrandId],
            references: [brands.id],
        }),
        category: one(categories, {
            fields: [searchAnalytics.matchedCategoryId],
            references: [categories.id],
        }),
        subcategory: one(subCategories, {
            fields: [searchAnalytics.matchedSubcategoryId],
            references: [subCategories.id],
        }),
        productType: one(productTypes, {
            fields: [searchAnalytics.matchedProductTypeId],
            references: [productTypes.id],
        }),
    })
);
