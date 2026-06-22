import { z } from "zod";

export const corporateOrderStatusSchema = z.enum([
    "draft",
    "payment_pending",
    "payment_failed",
    "inquiry_received",
    "under_review",
    "approved",
    "in_production",
    "quality_check",
    "ready_for_dispatch",
    "dispatched",
    "delivered",
    "completed",
]);

export const corporateOrderWorkflowStatusSchema = z.enum([
    "inquiry_received",
    "under_review",
    "approved",
    "in_production",
    "quality_check",
    "ready_for_dispatch",
    "dispatched",
    "delivered",
    "completed",
]);

export const corporatePaymentStatusSchema = z.enum([
    "pending",
    "paid",
    "failed",
]);

export const corporateBalancePaymentStatusSchema = z.enum([
    "pending",
    "shared",
    "paid",
]);

export const corporateFileSchema = z.object({
    url: z.string().url(),
    name: z.string().min(1),
    size: z.number().int().nonnegative(),
    key: z.string().min(1).optional(),
    type: z.string().min(1),
});

export const corporateEmployeeRowSchema = z.object({
    employeeName: z.string().min(1, "Employee name is required"),
    size: z.enum(["XS", "S", "M", "L", "XL", "XXL", "XXXL"]),
});

export const corporateBaseConfigSchema = z.object({
    id: z.string().uuid(),
    isActive: z.boolean().default(true),
    sortOrder: z.number().int().default(0),
    createdAt: z.union([z.string(), z.date()]).transform((v) => new Date(v)),
    updatedAt: z.union([z.string(), z.date()]).transform((v) => new Date(v)),
});

export const corporateProductTypeSchema = corporateBaseConfigSchema.extend({
    name: z.string().min(1),
    description: z.string().nullable().optional(),
});

export const corporateGsmOptionSchema = corporateBaseConfigSchema.extend({
    label: z.string().min(1),
    gsmValue: z.number().int().positive(),
});

export const corporateFabricCompositionSchema = corporateBaseConfigSchema.extend({
    name: z.string().min(1),
    description: z.string().nullable().optional(),
});

export const corporateColorOptionSchema = corporateBaseConfigSchema.extend({
    name: z.string().min(1),
    hexCode: z.string().nullable().optional(),
    isCustom: z.boolean().default(false),
});

export const corporatePrintMethodSchema = corporateBaseConfigSchema.extend({
    name: z.string().min(1),
    priceModifierPaise: z.number().int().nonnegative(),
});

export const corporateLogoLocationSchema = corporateBaseConfigSchema.extend({
    name: z.string().min(1),
    placementGroup: z.string().min(1),
});

export const corporateExtraChargeRuleSchema = corporateBaseConfigSchema.extend({
    code: z.string().min(1),
    name: z.string().min(1),
    chargeType: z.enum(["flat", "per_unit", "per_location"]),
    amountPaise: z.number().int().nonnegative(),
    isDefaultSelected: z.boolean().default(false),
});

export const corporatePricingSlabSchema = corporateBaseConfigSchema.extend({
    productTypeId: z.string().uuid(),
    gsmOptionId: z.string().uuid(),
    minQuantity: z.number().int().positive(),
    maxQuantity: z.number().int().positive().nullable().optional(),
    unitPricePaise: z.number().int().nonnegative(),
});

export const corporateOrderSettingsSchema = z.object({
    id: z.string().uuid(),
    gstRateBps: z.number().int().nonnegative(),
    advancePercentBps: z.number().int().positive(),
    expectedTimelineText: z.string().min(1),
    isActive: z.boolean().default(true),
    createdAt: z.union([z.string(), z.date()]).transform((v) => new Date(v)),
    updatedAt: z.union([z.string(), z.date()]).transform((v) => new Date(v)),
});

export const corporateOrderFormInputSchema = z.object({
    companyName: z.string().min(2),
    contactPersonName: z.string().min(2),
    emailAddress: z.string().email(),
    mobileNumber: z.string().min(8).max(20),
    gstNumber: z.string().trim().max(32).nullable().optional(),
    deliveryAddress: z.string().min(10),
    numberOfEmployees: z.number().int().positive(),
    productTypeId: z.string().uuid(),
    gsmOptionId: z.string().uuid(),
    fabricCompositionId: z.string().uuid(),
    colorOptionIds: z.array(z.string().uuid()).min(1),
    customColorRequest: z.string().trim().max(500).nullable().optional(),
    quantity: z.number().int().positive().optional(),
    logoLocationIds: z.array(z.string().uuid()).min(1),
    printMethodId: z.string().uuid(),
    extraChargeRuleIds: z.array(z.string().uuid()).default([]),
    artworkFile: corporateFileSchema,
    employeeSheetFile: corporateFileSchema,
    employeeRows: z.array(corporateEmployeeRowSchema).min(1),
    customerNotes: z.string().trim().max(1000).nullable().optional(),
});

