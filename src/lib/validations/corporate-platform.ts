import { z } from "zod";

export const corporatePlatformFileSchema = z.object({
    name: z.string().min(1),
    url: z.string().url(),
    type: z
        .string()
        .min(1)
        .refine(
            (value) =>
                [
                    "application/pdf",
                    "application/vnd.ms-powerpoint",
                    "application/vnd.openxmlformats-officedocument.presentationml.presentation",
                    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
                    "application/vnd.ms-excel",
                    "image/jpeg",
                    "image/png",
                    "application/zip",
                    "application/x-zip-compressed",
                ].includes(value),
            "Unsupported file type"
        ),
    size: z
        .number()
        .int()
        .nonnegative()
        .max(50 * 1024 * 1024, "File size must be 50 MB or less"),
    key: z.string().min(1).optional(),
});

export const corporateWorkflowStatusSchema = z.enum([
    "rfq_submitted",
    "under_review",
    "brand_matching",
    "quote_preparation",
    "quote_sent",
    "customer_review",
    "quote_accepted",
    "quote_rejected",
    "advance_pending",
    "advance_paid",
    "artwork_review",
    "artwork_approved",
    "production_started",
    "qc_pending",
    "qc_approved",
    "dispatched",
    "delivered",
    "payment_pending",
    "completed",
    "cancelled",
    "closed",
]);

export const corporatePaymentLifecycleStatusSchema = z.enum([
    "payment_pending",
    "payment_initiated",
    "payment_success",
    "payment_failed",
    "payment_refunded",
    "payment_partial",
]);

export const corporateProfileInputSchema = z.object({
    companyName: z.string().min(2),
    gstNumber: z.string().trim().max(32).nullable().optional(),
    website: z.string().url().nullable().optional(),
    companySize: z.string().trim().max(120).nullable().optional(),
    industry: z.string().trim().max(120).nullable().optional(),
    contactPerson: z.string().min(2),
    email: z.string().email(),
    phone: z.string().min(8).max(20),
    billingAddress: z.record(z.string(), z.unknown()).default({}),
    shippingAddress: z.record(z.string(), z.unknown()).default({}),
});

export const corporateCatalogListInputSchema = z.object({
    search: z.string().trim().optional(),
    brandId: z.string().uuid().optional(),
    categoryId: z.string().uuid().optional(),
    customizationAvailable: z.boolean().optional(),
    page: z.number().int().positive().default(1),
    limit: z.number().int().positive().max(50).default(12),
});

export const corporateRfqInputSchema = z.object({
    profileId: z.string().uuid().nullable().optional(),
    companyName: z.string().min(2),
    contactPerson: z.string().min(2),
    email: z.string().email(),
    phone: z.string().min(8).max(20),
    useCase: z.string().min(2),
    quantity: z.number().int().positive(),
    budgetPerUnitPaise: z.number().int().nonnegative().nullable().optional(),
    deliveryDate: z.string().date(),
    sustainabilityRequired: z.boolean().default(false),
    brandingRequired: z.boolean().default(true),
    requirementDescription: z.string().min(10),
    procurementMode: z
        .enum(["self_service", "rfq", "enterprise_po"])
        .default("rfq"),
    attachments: z.array(corporatePlatformFileSchema).max(6).default([]),
}).superRefine((value, ctx) => {
    const totalSize = value.attachments.reduce((sum, file) => sum + file.size, 0);
    if (totalSize > 50 * 1024 * 1024) {
        ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: ["attachments"],
            message: "Total attachment size must be 50 MB or less",
        });
    }
});

export const corporateQuoteInputSchema = z.object({
    rfqId: z.string().uuid().nullable().optional(),
    corporateProfileId: z.string().uuid(),
    brandId: z.string().uuid(),
    productId: z.string().uuid().nullable().optional(),
    corporateProductConfigId: z.string().uuid().nullable().optional(),
    productTypeId: z.string().uuid().nullable().optional(),
    gsmOptionId: z.string().uuid().nullable().optional(),
    fabricCompositionId: z.string().uuid().nullable().optional(),
    quantity: z.number().int().positive(),
    subtotalPaise: z.number().int().nonnegative(),
    customizationCostPaise: z.number().int().nonnegative().default(0),
    gstAmountPaise: z.number().int().nonnegative().default(0),
    totalAmountPaise: z.number().int().nonnegative(),
    advanceAmountPaise: z.number().int().nonnegative().default(0),
    balanceAmountPaise: z.number().int().nonnegative().default(0),
    validUntil: z.string().date().nullable().optional(),
    comments: z.string().trim().max(1000).nullable().optional(),
});

export const corporateQuoteDecisionInputSchema = z.object({
    quoteId: z.string().uuid(),
    decision: z.enum(["approved", "rejected", "revision_requested"]),
    notes: z.string().trim().max(1000).nullable().optional(),
});

export const corporateQuoteRevisionInputSchema = z.object({
    quoteId: z.string().uuid(),
    subtotalPaise: z.number().int().nonnegative(),
    customizationCostPaise: z.number().int().nonnegative().default(0),
    gstAmountPaise: z.number().int().nonnegative().default(0),
    totalAmountPaise: z.number().int().nonnegative(),
    comments: z.string().trim().max(1000).nullable().optional(),
});

