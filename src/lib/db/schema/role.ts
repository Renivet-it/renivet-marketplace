import { relations } from "drizzle-orm";
import { integer, pgTable, text, uuid } from "drizzle-orm/pg-core";
import { timestamps } from "../helper";
import { userRoles } from "./user";

export const roles = pgTable("roles", {
    id: uuid("id").primaryKey().notNull().unique().defaultRandom(),
    name: text("name").notNull(),
    slug: text("slug").notNull().unique(),
    position: integer("position").notNull().default(0),
    sitePermissions: text("site_permissions").notNull(),
    brandPermissions: text("brand_permissions").notNull(),
    ...timestamps,
});

export const roleRelations = relations(roles, ({ many }) => ({
    userRoles: many(userRoles),
}));
