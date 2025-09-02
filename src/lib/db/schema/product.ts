import { ProductJourneyData, ProductMedia, ProductOptionValue, ProductValueData } from "@/lib/validations";
import { relations, sql } from "drizzle-orm";
import { boolean, index, integer, jsonb, pgTable, text, timestamp, uuid, vector } from "drizzle-orm/pg-core";
import { timestamps } from "../helper";
import { brands } from "./brand";
import { categories, productTypes, subCategories } from "./category";
import { orderItems } from "./order";
import { users } from "./user";


export const products = pgTable(
    "products",
    {
        // BASIC INFO
        id: uuid("id").primaryKey().notNull().unique().defaultRandom(),
        title: text("title").notNull(),
        slug: text("slug").notNull().unique(),
        description: text("description"),
        brandId: uuid("brand_id")
            .notNull()
            .references(() => brands.id, { onDelete: "cascade" }),
        isAvailable: boolean("is_available").default(true).notNull(),
        isActive: boolean("is_active").default(true).notNull(),
        isPublished: boolean("is_published").default(true).notNull(),
        publishedAt: timestamp("published_at").defaultNow(),
        media: jsonb("media").$type<ProductMedia[]>().default([]).notNull(),
        sustainabilityCertificate: text("sustainability_certificate"),
        productHasVariants: boolean("product_has_variants")
            .default(false)
            .notNull(),

        // CATEGORY
        categoryId: uuid("category_id")
            .notNull()
            .references(() => categories.id, { onDelete: "cascade" }),
        subcategoryId: uuid("subcategory_id")
            .notNull()
            .references(() => subCategories.id, { onDelete: "cascade" }),
        productTypeId: uuid("product_type_id")
            .notNull()
            .references(() => productTypes.id, { onDelete: "cascade" }),

        // PRICING
        price: integer("price"),
        compareAtPrice: integer("compare_at_price"),
        costPerItem: integer("cost_per_item"),

        // INVENTORY
        nativeSku: text("native_sku"),
        sku: text("sku"),
        barcode: text("barcode"),
        quantity: integer("quantity"),

        // SHIPPING
        weight: integer("weight"),
        length: integer("length"),
        width: integer("width"),
        height: integer("height"),
        originCountry: text("origin_country"),
        hsCode: text("hs_code"),

        // SEO
        metaTitle: text("meta_title"),
        metaDescription: text("meta_description"),
        metaKeywords: text("meta_keywords").array().default([]),


        //additional info
        sizeAndFit: text("size_and_fit"),
        materialAndCare: text("material_and_care"),

        // OTHER
        verificationStatus: text("verification_status", {
            enum: ["idle", "pending", "approved", "rejected"],
        })
            .notNull()
            .default("approved"),
        isDeleted: boolean("is_deleted").default(false).notNull(),
        deletedAt: timestamp("deleted_at"),
        rejectedAt: timestamp("rejected_at"),
        rejectionReason: text("rejection_reason"),
        lastReviewedAt: timestamp("last_reviewed_at"),
        isFeaturedMen: boolean("is_featured_men").default(false), // optional now
isFeaturedWomen: boolean("is_featured_women").default(false),
        isStyleWithSubstanceMen: boolean("is_style_with_substance_men").default(false), // optional now
isStyleWithSubstanceWoMen: boolean("is_style_with_substance_women").default(false),
iskidsFetchSection: boolean("is_kids_fetch_product").default(false),
isHomeAndLivingSectionTopPicks: boolean("is_home_living_top_picks").default(false),
isHomeAndLivingSectionNewArrival: boolean("is_home_living_new_Arrivals").default(false),
isBeautyTopPicks: boolean("is_beauty_top_picks").default(false),
isBeautyNewArrival: boolean("is_beauty_new_Arrivals").default(false),
isHomeNewArrival: boolean("is_home_new_Arrivals").default(false),
isAddedInEventProductPage: boolean("is_added_in_event_product_page").default(false),
        embeddings: vector("embeddings", { dimensions: 384 }),
        ...timestamps,
    },
    (table) => ({
        productSkuIdx: index("product_sku_idx").on(table.sku),
        // productFtsIdx: index("product_fts_idx").using(
        //     "gin",
        //     sql`(
        //     setweight(to_tsvector('english', ${table.title}), 'A') ||
        //     setweight(to_tsvector('english', ${table.description}), 'B')
        // )`
        // ),
            productEmbeddingIdx: index("product_embedding_idx").using(
        "ivfflat",
        sql`${table.embeddings} vector_cosine_ops`
    ).with({
        lists: 100 // Adjust based on your dataset size
    })
    })
);
export const productEvents = pgTable(
    "product_events",
    {
        id: uuid("id").primaryKey().notNull().defaultRandom(),
        productId: uuid("product_id")
            .notNull()
            .references(() => products.id, { onDelete: "cascade" }),
        brandId: uuid("brand_id")
            .notNull()
            .references(() => brands.id, { onDelete: "cascade" }),
        userId: text("user_id"),
        event: text("event", { enum: ["click", "view", "purchase", "add_to_cart"] }).notNull(),
        createdAt: timestamp("created_at").defaultNow().notNull(),
    },
    (t) => ({
        idxEvent: index("product_events_event_idx").on(t.event),
        idxProdEvent: index("product_events_product_event_idx").on(
            t.productId,
            t.event
        ),
        idxBrandEvent: index("product_events_brand_event_idx").on(
            t.brandId,
            t.event
        ),
        idxCreatedAt: index("product_events_created_at_idx").on(t.createdAt),
    })
);
export const womenPageFeaturedProducts = pgTable(
    "women_page_featured_products",
    {
        id: uuid("id").primaryKey().notNull().unique().defaultRandom(),
        productId: uuid("product_id")
            .notNull()
            .references(() => products.id, { onDelete: "cascade" }),
        isDeleted: boolean("is_deleted").default(false).notNull(),
        deletedAt: timestamp("deleted_at"),
        ...timestamps,
    }
);

