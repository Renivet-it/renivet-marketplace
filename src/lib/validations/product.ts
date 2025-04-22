import { z } from "zod";
import { convertEmptyStringToNull } from "../utils";
import { brandSchema } from "./brand";
import { cachedBrandMediaItemSchema } from "./brand-media-item";
import {
    categorySchema,
    productTypeSchema,
    subCategorySchema,
} from "./category";
import { brandConfidentialSchema } from "./brand-confidential";

export const productOptionValueSchema = z.object({
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
        .min(1, "Name must be at least 1 characters long"),
    position: z
        .number({
            required_error: "Position is required",
            invalid_type_error: "Position must be a number",
        })
        .int("Position must be an integer")
        .nonnegative("Position must be a non-negative number"),
});

export const productJourneyDataSchema = z.object({
    id: z
        .string({
            required_error: "ID is required",
            invalid_type_error: "ID must be a string",
        })
        .uuid("ID is invalid"),
    title: z
        .string({
            required_error: "Title is required",
            invalid_type_error: "Title must be a string",
        })
        .min(1, "Title must be at least 1 characters long"),
    entries: z.array(
        z.object({
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
                .min(1, "Name must be at least 1 characters long"),
            location: z
                .string({
                    required_error: "Location is required",
                    invalid_type_error: "Location must be a string",
                })
                .min(1, "Location must be at least 1 characters long"),
            docUrl: z
                .string({
                    required_error: "Document URL is required",
                    invalid_type_error: "Document URL must be a string",
                })
                .url("Document URL is invalid"),
        })
    ),
});

export const productValueDataSchema = z.object({
    title: z
        .string({
            required_error: "Title is required",
            invalid_type_error: "Title must be a string",
        })
        .min(1, "Title must be at least 1 characters long"),
    description: z.preprocess(
        convertEmptyStringToNull,
        z
            .string({
                invalid_type_error: "Description must be a string",
            })
            .min(3, "Description must be at least 3 characters long")
            .nullable()
    ),
    status: z.enum(["verified", "self-declared"]),
    docUrl: z
        .string({
            required_error: "Document URL is required",
            invalid_type_error: "Document URL must be a string",
        })
        .url("Document URL is invalid"),
});

export const productMediaSchema = z.object({
    id: z
        .string({
            required_error: "ID is required",
            invalid_type_error: "ID must be a string",
        })
        .uuid("ID is invalid"),
    position: z
        .number({
            required_error: "Position is required",
            invalid_type_error: "Position must be a number",
        })
        .int("Position must be an integer")
        .nonnegative("Position must be a non-negative number"),
});

export const enhancedProductMediaSchema = productMediaSchema.extend({
    mediaItem: cachedBrandMediaItemSchema.nullable().optional(),
});

export const productVerificationStatusSchema = z.enum([
    "idle",
    "pending",
    "approved",
    "rejected",
]);

export const productImageFilterSchema = z.enum(["with", "without", "all"], {
    invalid_type_error: "Product image must be 'with', 'without', or 'all'",
  }).optional();
  export const productVisiblityFilterSchema = z.enum(["public", "private", "all"], {
    invalid_type_error: "Product visiblity must be 'public', 'private', or 'all'",
  }).optional();