export const corporateOrderQuoteSchema = z.object({
    quantity: z.number().int().positive(),
    employeeCount: z.number().int().positive(),
    sizeBreakdown: z.record(z.string(), z.number().int().nonnegative()),
    subtotalPaise: z.number().int().nonnegative(),
    printMethodChargePaise: z.number().int().nonnegative(),
    extraChargesPaise: z.number().int().nonnegative(),
    customizationPaise: z.number().int().nonnegative(),
    gstRateBps: z.number().int().nonnegative(),
    gstPaise: z.number().int().nonnegative(),
    totalPaise: z.number().int().nonnegative(),
    advancePercentBps: z.number().int().nonnegative(),
    advancePaidPaise: z.number().int().nonnegative(),
    balanceDuePaise: z.number().int().nonnegative(),
    unitPricePaise: z.number().int().nonnegative(),
    appliedPricingSlabId: z.string().uuid(),
    printMethod: corporatePrintMethodSchema,
    appliedExtraCharges: z.array(
        z.object({
            id: z.string().uuid(),
            code: z.string(),
            name: z.string(),
            amountPaise: z.number().int().nonnegative(),
        })
    ),
});

export const corporateOrderSchema = z.object({
    id: z.string().uuid(),
    sequenceNo: z.number().int().positive(),
    publicOrderId: z.string().min(1),
    userId: z.string().min(1),
    status: corporateOrderStatusSchema,
    paymentStatus: corporatePaymentStatusSchema,
    companyName: z.string(),
    contactPersonName: z.string(),
    emailAddress: z.string().email(),
    mobileNumber: z.string(),
    gstNumber: z.string().nullable().optional(),
    deliveryAddress: z.string(),
    numberOfEmployees: z.number().int().positive(),
    employeeCount: z.number().int().positive(),
    quantity: z.number().int().positive(),
    sizeBreakdown: z.record(z.string(), z.number().int().nonnegative()),
    employeeRows: z.array(corporateEmployeeRowSchema),
    companySnapshot: z.record(z.string(), z.unknown()),
    productConfigSnapshot: z.record(z.string(), z.unknown()),
    brandingConfigSnapshot: z.record(z.string(), z.unknown()),
    pricingSnapshot: z.record(z.string(), z.unknown()),
    artworkFile: z.record(z.string(), z.unknown()).nullable().optional(),
    employeeSheetFile: z.record(z.string(), z.unknown()).nullable().optional(),
    subtotalPaise: z.number().int().nonnegative(),
    customizationPaise: z.number().int().nonnegative(),
    gstRateBps: z.number().int().nonnegative(),
    gstPaise: z.number().int().nonnegative(),
    totalPaise: z.number().int().nonnegative(),
    advancePercentBps: z.number().int().nonnegative(),
    advancePaidPaise: z.number().int().nonnegative(),
    balanceDuePaise: z.number().int().nonnegative(),
    razorpayOrderId: z.string().nullable().optional(),
    razorpayPaymentId: z.string().nullable().optional(),
    razorpaySignature: z.string().nullable().optional(),
    paymentReference: z.string().nullable().optional(),
    balancePaymentLink: z.string().nullable().optional(),
    balancePaymentNotes: z.string().nullable().optional(),
    balancePaymentStatus: corporateBalancePaymentStatusSchema,
    customerNotes: z.string().nullable().optional(),
    internalNotes: z.string().nullable().optional(),
    createdAt: z.union([z.string(), z.date()]).transform((v) => new Date(v)),
    updatedAt: z.union([z.string(), z.date()]).transform((v) => new Date(v)),
});

export const corporateOrderStatusHistorySchema = z.object({
    id: z.string().uuid(),
    corporateOrderId: z.string().uuid(),
    fromStatus: z.string().nullable().optional(),
    toStatus: z.string(),
    changedByUserId: z.string().nullable().optional(),
    note: z.string().nullable().optional(),
    metadata: z.record(z.string(), z.unknown()).nullable().optional(),
    createdAt: z.union([z.string(), z.date()]).transform((v) => new Date(v)),
    updatedAt: z.union([z.string(), z.date()]).transform((v) => new Date(v)),
});

