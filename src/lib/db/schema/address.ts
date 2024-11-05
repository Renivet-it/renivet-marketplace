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
        street: text("street").notNull(),
        city: text("city"),
        state: text("state").notNull(),
        zip: text("zip").notNull(),
        isPrimary: boolean("is_primary").notNull().default(false),
        ...timestamps,
    },
    (table) => ({
        userIdIdx: index("address_to_user_id_idx").on(table.userId),
        isPrimaryIdx: index("is_primary_idx").on(table.isPrimary),
    })
);

export const addressRelations = relations(addresses, ({ one }) => ({
    user: one(users, {
        fields: [addresses.userId],
        references: [users.id],
    }),
}));
