import { z } from "zod";
import { convertEmptyStringToNull } from "../utils";
import { safeUserSchema } from "./user";

export const brandSchema = z.object({
    id: z
        .string({
            required_error: "ID is required",
            invalid_type_error: "ID must be a string",
        })
        .uuid("ID is invalid"),
    name: z
        .string({
            required_error: "Name is required",
            invalid_type_error: "Name must be a string",
        })
        .min(3, "Name must be at least 3 characters long"),
    email: z
        .string({
            required_error: "Email is required",
            invalid_type_error: "Email must be a string",
        })
        .email("Email is invalid"),
    website: z
        .string({
            required_error: "Website is required",
            invalid_type_error: "Website must be a string",
        })
        .url("Website is invalid"),
    logoUrl: z.preprocess(
        convertEmptyStringToNull,
        z
            .string({
                invalid_type_error: "Logo URL must be a string",
            })
            .url("Logo URL is invalid")
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
    createdAt: z.date({
        required_error: "Created at is required",
        invalid_type_error: "Created at must be a date",
    }),
    updatedAt: z.date({
        required_error: "Updated at is required",
        invalid_type_error: "Updated at must be a date",
    }),
});

export const createBrandSchema = brandSchema.omit({
    id: true,
    createdAt: true,
    updatedAt: true,
});

export const brandWithOwnerAndMembersSchema = brandSchema.extend({
    owner: safeUserSchema,
    members: z.array(safeUserSchema),
});

export type Brand = z.infer<typeof brandSchema>;
export type CreateBrand = z.infer<typeof createBrandSchema>;
export type BrandWithOwnerAndMembers = z.infer<
    typeof brandWithOwnerAndMembersSchema
>;
