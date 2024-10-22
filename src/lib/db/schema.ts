import { relations } from "drizzle-orm";
import { boolean, jsonb, pgTable, text, timestamp } from "drizzle-orm/pg-core";
import { generateId } from "../utils";
import { Profile } from "../validations";

// SCHEMAS

export const users = pgTable("users", {
    id: text("id").primaryKey().notNull().unique(),
    firstName: text("first_name").notNull(),
    lastName: text("last_name").notNull(),
    username: text("username").notNull().unique(),
    email: text("email").notNull().unique(),
    avatarUrl: text("avatar_url"),
    isVerified: boolean("is_verified").notNull().default(false),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const profiles = pgTable("profiles", {
    id: text("id").primaryKey().notNull().unique().$defaultFn(generateId),
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
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// RELATIONS

export const usersRelations = relations(users, ({ one }) => ({
    profile: one(profiles),
}));

export const profilesRelations = relations(profiles, ({ one }) => ({
    user: one(users, {
        fields: [profiles.userId],
        references: [users.id],
    }),
}));
