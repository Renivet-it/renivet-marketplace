import { relations } from "drizzle-orm";
import { boolean, index, pgTable, text, uuid } from "drizzle-orm/pg-core";
import { timestamps } from "../helper";
import { blogs } from "./blog";
import { profiles } from "./profile";
import { roles } from "./role";

export const users = pgTable("users", {
    id: text("id").primaryKey().notNull().unique(),
    firstName: text("first_name").notNull(),
    lastName: text("last_name").notNull(),
    email: text("email").notNull().unique(),
    avatarUrl: text("avatar_url"),
    isVerified: boolean("is_verified").notNull().default(false),
    ...timestamps,
});

export const userRoles = pgTable(
    "user_roles",
    {
        id: uuid("id").primaryKey().notNull().unique().defaultRandom(),
        userId: text("user_id")
            .notNull()
            .references(() => users.id, {
                onDelete: "cascade",
            }),
        roleId: uuid("role_id")
            .notNull()
            .references(() => roles.id, {
                onDelete: "cascade",
            }),
        ...timestamps,
    },
    (table) => {
        return {
            userIdIdx: index("user_id_idx").on(table.userId),
            roleIdIdx: index("role_id_idx").on(table.roleId),
        };
    }
);

export const userRelations = relations(users, ({ one, many }) => ({
    profile: one(profiles),
    blogs: many(blogs),
    roles: many(userRoles),
}));

export const userRoleRelations = relations(userRoles, ({ one }) => ({
    user: one(users, {
        fields: [userRoles.userId],
        references: [users.id],
    }),
    role: one(roles, {
        fields: [userRoles.roleId],
        references: [roles.id],
    }),
}));
