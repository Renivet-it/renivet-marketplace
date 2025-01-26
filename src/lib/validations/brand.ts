import { z } from "zod";
import { convertEmptyStringToNull } from "../utils";
import { bannedBrandMemberSchema } from "./banned-brand-member";
import { brandInviteSchema } from "./brand-invite";
import {
    brandPageSectionProductSchema,
    brandPageSectionSchema,
} from "./brand-page";
import { brandSubscriptionSchema } from "./brand-subscription";
import { planSchema } from "./plan";
import {
    enhancedProductMediaSchema,
    enhancedProductVariantSchema,
    productSchema,
} from "./product";
import { roleSchema } from "./role";
import { safeUserSchema } from "./user";

export const brandSchema = z.object({
    id: z
        .string({
            required_error: "ID is required",
            invalid_type_error: "ID must be a string",
        })
        .uuid("ID is invalid"),
    rzpAccountId: z.preprocess(
        convertEmptyStringToNull,
        z
            .string({
                required_error: "Razorpay Account ID is required",
                invalid_type_error: "Razorpay Account ID must be a string",
            })
            .min(1, "Razorpay Account ID must be at least 1 characters long")
            .nullable()
    ),
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
            .regex(
                /^(https?:\/\/)?([\da-z.-]+)\.([a-z.]{2,6})([/\w .-]*)*\/?$/,
                "Website is invalid"
            )
            .nullable()
    ),
    logoUrl: z
        .string({
            invalid_type_error: "Logo URL must be a string",
        })
        .url("Logo URL is invalid"),
    coverUrl: z.preprocess(
        convertEmptyStringToNull,
        z
            .string({
                invalid_type_error: "Cover URL must be a string",
            })
            .url("Cover URL is invalid")
            .nullable()
    ),
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
    confidentialVerificationStatus: z.enum(
        ["idle", "pending", "approved", "rejected"],
        {
            required_error: "Status is required",
            invalid_type_error:
                "Status must be one of: idle, pending, approved, rejected",
        }
    ),
    confidentialVerificationRejectedReason: z.preprocess(
        convertEmptyStringToNull,
        z
            .string({
                invalid_type_error:
                    "Confidential verification rejected reason must be a string",
            })
            .nullable()
    ),
    confidentialVerificationRejectedAt: z.preprocess(
        convertEmptyStringToNull,
        z
            .union([z.string(), z.date()], {
                invalid_type_error:
                    "Confidential verification rejected at must be a date",
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
    rzpAccountId: true,
    slug: true,
    confidentialVerificationStatus: true,
    confidentialVerificationRejectedReason: true,
    confidentialVerificationRejectedAt: true,
    createdAt: true,
    updatedAt: true,
});

export const updateBrandSchema = brandSchema.pick({
    bio: true,
    coverUrl: true,
    logoUrl: true,
    website: true,
});

export const updateBrandConfidentialStatusSchema = brandSchema
    .pick({
        id: true,
        confidentialVerificationStatus: true,
        confidentialVerificationRejectedReason: true,
        confidentialVerificationRejectedAt: true,
    })
    .partial()
    .extend({
        id: brandSchema.shape.id,
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
        subscriptions: brandSubscriptionSchema
            .omit({
                createdAt: true,
                updatedAt: true,
            })
            .extend({
                plan: planSchema.omit({
                    createdAt: true,
                    updatedAt: true,
                }),
            })
            .array(),
        pageSections: z.array(
            brandPageSectionSchema
                .omit({
                    brandId: true,
                    createdAt: true,
                    updatedAt: true,
                })
                .extend({
                    sectionProducts: z.array(
                        brandPageSectionProductSchema
                            .omit({
                                brandPageSectionId: true,
                                createdAt: true,
                                updatedAt: true,
                            })
                            .extend({
                                product: productSchema
                                    .pick({
                                        id: true,
                                        title: true,
                                        slug: true,
                                        price: true,
                                    })
                                    .extend({
                                        media: z.array(
                                            enhancedProductMediaSchema
                                        ),
                                        variants: z.array(
                                            enhancedProductVariantSchema.pick({
                                                id: true,
                                                price: true,
                                            })
                                        ),
                                    }),
                            })
                    ),
                })
        ),
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
export type UpdateBrand = z.infer<typeof updateBrandSchema>;
export type UpdateBrandConfidentialStatus = z.infer<
    typeof updateBrandConfidentialStatusSchema
>;
export type BrandWithOwnerMembersAndRoles = z.infer<
    typeof brandWithOwnerMembersAndRolesSchema
>;
export type CachedBrand = z.infer<typeof cachedBrandSchema>;
export type BrandMeta = z.infer<typeof brandMetaSchema>;
