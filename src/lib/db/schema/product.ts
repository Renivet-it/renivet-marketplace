import { generateSKU } from "@/lib/utils";
import { Product, ProductVariant } from "@/lib/validations";
import { relations, sql } from "drizzle-orm";
import {
    boolean,
    index,
    integer,
    jsonb,
    pgTable,
    text,
    timestamp,
    uuid,
} from "drizzle-orm/pg-core";
import { timestamps } from "../helper";
import { brands } from "./brand";
import { categories, productTypes, subCategories } from "./category";
import { orderItems } from "./order";

export const products = pgTable(
    "products",
    {
        id: uuid("id").primaryKey().notNull().unique().defaultRandom(),
        name: text("name").notNull(),
        slug: text("slug").notNull().unique(),
        description: text("description").notNull(),
        basePrice: integer("base_price").notNull().default(0),
        taxRate: integer("tax_rate").notNull().default(0),
        price: integer("price").notNull(),
        weight: integer("weight").notNull().default(0),
        length: integer("length").notNull().default(0),
        width: integer("width").notNull().default(0),
        height: integer("height").notNull().default(0),
        brandId: uuid("brand_id")
            .notNull()
            .references(() => brands.id, {
                onDelete: "cascade",
            }),
        imageUrls: jsonb("image_urls")
            .$type<Product["imageUrls"]>()
            .default([])
            .notNull(),
        sustainabilityCertificateUrl: text(
            "sustainability_certificate_url"
        ).notNull(),
        isSentForReview: boolean("is_sent_for_review").default(false).notNull(),
        isAvailable: boolean("is_available").default(true).notNull(),
        isPublished: boolean("is_published").default(false).notNull(),
        isDeleted: boolean("is_deleted").default(false).notNull(),
        status: text("status", {
            enum: ["idle", "pending", "approved", "rejected"],
        })
            .default("idle")
            .notNull(),
        rejectionReason: text("rejection_reason"),
        lastReviewedAt: timestamp("last_reviewed_at"),
        ...timestamps,
    },
    (table) => ({
        productStatusIdx: index("product_status_idx").on(table.status),
        productFtsIdx: index("product_fts_idx").using(
            "gin",
            sql`(
            setweight(to_tsvector('english', ${table.name}), 'A') ||
            setweight(to_tsvector('english', ${table.description}), 'B')
        )`
        ),
    })
);

export const productVariants = pgTable(
    "product_variants",
    {
        sku: text("sku")
            .notNull()
            .primaryKey()
            .unique()
            .$defaultFn(generateSKU),
        productId: uuid("product_id")
            .notNull()
            .references(() => products.id, { onDelete: "cascade" }),
        size: text("size").notNull(),
        color: jsonb("color").notNull().$type<ProductVariant["color"]>(),
        quantity: integer("quantity").notNull().default(0),
        isAvailable: boolean("is_available").default(true).notNull(),
        isDeleted: boolean("is_deleted").default(false).notNull(),
        ...timestamps,
    },
    (table) => ({
        productVariantProductIdIdx: index("product_variant_product_id_idx").on(
            table.productId
        ),
        productVariantColorIdx: index("product_variant_color_idx").on(
            table.color
        ),
        productVariantSizeColorIdx: index("product_variant_size_color_idx").on(
            table.size,
            table.color
        ),
    })
);

export const productCategories = pgTable(
    "product_categories",
    {
        id: uuid("id").primaryKey().notNull().unique().defaultRandom(),
        productId: uuid("product_id")
            .notNull()
            .references(() => products.id, { onDelete: "cascade" }),
        categoryId: uuid("category_id")
            .notNull()
            .references(() => categories.id, { onDelete: "cascade" }),
        subcategoryId: uuid("subcategory_id")
            .notNull()
            .references(() => subCategories.id, {
                onDelete: "cascade",
            }),
        productTypeId: uuid("product_type_id")
            .notNull()
            .references(() => productTypes.id, {
                onDelete: "cascade",
            }),
        ...timestamps,
    },
    (table) => ({
        catSubCatTypeIdx: index("cat_sub_cat_type_idx").on(
            table.categoryId,
            table.subcategoryId,
            table.productTypeId
        ),
    })
);

export const productsRelations = relations(products, ({ one, many }) => ({
    categories: many(productCategories),
    brand: one(brands, {
        fields: [products.brandId],
        references: [brands.id],
    }),
    orders: many(orderItems),
    variants: many(productVariants),
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

export const productCategoriesRelations = relations(
    productCategories,
    ({ one }) => ({
        product: one(products, {
            fields: [productCategories.productId],
            references: [products.id],
        }),
        category: one(categories, {
            fields: [productCategories.categoryId],
            references: [categories.id],
        }),
        subcategory: one(subCategories, {
            fields: [productCategories.subcategoryId],
            references: [subCategories.id],
        }),
        productType: one(productTypes, {
            fields: [productCategories.productTypeId],
            references: [productTypes.id],
        }),
    })
);
