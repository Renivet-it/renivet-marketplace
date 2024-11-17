import { generateId } from "@/lib/utils";
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
import { users } from "./user";

export const brandRequests = pgTable("brand_requests", {
    id: uuid("id").primaryKey().notNull().unique().defaultRandom(),
    name: text("name").notNull(),
    email: text("email").notNull(),
    website: text("website").notNull(),
    ownerId: text("owner_id")
        .notNull()
        .references(() => users.id, {
            onDelete: "cascade",
        }),
    demoUrl: text("demo_url"),
    message: text("message").notNull(),
    status: text("status", {
        enum: ["pending", "approved", "rejected"],
    })
        .notNull()
        .default("pending"),
    rejectionReason: text("rejection_reason"),
    rejectedAt: timestamp("rejected_at"),
    ...timestamps,
});

export const brands = pgTable("brands", {
    id: uuid("id").primaryKey().notNull().unique().defaultRandom(),
    name: text("name").notNull(),
    email: text("email").notNull().unique(),
    website: text("website").notNull(),
    logoUrl: text("logo_url"),
    ownerId: text("owner_id")
        .notNull()
        .unique()
        .references(() => users.id, {
            onDelete: "cascade",
        }),
    bio: text("bio"),
    ...timestamps,
});

export const brandInvites = pgTable(
    "brand_invites",
    {
        id: text("id")
            .primaryKey()
            .notNull()
            .unique()
            .$defaultFn(() =>
                generateId({
                    length: 8,
                })
            ),
        brandId: uuid("brand_id")
            .notNull()
            .references(() => brands.id, {
                onDelete: "cascade",
            }),
        expiresAt: timestamp("expires_at"),
        maxUses: integer("max_uses").default(0),
        uses: integer("uses").default(0),
        ...timestamps,
    },
    (table) => ({
        inviteBrandIdIdx: index("invite_brand_id_index").on(table.brandId),
    })
);

export const brandMembers = pgTable(
    "brand_members",
    {
        id: uuid("id").primaryKey().notNull().unique().defaultRandom(),
        memberId: text("member_id")
            .notNull()
            .references(() => users.id, {
                onDelete: "cascade",
            }),
        brandId: uuid("brand_id")
            .notNull()
            .references(() => brands.id, {
                onDelete: "cascade",
            }),
        isOwner: boolean("is_owner").notNull().default(false),
        ...timestamps,
    },
    (table) => ({
        brandMemberIdIdx: index("brand_member_id_index").on(table.memberId),
        memberBrandIdIdx: index("member_brand_id_index").on(table.brandId),
    })
);

export const brandRequestRelations = relations(brandRequests, ({ one }) => ({
    owner: one(users, {
        fields: [brandRequests.ownerId],
        references: [users.id],
    }),
}));

export const brandRelations = relations(brands, ({ one, many }) => ({
    owner: one(users, {
        fields: [brands.ownerId],
        references: [users.id],
    }),
    invites: many(brandInvites),
    members: many(brandMembers),
}));

export const brandInviteRelations = relations(brandInvites, ({ one }) => ({
    brand: one(brands, {
        fields: [brandInvites.brandId],
        references: [brands.id],
    }),
}));

export const brandMemberRelations = relations(brandMembers, ({ one }) => ({
    member: one(users, {
        fields: [brandMembers.memberId],
        references: [users.id],
    }),
    brand: one(brands, {
        fields: [brandMembers.brandId],
        references: [brands.id],
    }),
}));