export const menPageFeaturedProducts = pgTable(
    "men_page_featured_products",
    {
        id: uuid("id").primaryKey().notNull().unique().defaultRandom(),
        productId: uuid("product_id")
            .notNull()
            .references(() => products.id, { onDelete: "cascade" }),
        isDeleted: boolean("is_deleted").default(false).notNull(),
        deletedAt: timestamp("deleted_at"),
        ...timestamps,
    },
);

export const womenStyleWithSubstanceMiddlePageSection = pgTable(
    "women_style_with_substance_middle_page_section",
    {
        id: uuid("id").primaryKey().notNull().unique().defaultRandom(),
        productId: uuid("product_id")
            .notNull()
            .references(() => products.id, { onDelete: "cascade" }),
        isDeleted: boolean("is_deleted").default(false).notNull(),
        deletedAt: timestamp("deleted_at"),
        ...timestamps,
    },
);

export const menCuratedHerEssence = pgTable(
    "men_style_with_substance",
    {
        id: uuid("id").primaryKey().notNull().unique().defaultRandom(),
        productId: uuid("product_id")
            .notNull()
            .references(() => products.id, { onDelete: "cascade" }),
        isDeleted: boolean("is_deleted").default(false).notNull(),
        deletedAt: timestamp("deleted_at"),
        ...timestamps,
    },
);

export const kidsFreshCollectionSection = pgTable(
    "kids_fresh_collection_section",
    {
        id: uuid("id").primaryKey().notNull().unique().defaultRandom(),
        productId: uuid("product_id")
            .notNull()
            .references(() => products.id, { onDelete: "cascade" }),
        isDeleted: boolean("is_deleted").default(false).notNull(),
        deletedAt: timestamp("deleted_at"),
        ...timestamps,
    },
);

export const homeandlivingNewArrival = pgTable(
    "home_and_living_new_arrival",
    {
        id: uuid("id").primaryKey().notNull().unique().defaultRandom(),
        productId: uuid("product_id")
            .notNull()
            .references(() => products.id, { onDelete: "cascade" }),
        isDeleted: boolean("is_deleted").default(false).notNull(),
        deletedAt: timestamp("deleted_at"),
        ...timestamps,
    },
);

export const homeandlivingTopPicks = pgTable(
    "home_living_top_picks",
    {
        id: uuid("id").primaryKey().notNull().unique().defaultRandom(),
        productId: uuid("product_id")
            .notNull()
            .references(() => products.id, { onDelete: "cascade" }),
        isDeleted: boolean("is_deleted").default(false).notNull(),
        deletedAt: timestamp("deleted_at"),
        ...timestamps,
    },
);

export const beautyNewArrivals = pgTable(
    "beauty_new_arrivals",
    {
        id: uuid("id").primaryKey().notNull().unique().defaultRandom(),
        productId: uuid("product_id")
            .notNull()
            .references(() => products.id, { onDelete: "cascade" }),
        isDeleted: boolean("is_deleted").default(false).notNull(),
        deletedAt: timestamp("deleted_at"),
        ...timestamps,
    },
);

export const homeNewArrivals = pgTable(
    "home_new_arrivals",
    {
        id: uuid("id").primaryKey().notNull().unique().defaultRandom(),
        productId: uuid("product_id")
            .notNull()
            .references(() => products.id, { onDelete: "cascade" }),
        isDeleted: boolean("is_deleted").default(false).notNull(),
        deletedAt: timestamp("deleted_at"),
        ...timestamps,
    },
);

