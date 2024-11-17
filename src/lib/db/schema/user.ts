import { relations } from "drizzle-orm";
import { boolean, index, pgTable, text, uuid } from "drizzle-orm/pg-core";
import { timestamps } from "../helper";
import { addresses } from "./address";
import { blogs } from "./blog";
import { brandMembers, brands } from "./brand";
import { roles } from "./role";

export const users = pgTable("users", {
    id: text("id").primaryKey().notNull().unique(),
    firstName: text("first_name").notNull(),
    lastName: text("last_name").notNull(),
    email: text("email").notNull().unique(),
    phone: text("phone").unique(),
    avatarUrl: text("avatar_url"),
    isEmailVerified: boolean("is_email_verified").notNull().default(false),
    isPhoneVerified: boolean("is_phone_verified").notNull().default(false),
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
    (table) => ({
        userIdIdx: index("user_role_id_idx").on(table.userId),
        roleIdIdx: index("role_id_idx").on(table.roleId),
    })
);

export const userAddresses = pgTable(
    "user_addresses",
    {
        id: uuid("id").primaryKey().notNull().unique().defaultRandom(),
        userId: text("user_id")
            .notNull()
            .references(() => users.id, {
                onDelete: "cascade",
            }),
        addressId: uuid("address_id")
            .notNull()
            .references(() => addresses.id, {
                onDelete: "cascade",
            }),
        ...timestamps,
    },
    (table) => ({
        userIdIdx: index("user_address_id_idx").on(table.userId),
        addressIdIdx: index("address_id_idx").on(table.addressId),
    })
);

export const userRelations = relations(users, ({ one, many }) => ({
    blogs: many(blogs),
    roles: many(userRoles),
    addresses: many(addresses),
    brandRequests: many(brands),
    brand: one(brands, {
        fields: [users.id],
        references: [brands.ownerId],
    }),
    brandMember: one(brandMembers, {
        fields: [users.id],
        references: [brandMembers.memberId],
    }),
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

export const userAddressRelations = relations(userAddresses, ({ one }) => ({
    user: one(users, {
        fields: [userAddresses.userId],
        references: [users.id],
    }),
    address: one(addresses, {
        fields: [userAddresses.addressId],
        references: [addresses.id],
    }),
}));