export const corporateOrderConfirmationSchema = z.object({
    order: corporateOrderSchema,
    settings: corporateOrderSettingsSchema,
});

export const corporatePaymentConfirmationInputSchema = z.object({
    corporateOrderId: z.string().uuid(),
    razorpayOrderId: z.string().min(1),
    razorpayPaymentId: z.string().min(1),
    razorpaySignature: z.string().min(1),
});

export const corporateOrderListInputSchema = z.object({
    page: z.number().int().positive().default(1),
    limit: z.number().int().positive().max(100).default(10),
    search: z.string().trim().optional(),
    status: corporateOrderStatusSchema.optional(),
});

export const corporateConfigUpsertInputSchema = z.object({
    productTypes: z
        .array(
            z.object({
                id: z.string().uuid().optional(),
                name: z.string().min(1),
                description: z.string().nullable().optional(),
                isActive: z.boolean().default(true),
                sortOrder: z.number().int().default(0),
            })
        )
        .default([]),
    gsmOptions: z
        .array(
            z.object({
                id: z.string().uuid().optional(),
                label: z.string().min(1),
                gsmValue: z.number().int().positive(),
                isActive: z.boolean().default(true),
                sortOrder: z.number().int().default(0),
            })
        )
        .default([]),
    fabricCompositions: z
        .array(
            z.object({
                id: z.string().uuid().optional(),
                name: z.string().min(1),
                description: z.string().nullable().optional(),
                isActive: z.boolean().default(true),
                sortOrder: z.number().int().default(0),
            })
        )
        .default([]),
    colorOptions: z
        .array(
            z.object({
                id: z.string().uuid().optional(),
                name: z.string().min(1),
                hexCode: z.string().nullable().optional(),
                isCustom: z.boolean().default(false),
                isActive: z.boolean().default(true),
                sortOrder: z.number().int().default(0),
            })
        )
        .default([]),
    printMethods: z
        .array(
            z.object({
                id: z.string().uuid().optional(),
                name: z.string().min(1),
                priceModifierPaise: z.number().int().nonnegative(),
                isActive: z.boolean().default(true),
                sortOrder: z.number().int().default(0),
            })
        )
        .default([]),
    logoLocations: z
        .array(
            z.object({
                id: z.string().uuid().optional(),
                name: z.string().min(1),
                placementGroup: z.string().min(1),
                isActive: z.boolean().default(true),
                sortOrder: z.number().int().default(0),
            })
        )
        .default([]),
    extraChargeRules: z
        .array(
            z.object({
                id: z.string().uuid().optional(),
                code: z.string().min(1),
                name: z.string().min(1),
                chargeType: z.enum(["flat", "per_unit", "per_location"]),
                amountPaise: z.number().int().nonnegative(),
                isDefaultSelected: z.boolean().default(false),
                isActive: z.boolean().default(true),
                sortOrder: z.number().int().default(0),
            })
        )
        .default([]),
    pricingSlabs: z
        .array(
            z.object({
                id: z.string().uuid().optional(),
                productTypeId: z.string().uuid(),
                gsmOptionId: z.string().uuid(),
                minQuantity: z.number().int().positive(),
                maxQuantity: z.number().int().positive().nullable().optional(),
                unitPricePaise: z.number().int().nonnegative(),
                isActive: z.boolean().default(true),
                sortOrder: z.number().int().default(0),
            })
        )
        .default([]),
    settings: z.object({
        gstRateBps: z.number().int().nonnegative(),
        advancePercentBps: z.number().int().positive(),
        expectedTimelineText: z.string().min(1),
        isActive: z.boolean().default(true),
    }),
});

export type CorporateOrderStatus = z.infer<typeof corporateOrderStatusSchema>;
export type CorporateOrderWorkflowStatus = z.infer<
    typeof corporateOrderWorkflowStatusSchema
>;
export type CorporateOrderFormInput = z.infer<
    typeof corporateOrderFormInputSchema
>;
export type CorporateOrderQuote = z.infer<typeof corporateOrderQuoteSchema>;
export type CorporatePricingSlab = z.infer<typeof corporatePricingSlabSchema>;
export type CorporateExtraChargeRule = z.infer<
    typeof corporateExtraChargeRuleSchema
>;
export type CorporateOrderConfigSnapshot = z.infer<
    typeof corporateConfigUpsertInputSchema
>;
export type CorporateOrderPricingSnapshot = z.infer<
    typeof corporateOrderQuoteSchema
>;
export type CorporateOrder = z.infer<typeof corporateOrderSchema>;
