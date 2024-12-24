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
import { brandSubscriptions } from "./brand-subscription";
import { products } from "./product";
import { brandRoles, roles } from "./role";
import { users } from "./user";

export const brandRequests = pgTable("brand_requests", {
    id: uuid("id").primaryKey().notNull().unique().defaultRandom(),
    rzpAccountId: text("rzp_account_id"),
    name: text("name").notNull(),
    email: text("email").notNull(),
    phone: text("phone").notNull(),
    message: text("message").notNull(),
    website: text("website"),
    ownerId: text("owner_id")
        .notNull()
        .references(() => users.id, {
            onDelete: "cascade",
        }),
    logoUrl: text("logo_url").notNull(),
    demoUrl: text("demo_url"),
    gstin: text("gstin").notNull(),
    pan: text("pan").notNull(),
    bankName: text("bank_name").notNull(),
    bankAccountHolderName: text("bank_account_holder_name").notNull(),
    bankAccountNumber: text("bank_account_number").notNull(),
    bankIfscCode: text("bank_ifsc_code").notNull(),
    bankAccountVerificationDocumentUrl: text(
        "bank_account_verification_document_url"
    ).notNull(),
    authorizedSignatoryName: text("authorized_signatory_name").notNull(),
    authorizedSignatoryEmail: text("authorized_signatory_email").notNull(),
    authorizedSignatoryPhone: text("authorized_signatory_phone").notNull(),
    udyamRegistrationCertificateUrl: text("udyam_registration_certificate_url"),
    iecCertificateUrl: text("iec_certificate_url"),
    addressLine1: text("address_line_1").notNull(),
    addressLine2: text("address_line_2").notNull(),
    city: text("city").notNull(),
    state: text("state").notNull(),
    postalCode: text("postal_code").notNull(),
    country: text("country").notNull(),
    status: text("status", {
        enum: ["pending", "approved", "rejected"],
    })
        .notNull()
        .default("pending"),
    rejectionReason: text("rejection_reason"),
    rejectedAt: timestamp("rejected_at"),
    hasAcceptedTerms: boolean("has_accepted_terms").notNull().default(false),
    ...timestamps,
});

export const brands = pgTable("brands", {
    id: uuid("id").primaryKey().notNull().unique().defaultRandom(),
    rzpAccountId: text("rzp_account_id").notNull(),
    name: text("name").notNull(),
    slug: text("slug").notNull().unique(),
    email: text("email").notNull().unique(),
    phone: text("phone").notNull(),
    website: text("website"),
    logoUrl: text("logo_url").notNull(),
    ownerId: text("owner_id")
        .notNull()
        .unique()
        .references(() => users.id, {
            onDelete: "cascade",
        }),
    bio: text("bio"),
    ...timestamps,
});

export const brandConfidentials = pgTable("brand_confidentials", {
    id: uuid("id")
        .primaryKey()
        .notNull()
        .unique()
        .references(() => brands.id, {
            onDelete: "cascade",
        }),
    gstin: text("gstin").notNull(),
    pan: text("pan").notNull(),
    bankName: text("bank_name").notNull(),
    bankAccountHolderName: text("bank_account_holder_name").notNull(),
    bankAccountNumber: text("bank_account_number").notNull(),
    bankIfscCode: text("bank_ifsc_code").notNull(),
    bankAccountVerificationDocumentUrl: text(
        "bank_account_verification_document_url"
    ),
    authorizedSignatoryName: text("authorized_signatory_name").notNull(),
    authorizedSignatoryEmail: text("authorized_signatory_email").notNull(),
    authorizedSignatoryPhone: text("authorized_signatory_phone").notNull(),
    udyamRegistrationCertificateUrl: text("udyam_registration_certificate_url"),
    iecCertificateUrl: text("iec_certificate_url"),
    addressLine1: text("address_line1").notNull(),
    addressLine2: text("address_line2").notNull(),
    city: text("city").notNull(),
    state: text("state").notNull(),
    postalCode: text("postal_code").notNull(),
    country: text("country").notNull(),
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
        maxUses: integer("max_uses").default(0).notNull(),
        uses: integer("uses").default(0).notNull(),
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

export const bannedBrandMembers = pgTable(
    "banned_brand_members",
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
        reason: text("reason"),
        bannedAt: timestamp("banned_at").notNull().defaultNow(),
        ...timestamps,
    },
    (table) => ({
        bannedMemberBrandIdx: index("banned_member_brand_index").on(
            table.memberId,
            table.brandId
        ),
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
    roles: many(brandRoles),
    bannedMembers: many(bannedBrandMembers),
    products: many(products),
    subscriptions: many(brandSubscriptions),
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

export const brandRolesRelations = relations(brandRoles, ({ one }) => ({
    brand: one(brands, {
        fields: [brandRoles.brandId],
        references: [brands.id],
    }),
    role: one(roles, {
        fields: [brandRoles.roleId],
        references: [roles.id],
    }),
}));

export const bannedBrandMemberRelations = relations(
    bannedBrandMembers,
    ({ one }) => ({
        member: one(users, {
            fields: [bannedBrandMembers.memberId],
            references: [users.id],
        }),
        brand: one(brands, {
            fields: [bannedBrandMembers.brandId],
            references: [brands.id],
        }),
    })
);
