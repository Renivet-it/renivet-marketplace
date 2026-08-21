import { relations } from "drizzle-orm";
import {
    boolean,
    index,
    integer,
    pgTable,
    text,
    timestamp,
    uuid,
} from "drizzle-orm/pg-core";
import { timestamps } from "../helper";
import { addresses } from "./address";
import { blogs } from "./blog";
import { bannedBrandMembers, brandMembers, brands } from "./brand";
import { carts } from "./cart";
import { categoryRequests } from "./category";
import { reviews } from "./review";
import { roles } from "./role";
import { wishlists } from "./wishlist";

export const users = pgTable("users", {
    id: text("id").primaryKey().notNull().unique(),
    firstName: text("first_name").notNull(),
    lastName: text("last_name").notNull(),
    email: text("email").notNull().unique(),
    phone: text("phone").unique(),
    avatarUrl: text("avatar_url"),
    isEmailVerified: boolean("is_email_verified").notNull().default(false),
    isPhoneVerified: boolean("is_phone_verified").notNull().default(false),
    hasReceivedAbandonedCartEmail: boolean("has_received_abandoned_cart_email")
        .notNull()
        .default(false),
    ...timestamps,
});

export const accountMergeIntents = pgTable(
    "account_merge_intents",
    {
        id: uuid("id").primaryKey().defaultRandom(),
        sourceUserId: text("source_user_id").notNull(),
        targetUserId: text("target_user_id").notNull(),
        targetEmail: text("target_email").notNull(),
        verificationCodeHash: text("verification_code_hash").notNull(),
        attempts: integer("attempts").notNull().default(0),
        status: text("status").notNull().default("awaiting_consent"),
        expiresAt: timestamp("expires_at").notNull(),
        consentedAt: timestamp("consented_at"),
        lastCodeSentAt: timestamp("last_code_sent_at"),
        processingStartedAt: timestamp("processing_started_at"),
        sourceDeletedAt: timestamp("source_deleted_at"),
        completedAt: timestamp("completed_at"),
        error: text("error"),
        ...timestamps,
    },
    (table) => ({
        sourceUserIdx: index("account_merge_intents_source_user_idx").on(
            table.sourceUserId
        ),
        targetUserIdx: index("account_merge_intents_target_user_idx").on(
            table.targetUserId
        ),
        statusIdx: index("account_merge_intents_status_idx").on(table.status),
    })
);

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
    bannedFromBrands: many(bannedBrandMembers),
    wishlists: many(wishlists),
    carts: many(carts),
    categoryRequests: many(categoryRequests),
    reviews: many(reviews),
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