export const beautyTopPicks = pgTable(
    "beauty_top_picks",
    {
        id: uuid("id").primaryKey().notNull().unique().defaultRandom(),
        productId: uuid("product_id")
            .notNull()
            .references(() => products.id, { onDelete: "cascade" }),
        isDeleted: boolean("is_deleted").default(false).notNull(),
        deletedAt: timestamp("deleted_at"),
        ...timestamps,
    },
);

export const newProductEventPage = pgTable(
    "new_product_event_page",
    {
        id: uuid("id").primaryKey().notNull().unique().defaultRandom(),
        productId: uuid("product_id")
            .notNull()
            .references(() => products.id, { onDelete: "cascade" }),
        isDeleted: boolean("is_deleted").default(false).notNull(),
        deletedAt: timestamp("deleted_at"),
        ...timestamps,
    },
);
export const productOptions = pgTable(
    "product_options",
    {
        id: uuid("id").primaryKey().notNull().unique().defaultRandom(),
        productId: uuid("product_id")
            .notNull()
            .references(() => products.id, { onDelete: "cascade" }),
        name: text("name").notNull(),
        values: jsonb("values")
            .$type<ProductOptionValue[]>()
            .default([])
            .notNull(),
        position: integer("position").default(0).notNull(),
        isDeleted: boolean("is_deleted").default(false).notNull(),
        deletedAt: timestamp("deleted_at"),
        ...timestamps,
    },
    (table) => ({
        productOptionProductIdIdx: index("product_option_product_id_idx").on(
            table.productId
        ),
    })
);

export const productVariants = pgTable(
    "product_variants",
    {
        // BASIC INFO
        id: uuid("id").primaryKey().notNull().unique().defaultRandom(),
        productId: uuid("product_id")
            .notNull()
            .references(() => products.id, { onDelete: "cascade" }),
        image: text("image"),
        combinations: jsonb("combinations").default({}).notNull(),

        // PRICING
        price: integer("price").notNull(),
        compareAtPrice: integer("compare_at_price"),
        costPerItem: integer("cost_per_item"),

        // INVENTORY
        nativeSku: text("native_sku").notNull().unique(),
        sku: text("sku"),
        barcode: text("barcode"),
        quantity: integer("quantity").notNull().default(0),

        // SHIPPING
        weight: integer("weight").notNull().default(0),
        length: integer("length").notNull().default(0),
        width: integer("width").notNull().default(0),
        height: integer("height").notNull().default(0),
        originCountry: text("origin_country"),
        hsCode: text("hs_code"),
        isDeleted: boolean("is_deleted").default(false).notNull(),
        deletedAt: timestamp("deleted_at"),
        ...timestamps,
    },
    (table) => ({
        productVariantProductIdIdx: index("product_variant_product_id_idx").on(
            table.productId
        ),
        productVariantSkuIdx: index("product_variant_sku_idx").on(table.sku),
    })
);

export const productsJourney = pgTable(
    "products_journey",
    {
        id: uuid("id").primaryKey().notNull().unique().defaultRandom(),
        productId: uuid("product_id")
            .notNull()
            .references(() => products.id, { onDelete: "cascade" }),
        data: jsonb("data").$type<ProductJourneyData[]>(),
        ...timestamps,
    },
    (table) => ({
        productsJourneyProductIdIdx: index(
            "products_journey_product_id_idx"
        ).on(table.productId),
    })
);
export const productSpecifications = pgTable("product_specifications", {
    id: uuid("id").primaryKey().defaultRandom(),
    productId: uuid("product_id").references(() => products.id, { onDelete: "cascade" }),
    key: text("key"),
    value: text("value"),
    deletedAt: timestamp("deleted_at", { withTimezone: true }),
    ...timestamps,
  });
  export const returnExchangePolicy = pgTable("return_exchange_policies", {
    id: uuid("id").primaryKey().defaultRandom(),
    productId: uuid("product_id").references(() => products.id, { onDelete: "cascade" }),

    returnable: boolean("returnable").default(false),
    returnDescription: text("return_description"), // optional return note

    exchangeable: boolean("exchangeable").default(false),
    exchangeDescription: text("exchange_description"), // optional exchange note

    returnPeriod: integer("return_period").notNull().default(5),
    exchangePeriod: integer("exchange_period").notNull().default(5),

    ...timestamps,
  });

export const productValues = pgTable(
    "product_values",
    {
        id: uuid("id").primaryKey().notNull().unique().defaultRandom(),
        productId: uuid("product_id")
            .notNull()
            .references(() => products.id, { onDelete: "cascade" }),
        data: jsonb("data").$type<ProductValueData[]>(),
        ...timestamps,
    },
    (table) => ({
        productValuesProductIdIdx: index("product_values_product_id_idx").on(
            table.productId
        ),
    })
);

