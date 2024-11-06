import { Address } from "@/lib/validations";
import { relations } from "drizzle-orm";
import { boolean, index, pgTable, text, uuid } from "drizzle-orm/pg-core";
import { timestamps } from "../helper";
import { users } from "./user";

export const addresses = pgTable(
    "addresses",
    {
        id: uuid("id").primaryKey().notNull().unique().defaultRandom(),
        userId: text("user_id")
            .notNull()
            .references(() => users.id, {
                onDelete: "cascade",
            }),
        alias: text("alias").notNull(),
        aliasSlug: text("alias_slug").notNull(),
        fullName: text("full_name").notNull(),
        street: text("street").notNull(),
        city: text("city").notNull(),
        state: text("state").notNull(),
        zip: text("zip").notNull(),
        phone: text("phone").notNull(),
        type: text("type").notNull().$type<Address["type"]>(),
        isPrimary: boolean("is_primary").notNull().default(false),
        ...timestamps,
    },
    (table) => ({
        userIdIdx: index("address_to_user_id_idx").on(table.userId),
        userIdTypeAliasSlugIdx: index("user_id_type_alias_slug_idx").on(
            table.userId,
            table.type,
            table.aliasSlug
        ),
        aliasSlugIdx: index("alias_slug_idx").on(table.aliasSlug),
        isPrimaryIdx: index("is_primary_idx").on(table.isPrimary),
    })
);

export const addressRelations = relations(addresses, ({ one }) => ({
    user: one(users, {
        fields: [addresses.userId],
        references: [users.id],
    }),
}));
