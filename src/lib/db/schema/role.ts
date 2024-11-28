import { relations } from "drizzle-orm";
import {
    boolean,
    integer,
    pgTable,
    text,
    uniqueIndex,
    uuid,
} from "drizzle-orm/pg-core";
import { timestamps } from "../helper";
import { brands } from "./brand";
import { userRoles } from "./user";

export const roles = pgTable("roles", {
    id: uuid("id").primaryKey().notNull().unique().defaultRandom(),
    name: text("name").notNull(),
    slug: text("slug").notNull().unique(),
    position: integer("position").notNull().default(0),
    sitePermissions: text("site_permissions").notNull(),
    brandPermissions: text("brand_permissions").notNull(),
    isSiteRole: boolean("is_site_role").notNull().default(false),
    ...timestamps,
});

export const brandRoles = pgTable(
    "brand_roles",
    {
        id: uuid("id").primaryKey().notNull().unique().defaultRandom(),
        brandId: uuid("brand_id")
            .notNull()
            .references(() => brands.id, {
                onDelete: "cascade",
            }),
        roleId: uuid("role_id")
            .notNull()
            .references(() => roles.id, {
                onDelete: "cascade",
            }),
        ...timestamps,
    },
    (table) => ({
        uniqueBrandRoleIdx: uniqueIndex("unique_brand_role_idx").on(
            table.brandId,
            table.roleId
        ),
        uniqueRoleNamePerBrandIdx: uniqueIndex(
            "unique_role_name_per_brand_idx"
        ).on(table.brandId, table.roleId),
    })
);

export const roleRelations = relations(roles, ({ many }) => ({
    userRoles: many(userRoles),
    brandRoles: many(brandRoles),
}));