export const corporatePurchaseOrderInputSchema = z.object({
    quoteId: z.string().uuid(),
    corporateOrderId: z.string().uuid().nullable().optional(),
    corporateProfileId: z.string().uuid(),
    poNumber: z.string().min(1),
    companyName: z.string().min(2),
    poValuePaise: z.number().int().nonnegative(),
    poDate: z.string().date().nullable().optional(),
    deliveryDate: z.string().date().nullable().optional(),
    productScopeSummary: z.string().trim().min(5),
    authorizedSignatoryName: z.string().trim().min(2),
    authorizedSignatoryConfirmed: z.literal(true),
    uploadedFile: corporatePlatformFileSchema,
    reviewNotes: z.string().trim().max(1000).nullable().optional(),
});

export const corporatePurchaseOrderReviewInputSchema = z.object({
    purchaseOrderId: z.string().uuid(),
    status: z.enum([
        "po_review",
        "po_accepted",
        "po_rejected",
        "po_requires_changes",
    ]),
    reviewNotes: z.string().trim().max(1000).nullable().optional(),
    validationSummary: z
        .object({
            companyNameMatches: z.boolean(),
            orderValueMatches: z.boolean(),
            deliveryDateFeasible: z.boolean(),
            productScopeMatches: z.boolean(),
            authorizedSignatoryPresent: z.boolean(),
        })
        .optional(),
});

export const corporateTaskInputSchema = z.object({
    taskType: z.string().min(1),
    entityType: z.string().min(1),
    entityId: z.string().uuid(),
    assignedToUserId: z.string().min(1).nullable().optional(),
    dueDate: z.string().date().nullable().optional(),
    priority: z.enum(["low", "medium", "high", "critical"]).default("medium"),
    notes: z.string().trim().max(1000).nullable().optional(),
});

export const corporateShipmentInputSchema = z.object({
    orderId: z.string().uuid(),
    courierName: z.string().trim().max(120).nullable().optional(),
    trackingNumber: z.string().trim().max(120).nullable().optional(),
    awbNumber: z.string().trim().max(120).nullable().optional(),
    trackingUrl: z.string().url().nullable().optional(),
    dispatchDate: z.string().date().nullable().optional(),
    deliveryDate: z.string().date().nullable().optional(),
    status: z
        .enum(["draft", "ready", "dispatched", "in_transit", "delivered", "failed"])
        .default("draft"),
    provider: z.string().trim().max(80).default("manual"),
});

export const corporateForwardOrderInputSchema = z.object({
    orderId: z.string().uuid(),
    packageSource: z.enum(["preset", "custom"]),
    selectedPackingTypeId: z.string().uuid().nullable().optional(),
    lengthCm: z.number().int().positive(),
    widthCm: z.number().int().positive(),
    heightCm: z.number().int().positive(),
    weightGrams: z.number().int().positive(),
}).superRefine((value, ctx) => {
    if (value.packageSource === "preset" && !value.selectedPackingTypeId) {
        ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: ["selectedPackingTypeId"],
            message: "Select a package preset",
        });
    }
});

export const corporatePickupScheduleInputSchema = z.object({
    orderId: z.string().uuid(),
    pickupDate: z.string().date(),
    pickupTime: z.string().trim().min(1),
});

export const corporateQcSubmissionInputSchema = z.object({
    orderId: z.string().uuid(),
    remarks: z.string().trim().max(1000).nullable().optional(),
    sampleCoveragePercent: z.number().int().min(0).max(100).nullable().optional(),
    images: z.array(corporatePlatformFileSchema).min(1).max(10),
});

export const corporatePaymentInputSchema = z.object({
    orderId: z.string().uuid().nullable().optional(),
    quoteId: z.string().uuid().nullable().optional(),
    paymentType: z.enum(["advance", "balance", "manual", "refund", "partial"]),
    paymentMode: z.enum([
        "razorpay",
        "upi",
        "card",
        "net_banking",
        "manual",
        "neft",
        "rtgs",
        "bank_transfer",
    ]),
    amountPaise: z.number().int().nonnegative(),
    paymentReference: z.string().trim().max(200).nullable().optional(),
    paymentStatus: corporatePaymentLifecycleStatusSchema,
    paymentDate: z.string().date().nullable().optional(),
});

export const corporateProformaInvoiceInputSchema = z.object({
    quoteId: z.string().uuid(),
});

export const corporateTaxInvoiceInputSchema = z.object({
    orderId: z.string().uuid(),
});

export const corporateApprovedQuoteOrderInputSchema = z.object({
    quoteId: z.string().uuid(),
});

export const corporateReportInputSchema = z.object({
    reportType: z.enum([
        "daily_operations_summary",
        "weekly_sla_compliance",
        "monthly_corporate_review",
    ]),
});

export const corporateDashboardSummarySchema = z.object({
    rfqsPending: z.number().int().nonnegative(),
    quotesPending: z.number().int().nonnegative(),
    activeOrders: z.number().int().nonnegative(),
    qcPending: z.number().int().nonnegative(),
    dispatchPending: z.number().int().nonnegative(),
    paymentsPending: z.number().int().nonnegative(),
    refundRequests: z.number().int().nonnegative(),
    slaBreaches: z.number().int().nonnegative(),
    outstandingBalancePaise: z.number().int().nonnegative(),
});

export type CorporateProfileInput = z.infer<typeof corporateProfileInputSchema>;
export type CorporateRfqInput = z.infer<typeof corporateRfqInputSchema>;
export type CorporateQuoteInput = z.infer<typeof corporateQuoteInputSchema>;
export type CorporatePurchaseOrderInput = z.infer<
    typeof corporatePurchaseOrderInputSchema
>;