export const productSchema = z.object({
    // BASIC INFO
    id: z
        .string({
            required_error: "ID is required",
            invalid_type_error: "ID must be a string",
        })
        .uuid("ID is invalid"),
    title: z
        .string({
            required_error: "Title is required",
            invalid_type_error: "Title must be a string",
        })
        .min(3, "Title must be at least 3 characters long"),
        sizeAndFit: z
        .string()
        .min(3, "Size & Fit must be at least 3 characters long")
        .or(z.literal("").transform(() => null))
        .nullable(),
        materialAndCare: z
        .string()
        .min(3, "Material & Care must be at least 3 characters long")
        .or(z.literal("").transform(() => null))
        .nullable(),
    slug: z
        .string({
            required_error: "Slug is required",
            invalid_type_error: "Slug must be a string",
        })
        .min(3, "Slug must be at least 3 characters long"),
    description: z.preprocess(
        convertEmptyStringToNull,
        z
            .string({
                invalid_type_error: "Description must be a string",
            })
            .min(3, "Description must be at least 3 characters long")
            .nullable()
    ),
    brandId: z
        .string({
            required_error: "Brand ID is required",
            invalid_type_error: "Brand ID must be a string",
        })
        .uuid("Brand ID is invalid"),
    isAvailable: z.boolean({
        required_error: "Availability is required",
        invalid_type_error: "Availability must be a boolean",
    }),
    isActive: z.boolean({
        required_error: "Active status is required",
        invalid_type_error: "Active status must be a boolean",
    }),
    isPublished: z.boolean({
        required_error: "Published status is required",
        invalid_type_error: "Published status must be a boolean",
    }),
    publishedAt: z
        .union([z.string(), z.date()], {
            required_error: "Published at is required",
            invalid_type_error: "Published at must be a date",
        })
        .transform((v) => new Date(v))
        .nullable(),
    media: productMediaSchema.array().default([]),
    sustainabilityCertificate: z.preprocess(
        convertEmptyStringToNull,
        z
            .string({
                invalid_type_error:
                    "Sustainability certificate must be a string",
            })
            .nullable()
    ),
    productHasVariants: z.boolean({
        required_error: "Product has variants status is required",
        invalid_type_error: "Product has variants status must be a boolean",
    }),

    // CATEGORY
    categoryId: z
        .string({
            required_error: "Category ID is required",
            invalid_type_error: "Category ID must be a string",
        })
        .uuid("Category ID is invalid"),
    subcategoryId: z
        .string({
            required_error: "Subcategory ID is required",
            invalid_type_error: "Subcategory ID must be a string",
        })
        .uuid("Subcategory ID is invalid"),
    productTypeId: z
        .string({
            required_error: "Product Type ID is required",
            invalid_type_error: "Product Type ID must be a string",
        })
        .uuid("Product Type ID is invalid"),

    // PRICING
    price: z
        .union([z.string(), z.number()])
        .transform((val) => Number(val))
        .pipe(z.number().nonnegative("Amount must be non-negative"))
        .nullable(),
    compareAtPrice: z
        .union([z.string(), z.number()])
        .transform((val) => Number(val))
        .pipe(z.number().nonnegative("Amount must be non-negative"))
        .nullable(),
    costPerItem: z
        .union([z.string(), z.number()])
        .transform((val) => Number(val))
        .pipe(z.number().nonnegative("Amount must be non-negative"))
        .nullable(),

    // INVENTORY
    nativeSku: z.preprocess(
        convertEmptyStringToNull,
        z
            .string({
                invalid_type_error: "Native SKU must be a string",
            })
            .min(3, "Native SKU must be at least 3 characters long")
            .nullable()
    ),
    sku: z.preprocess(
        convertEmptyStringToNull,
        z
            .string({
                required_error: "SKU is required",
                invalid_type_error: "SKU must be a string",
            })
            .min(3, "SKU must be at least 3 characters long")
            .nullable()
    ),
    barcode: z.preprocess(
        convertEmptyStringToNull,
        z
            .string({
                invalid_type_error: "Barcode must be a string",
            })
            .min(3, "Barcode must be at least 3 characters long")
            .nullable()
    ),
    quantity: z
        .union([z.string(), z.number()])
        .transform((val) => Number(val))
        .pipe(
            z
                .number()
                .int()
                .nonnegative("Quantity must be a non-negative number")
        )
        .nullable(),

    // SHIPPING
    weight: z
        .union([z.string(), z.number()])
        .transform((val) => Number(val))
        .pipe(
            z.number().int().nonnegative("Weight must be a non-negative number")
        )
        .nullable(),
    length: z
        .union([z.string(), z.number()])
        .transform((val) => Number(val))
        .pipe(
            z.number().int().nonnegative("Length must be a non-negative number")
        )
        .nullable(),
    width: z
        .union([z.string(), z.number()])
        .transform((val) => Number(val))
        .pipe(
            z.number().int().nonnegative("Width must be a non-negative number")
        )
        .nullable(),
    height: z
        .union([z.string(), z.number()])
        .transform((val) => Number(val))
        .pipe(
            z.number().int().nonnegative("Height must be a non-negative number")
        )
        .nullable(),
    originCountry: z.preprocess(
        convertEmptyStringToNull,
        z
            .string({
                invalid_type_error: "Origin country must be a string",
            })
            .min(1, "Origin country must be at least 1 characters long")
            .nullable()
    ),
    hsCode: z.preprocess(
        convertEmptyStringToNull,
        z
            .string({
                invalid_type_error: "HS code must be a string",
            })
            .min(1, "HS code must be at least 1 characters long")
            .nullable()
    ),

    // SEO
    metaTitle: z.preprocess(
        convertEmptyStringToNull,
        z
            .string({
                invalid_type_error: "Meta title must be a string",
            })
            .min(3, "Meta title must be at least 3 characters long")
            .max(70, "Meta title must be at most 70 characters long")
            .nullable()
    ),
    metaDescription: z.preprocess(
        convertEmptyStringToNull,
        z
            .string({
                invalid_type_error: "Meta description must be a string",
            })
            .min(3, "Meta description must be at least 3 characters long")
            .max(260, "Meta description must be at most 160 characters long")
            .nullable()
    ),
    metaKeywords: z.array(
        z
            .string({
                required_error: "Meta keyword is required",
                invalid_type_error: "Meta keyword must be a string",
            })
            .min(1, "Meta keyword must be at least 1 characters long")
    ),
    specifications: z
  .array(
    z.object({
      key: z
        .string()
        .min(1, "Specification key is required"),
      value: z
        .string()
        .min(1, "Specification value is required"),
    })
  )
  .optional(),
    // OTHER
    verificationStatus: productVerificationStatusSchema,
    productImageFilter: productImageFilterSchema,
    productVisiblityFilter: productVisiblityFilterSchema,
    isDeleted: z.boolean({
        required_error: "Deleted status is required",
        invalid_type_error: "Deleted status must be a boolean",
    }),
    deletedAt: z
        .union([z.string(), z.date()], {
            required_error: "Deleted at is required",
            invalid_type_error: "Deleted at must be a date",
        })
        .transform((v) => new Date(v))
        .nullable(),
    rejectedAt: z
        .union([z.string(), z.date()], {
            required_error: "Rejected at is required",
            invalid_type_error: "Rejected at must be a date",
        })
        .transform((v) => new Date(v))
        .nullable(),
    rejectionReason: z.preprocess(
        convertEmptyStringToNull,
        z
            .string({
                invalid_type_error: "Rejection reason must be a string",
            })
            .nullable()
    ),
    lastReviewedAt: z
        .union([z.string(), z.date()], {
            required_error: "Last reviewed at is required",
            invalid_type_error: "Last reviewed at must be a date",
        })
        .transform((v) => new Date(v))
        .nullable(),
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
        returnable: z.boolean().optional(),
        returnDescription: z.string().nullable().optional(),
        exchangeable: z.boolean().optional(),
        exchangeDescription: z.string().nullable().optional(),
        isFeaturedWomen: z.boolean().optional().default(false),
        isFeaturedMen: z.boolean().optional().default(false),
});

