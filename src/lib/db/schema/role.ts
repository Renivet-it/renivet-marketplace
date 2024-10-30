import { relations } from "drizzle-orm";
import { pgTable, text, uuid } from "drizzle-orm/pg-core";
import { timestamps } from "../helper";
import { userRoles } from "./user";

export const roles = pgTable("roles", {
    id: uuid().primaryKey().notNull().unique().defaultRandom(),
    name: text().notNull(),
    slug: text().notNull().unique(),
    sitePermissions: text().notNull(),
    brandPermissions: text().notNull(),
    ...timestamps,
});

export const roleRelations = relations(roles, ({ many }) => ({
    userRoles: many(userRoles),
}));
