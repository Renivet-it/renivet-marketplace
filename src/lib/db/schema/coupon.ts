import { generateId } from "@/lib/utils";
import { relations } from "drizzle-orm";
import {
    boolean,
    integer,
    pgTable,
    text,
    timestamp,
    uuid,
} from "drizzle-orm/pg-core";
import { timestamps } from "../helper";
import { categories, productTypes, subCategories } from "./category";

export const coupons = pgTable("coupons", {
    code: text("code")
        .notNull()
        .unique()
        .primaryKey()
        .$defaultFn(() => generateId({ casing: "upper", length: 8 })),
    description: text("description"),
    discountType: text("discount_type", {
        enum: ["percentage", "fixed"],
    }).notNull(),
    discountValue: integer("discount_value").notNull(),
    minOrderAmount: integer("min_order_amount").default(0).notNull(),
    maxDiscountAmount: integer("max_discount_amount"),
    categoryId: uuid("category_id").references(() => categories.id),
    subCategoryId: uuid("sub_category_id").references(() => subCategories.id),
    productTypeId: uuid("product_type_id").references(() => productTypes.id),
    expiresAt: timestamp("expires_at"),
    maxUses: integer("max_uses").default(0).notNull(),
    uses: integer("uses").default(0).notNull(),
    isActive: boolean("is_active").default(true).notNull(),
    ...timestamps,
});

export const couponsRelations = relations(coupons, ({ one }) => ({
    category: one(categories, {
        fields: [coupons.categoryId],
        references: [categories.id],
    }),
    subCategory: one(subCategories, {
        fields: [coupons.subCategoryId],
        references: [subCategories.id],
    }),
    productType: one(productTypes, {
        fields: [coupons.productTypeId],
        references: [productTypes.id],
    }),
}));
