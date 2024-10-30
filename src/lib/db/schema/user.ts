import { relations } from "drizzle-orm";
import { boolean, index, pgTable, text, uuid } from "drizzle-orm/pg-core";
import { timestamps } from "../helper";
import { blogs } from "./blog";
import { profiles } from "./profile";
import { roles } from "./role";

export const users = pgTable("users", {
    id: text().primaryKey().notNull().unique(),
    firstName: text().notNull(),
    lastName: text().notNull(),
    email: text().notNull().unique(),
    avatarUrl: text(),
    isVerified: boolean().notNull().default(false),
    ...timestamps,
});

export const userRoles = pgTable(
    "user_roles",
    {
        id: uuid().primaryKey().notNull().unique().defaultRandom(),
        userId: text()
            .notNull()
            .references(() => users.id, {
                onDelete: "cascade",
            }),
        roleId: uuid()
            .notNull()
            .references(() => roles.id, {
                onDelete: "cascade",
            }),
        ...timestamps,
    },
    (table) => {
        return {
            userIdIdx: index().on(table.userId),
            roleIdIdx: index().on(table.roleId),
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
