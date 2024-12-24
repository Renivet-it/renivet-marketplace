import { z } from "zod";
import { convertEmptyStringToNull } from "../utils";
import { bannedBrandMemberSchema } from "./banned-brand-member";
import { brandInviteSchema } from "./brand-invite";
import { brandSubscriptionSchema } from "./brand-subscription";
import { roleSchema } from "./role";
import { safeUserSchema } from "./user";

export const brandSchema = z.object({
    id: z
        .string({
            required_error: "ID is required",
            invalid_type_error: "ID must be a string",
        })
        .uuid("ID is invalid"),
    rzpAccountId: z
        .string({
            required_error: "Razorpay Account ID is required",
            invalid_type_error: "Razorpay Account ID must be a string",
        })
        .min(1, "Razorpay Account ID must be at least 1 characters long"),
    name: z
        .string({
            required_error: "Name is required",
            invalid_type_error: "Name must be a string",
        })
        .min(3, "Name must be at least 3 characters long"),
    slug: z
        .string({
            required_error: "Slug is required",
            invalid_type_error: "Slug must be a string",
        })
        .min(3, "Slug must be at least 3 characters long"),
    email: z
        .string({
            required_error: "Email is required",
            invalid_type_error: "Email must be a string",
        })
        .email("Email is invalid"),
    phone: z
        .string({
            required_error: "Phone is required",
            invalid_type_error: "Phone must be a string",
        })
        .min(10, "Phone must be at least 10 characters long"),
    website: z.preprocess(
        convertEmptyStringToNull,
        z
            .string({
                invalid_type_error: "Website must be a string",
            })
            .url("Website is invalid")
            .nullable()
    ),
    logoUrl: z
        .string({
            invalid_type_error: "Logo URL must be a string",
        })
        .url("Logo URL is invalid"),
    ownerId: z
        .string({
            required_error: "Owner ID is required",
            invalid_type_error: "Owner ID must be a string",
        })
        .min(1, "Owner ID must be at least 1 characters long"),
    bio: z.preprocess(
        convertEmptyStringToNull,
        z
            .string({
                invalid_type_error: "Bio must be a string",
            })
            .nullable()
    ),
    createdAt: z
        .union([z.string(), z.date()], {
            required_error: "Created at is required",
            invalid_type_error: "Created at must be a date",
        })
        .transform((v) => new Date(v)),
    updatedAt: z
        .union([z.string(), z.date()], {
            required_error: "Updated at is required",
            invalid_type_error: "Updated at must be a date",
        })
        .transform((v) => new Date(v)),
});

export const createBrandSchema = brandSchema.omit({
    id: true,
    slug: true,
    createdAt: true,
    updatedAt: true,
});

export const brandWithOwnerMembersAndRolesSchema = z.lazy(() =>
    brandSchema.extend({
        owner: safeUserSchema,
        members: z.array(safeUserSchema),
        roles: z.array(
            roleSchema.omit({
                isSiteRole: true,
            })
        ),
        subscriptions: brandSubscriptionSchema.array(),
    })
);

export const cachedBrandSchema = z.lazy(() =>
    brandSchema.extend({
        owner: safeUserSchema,
        members: z.array(safeUserSchema),
        roles: z.array(
            roleSchema.omit({
                isSiteRole: true,
            })
        ),
        invites: brandInviteSchema.array(),
        bannedMembers: bannedBrandMemberSchema.array(),
        // subscriptions: brandSubscriptionSchema.array(),
    })
);

export const brandMetaSchema = brandSchema.pick({
    id: true,
    name: true,
    slug: true,
    ownerId: true,
});

export type Brand = z.infer<typeof brandSchema>;
export type CreateBrand = z.infer<typeof createBrandSchema>;
export type BrandWithOwnerMembersAndRoles = z.infer<
    typeof brandWithOwnerMembersAndRolesSchema
>;
export type CachedBrand = z.infer<typeof cachedBrandSchema>;
export type BrandMeta = z.infer<typeof brandMetaSchema>;