export const productsRelations = relations(products, ({ one, many }) => ({
    brand: one(brands, {
        fields: [products.brandId],
        references: [brands.id],
    }),
    orders: many(orderItems),
    options: many(productOptions),
    variants: many(productVariants),
    category: one(categories, {
        fields: [products.categoryId],
        references: [categories.id],
    }),
    subcategory: one(subCategories, {
        fields: [products.subcategoryId],
        references: [subCategories.id],
    }),
    productType: one(productTypes, {
        fields: [products.productTypeId],
        references: [productTypes.id],
    }),
    journey: one(productsJourney, {
        fields: [products.id],
        references: [productsJourney.productId],
    }),
    values: one(productValues, {
        fields: [products.id],
        references: [productValues.productId],
    }),
    returnExchangePolicy: one(returnExchangePolicy, { // Add the return/exchange policy relation
        fields: [products.id],
        references: [returnExchangePolicy.productId],
    }),
    specifications: many(productSpecifications),
}));

export const productOptionsRelations = relations(productOptions, ({ one }) => ({
    product: one(products, {
        fields: [productOptions.productId],
        references: [products.id],
    }),
}));

export const productVariantsRelations = relations(
    productVariants,
    ({ one }) => ({
        product: one(products, {
            fields: [productVariants.productId],
            references: [products.id],
        }),
    })
);

export const womenPageFeaturedProductsRelations = relations(womenPageFeaturedProducts, ({ one }) => ({
  product: one(products, {
    fields: [womenPageFeaturedProducts.productId],
    references: [products.id],
  }),
}));

export const menPageFeaturedProductsRelation = relations(menPageFeaturedProducts, ({ one }) => ({
  product: one(products, {
    fields: [menPageFeaturedProducts.productId],
    references: [products.id],
  }),
}));

export const kidsFreshCollectionSectionRelation = relations(kidsFreshCollectionSection, ({ one }) => ({
  product: one(products, {
    fields: [kidsFreshCollectionSection.productId],
    references: [products.id],
  }),
}));

export const homeandlivingNewArrivalRelation = relations(homeandlivingNewArrival, ({ one }) => ({
  product: one(products, {
    fields: [homeandlivingNewArrival.productId],
    references: [products.id],
  }),
}));

export const homeandlivingTopPicksRelation = relations(homeandlivingTopPicks, ({ one }) => ({
  product: one(products, {
    fields: [homeandlivingTopPicks.productId],
    references: [products.id],
  }),
}));

export const beautyNewArrivalsRelation = relations(beautyNewArrivals, ({ one }) => ({
  product: one(products, {
    fields: [beautyNewArrivals.productId],
    references: [products.id],
  }),
}));

export const homeNewArrivalsRelation = relations(homeNewArrivals, ({ one }) => ({
  product: one(products, {
    fields: [homeNewArrivals.productId],
    references: [products.id],
  }),
}));

export const beautyTopPicksRelation = relations(beautyTopPicks, ({ one }) => ({
  product: one(products, {
    fields: [beautyTopPicks.productId],
    references: [products.id],
  }),
}));
export const newProductEventPageRelation = relations(newProductEventPage, ({ one }) => ({
  product: one(products, {
    fields: [newProductEventPage.productId],
    references: [products.id],
  }),
}));

export const womenStyleWithSubstanceMiddlePageSectionRelations = relations(womenStyleWithSubstanceMiddlePageSection, ({ one }) => ({
  product: one(products, {
    fields: [womenStyleWithSubstanceMiddlePageSection.productId],
    references: [products.id],
  }),
}));

export const menCuratedHerEssenceRelations= relations(menCuratedHerEssence, ({ one }) => ({
  product: one(products, {
    fields: [menCuratedHerEssence.productId],
    references: [products.id],
  }),
}));

export const productsJourneyRelations = relations(
    productsJourney,
    ({ one }) => ({
        product: one(products, {
            fields: [productsJourney.productId],
            references: [products.id],
        }),
    })
);

export const productValuesRelations = relations(productValues, ({ one }) => ({
    product: one(products, {
        fields: [productValues.productId],
        references: [products.id],
    }),
}));



  export const returnExchangePolicyRelations = relations(returnExchangePolicy, ({ one }) => ({
    product: one(products, {
        fields: [returnExchangePolicy.productId],
        references: [products.id],
    }),
}));

// Define the inverse relation for product_specifications
export const productSpecificationsRelations = relations(productSpecifications, ({ one }) => ({
    product: one(products, {
        fields: [productSpecifications.productId],
        references: [products.id],
    }),
}));