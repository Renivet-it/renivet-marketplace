import { Profile } from "@/lib/validations";
import { relations } from "drizzle-orm";
import { boolean, jsonb, pgTable, text, uuid } from "drizzle-orm/pg-core";
import { timestamps } from "../helper";
import { users } from "./user";

export const profiles = pgTable("profiles", {
    id: uuid("id").primaryKey().notNull().unique().defaultRandom(),
    userId: text("user_id")
        .notNull()
        .unique()
        .references(() => users.id, {
            onDelete: "cascade",
        }),
    phone: text("phone").unique(),
    address: jsonb("address").$type<Profile["address"]>(),
    isProfileCompleted: boolean("is_profile_completed")
        .notNull()
        .default(false),
    ...timestamps,
});

export const profileRelations = relations(profiles, ({ one }) => ({
    user: one(users, {
        fields: [profiles.userId],
        references: [users.id],
    }),
}));