export const productOptionSchema = z.object({
    id: z
        .string({
            required_error: "ID is required",
            invalid_type_error: "ID must be a string",
        })
        .uuid("ID is invalid"),
    productId: z
        .string({
            required_error: "Product ID is required",
            invalid_type_error: "Product ID must be a string",
        })
        .uuid("Product ID is invalid"),
    name: z
        .string({
            required_error: "Name is required",
            invalid_type_error: "Name must be a string",
        })
        .min(1, "Name must be at least 1 characters long"),
    values: z.array(productOptionValueSchema),
    position: z
        .number({
            required_error: "Position is required",
            invalid_type_error: "Position must be a number",
        })
        .int("Position must be an integer")
        .nonnegative("Position must be a non-negative number"),
    isDeleted: z.boolean({
        required_error: "Deleted status is required",
        invalid_type_error: "Deleted status must be a boolean",
    }),
    deletedAt: z
        .union([z.string(), z.date()], {
            required_error: "Deleted at is required",
            invalid_type_error: "Deleted at must be a date",
        })
        .transform((v) => new Date(v))
        .nullable(),
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

export const returnExchangePolicySchema = z.object({
    id: z.string().uuid(),
    productId: z.string().uuid(),

    returnable: z.boolean(),
    returnDescription: z.string().nullable().optional(),
    returnPeriod: z.number().nonnegative(),

    exchangeable: z.boolean(),
    exchangeDescription: z.string().nullable().optional(),
    exchangePeriod: z.number().nonnegative(),

    createdAt: z.union([z.string(), z.date()]).transform((v) => new Date(v)),
    updatedAt: z.union([z.string(), z.date()]).transform((v) => new Date(v)),
});

export const productVariantSchema = z.object({
    // BASIC INFO
    id: z
        .string({
            required_error: "ID is required",
            invalid_type_error: "ID must be a string",
        })
        .uuid("ID is invalid"),
    productId: z
        .string({
            required_error: "Product ID is required",
            invalid_type_error: "Product ID must be a string",
        })
        .uuid("Product ID is invalid"),
    image: z.preprocess(
        convertEmptyStringToNull,
        z
            .string({
                invalid_type_error: "Image must be a string",
            })
            .uuid("Image is invalid")
            .nullable()
    ),
    combinations: z.record(z.string(), z.string()),

    // PRICING
    price: z
        .union([z.string(), z.number()])
        .transform((val) => Number(val))
        .pipe(z.number().nonnegative("Amount must be non-negative")),
    compareAtPrice: z
        .union([z.string(), z.number()])
        .transform((val) => Number(val))
        .pipe(z.number().nonnegative("Amount must be non-negative"))
        .nullable(),
    costPerItem: z
        .union([z.string(), z.number()])
        .transform((val) => Number(val))
        .pipe(z.number().nonnegative("Amount must be non-negative"))
        .nullable(),

    // INVENTORY
    nativeSku: z
        .string({
            required_error: "Native SKU is required",
            invalid_type_error: "Native SKU must be a string",
        })
        .min(3, "Native SKU must be at least 3 characters long"),
    sku: z.preprocess(
        convertEmptyStringToNull,
        z
            .string({
                invalid_type_error: "SKU must be a string",
            })
            .min(3, "SKU must be at least 3 characters long")
            .nullable()
    ),
    barcode: z.preprocess(
        convertEmptyStringToNull,
        z
            .string({
                invalid_type_error: "Barcode must be a string",
            })
            .min(3, "Barcode must be at least 3 characters long")
            .nullable()
    ),
    quantity: z
        .union([z.string(), z.number()])
        .transform((val) => Number(val))
        .pipe(
            z
                .number()
                .int()
                .nonnegative("Quantity must be a non-negative number")
        ),

    // SHIPPING
    weight: z
        .union([z.string(), z.number()])
        .transform((val) => Number(val))
        .pipe(
            z.number().int().nonnegative("Weight must be a non-negative number")
        ),
    length: z
        .union([z.string(), z.number()])
        .transform((val) => Number(val))
        .pipe(
            z.number().int().nonnegative("Length must be a non-negative number")
        ),
    width: z
        .union([z.string(), z.number()])
        .transform((val) => Number(val))
        .pipe(
            z.number().int().nonnegative("Width must be a non-negative number")
        ),
    height: z
        .union([z.string(), z.number()])
        .transform((val) => Number(val))
        .pipe(
            z.number().int().nonnegative("Height must be a non-negative number")
        ),
    originCountry: z.preprocess(
        convertEmptyStringToNull,
        z
            .string({
                invalid_type_error: "Origin country must be a string",
            })
            .min(1, "Origin country must be at least 1 characters long")
            .nullable()
    ),
    hsCode: z.preprocess(
        convertEmptyStringToNull,
        z
            .string({
                invalid_type_error: "HS code must be a string",
            })
            .min(1, "HS code must be at least 1 characters long")
            .nullable()
    ),
    isDeleted: z.boolean({
        required_error: "Deleted status is required",
        invalid_type_error: "Deleted status must be a boolean",
    }),
    deletedAt: z
        .union([z.string(), z.date()], {
            required_error: "Deleted at is required",
            invalid_type_error: "Deleted at must be a date",
        })
        .transform((v) => new Date(v))
        .nullable(),
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

export const enhancedProductVariantSchema = productVariantSchema.extend({
    mediaItem: cachedBrandMediaItemSchema.nullable(),
});

export const productJourneySchema = z.object({
    id: z
        .string({
            required_error: "ID is required",
            invalid_type_error: "ID must be a string",
        })
        .uuid("ID is invalid"),
    productId: z
        .string({
            required_error: "Product ID is required",
            invalid_type_error: "Product ID must be a string",
        })
        .uuid("Product ID is invalid"),
    data: productJourneyDataSchema.array(),
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

export const productValueSchema = z.object({
    id: z
        .string({
            required_error: "ID is required",
            invalid_type_error: "ID must be a string",
        })
        .uuid("ID is invalid"),
    productId: z
        .string({
            required_error: "Product ID is required",
            invalid_type_error: "Product ID must be a string",
        })
        .uuid("Product ID is invalid"),
    data: productValueDataSchema.array(),
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

export const productVariantGroupSchema = z.object({
    key: z
        .string({
            required_error: "Key is required",
            invalid_type_error: "Key must be a string",
        })
        .min(1, "Key must be at least 1 characters long"),
    value: z
        .string({
            required_error: "Value is required",
            invalid_type_error: "Value must be a string",
        })
        .min(1, "Value must be at least 1 characters long"),
    variants: z.array(productVariantSchema),
    totalQuantity: z
        .union([z.string(), z.number()])
        .transform((val) => Number(val))
        .pipe(
            z
                .number()
                .int()
                .nonnegative("Total quantity must be a non-negative number")
        ),
});

export const productWithBrandSchema = productSchema.extend({
    // brand: z.lazy(() => brandSchema),
        brand: z.lazy(() => brandSchema.extend({
        confidential: brandConfidentialSchema.optional() // ← Add this line
    })),
    options: z.array(productOptionSchema),
    variants: z.array(enhancedProductVariantSchema),
    returnExchangePolicy: returnExchangePolicySchema.nullable().optional(),
    media: z.array(enhancedProductMediaSchema),
    sustainabilityCertificate: cachedBrandMediaItemSchema.nullish(),
    category: categorySchema,
    subcategory: subCategorySchema,
    productType: productTypeSchema,
    journey: productJourneySchema.nullable(),
    values: productValueSchema.nullable(),
        confidentialData: brandConfidentialSchema.optional() // ← Add this line

});

export const createProductSchema = productSchema
    .omit({
        id: true,
        slug: true,
        deletedAt: true,
        isAvailable: true,
        isActive: true,
        isDeleted: true,
        isPublished: true,
        lastReviewedAt: true,
        publishedAt: true,
        rejectedAt: true,
        rejectionReason: true,
        verificationStatus: true,
        isFeaturedMen: true,
        isFeaturedWomen: true,
        createdAt: true,
        updatedAt: true,
    })
    .extend({
        options: z.array(productOptionSchema),
        variants: z.array(productVariantSchema),
        returnExchangePolicy: returnExchangePolicySchema.nullable().optional(),
        media: z.array(productMediaSchema).optional(),
    })
    .superRefine((data, ctx) => {
        if (!data.productHasVariants) {
            if (
                data.price === null ||
                data.quantity === null ||
                data.weight === null ||
                data.length === null ||
                data.width === null ||
                data.height === null
            ) {
                ctx.addIssue({
                    code: z.ZodIssueCode.custom,
                    message:
                        "Product without variants must have price, quantity, and dimensions",
                    path: ["price"],
                });
                return false;
            }

            if (data.options.length > 0 || data.variants.length > 0) {
                ctx.addIssue({
                    code: z.ZodIssueCode.custom,
                    message:
                        "Product without variants cannot have options or variants",
                    path: ["options"],
                });
                return false;
            }

            return true;
        }

        if (data.options.length === 0 || data.variants.length === 0) {
            ctx.addIssue({
                code: z.ZodIssueCode.custom,
                message:
                    "Product with variants must have both options and variants defined",
                path: ["productHasVariants"],
            });
            return false;
        }

        const hasEmptyOptions = data.options.some(
            (option) => option.values.length === 0
        );
        if (hasEmptyOptions) {
            ctx.addIssue({
                code: z.ZodIssueCode.custom,
                message: "All options must have at least one value",
                path: ["options"],
            });
            return false;
        }

        const optionIds = data.options.map((opt) => opt.id);

        for (const variant of data.variants) {
            const variantKeys = Object.keys(variant.combinations);

            if (variantKeys.length !== optionIds.length) {
                ctx.addIssue({
                    code: z.ZodIssueCode.custom,
                    message: "Each variant must specify all options",
                    path: ["variants"],
                });
                return false;
            }

            for (const key of variantKeys) {
                if (!optionIds.includes(key)) {
                    ctx.addIssue({
                        code: z.ZodIssueCode.custom,
                        message: `Unknown option ID "${key}" in variant`,
                        path: ["variants"],
                    });
                    return false;
                }

                const option = data.options.find((opt) => opt.id === key);
                const isValidValue = option?.values.some(
                    (val) => val.id === variant.combinations[key]
                );

                if (!isValidValue) {
                    ctx.addIssue({
                        code: z.ZodIssueCode.custom,
                        message: `Invalid value for option "${option?.name}"`,
                        path: ["variants"],
                    });
                    return false;
                }
            }
        }

        return true;
    });

export const createProductJourneySchema = productJourneySchema.omit({
    id: true,
    createdAt: true,
    updatedAt: true,
});

export const createProductValueSchema = productValueSchema.omit({
    id: true,
    createdAt: true,
    updatedAt: true,
});

export const updateProductJourneySchema = createProductJourneySchema.omit({
    productId: true,
});

export const updateProductValueSchema = createProductValueSchema.omit({
    productId: true,
});

export const updateProductSchema = createProductSchema;

export const rejectProductSchema = productSchema.pick({
    id: true,
    rejectionReason: true,
});

export const updateProductMediaInputSchema = z.object({
    productId: z.string(),
    media: z.array(
      z.object({
        id: z.string(), // Assuming media.id is a string; adjust if it's a number
        position: z.number(),
      })
    ),
  });

export type Product = z.infer<typeof productSchema>;
export type ProductOptionValue = z.infer<typeof productOptionValueSchema>;
export type ProductJourneyData = z.infer<typeof productJourneyDataSchema>;
export type ProductValueData = z.infer<typeof productValueDataSchema>;
export type ProductValue = z.infer<typeof productValueSchema>;
export type ProductJourney = z.infer<typeof productJourneySchema>;
export type CreateProductJourney = z.infer<typeof createProductJourneySchema>;
export type CreateProductValue = z.infer<typeof createProductValueSchema>;
export type UpdateProductJourney = z.infer<typeof updateProductJourneySchema>;
export type UpdateProductValue = z.infer<typeof updateProductValueSchema>;
export type ProductMedia = z.infer<typeof productMediaSchema>;
export type ProductOption = z.infer<typeof productOptionSchema>;
export type ProductVariant = z.infer<typeof productVariantSchema>;
export type ProductVariantGroup = z.infer<typeof productVariantGroupSchema>;
export type ProductWithBrand = z.infer<typeof productWithBrandSchema>;
export type CreateProduct = z.infer<typeof createProductSchema>;
export type UpdateProduct = z.infer<typeof updateProductSchema>;
export type RejectProduct = z.infer<typeof rejectProductSchema>;
export type ReturnExchangePolicy = z.infer<typeof returnExchangePolicySchema>;
export type UpdateProductMediaInput = z.infer<typeof updateProductMediaInputSchema>;