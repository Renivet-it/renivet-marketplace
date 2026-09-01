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

export const corporatePlatformGstinValidation = z
    .string()
    .trim()
    .max(32)
    .refine(
        (val) => !val || /^\d{2}[A-Z]{5}\d{4}[A-Z]\d[Z][A-Z0-9]$/.test(val),
        "Invalid GSTIN format (must be 15-character valid Indian GSTIN, e.g. 29ABCDE1234F1Z5)"
    )
    .nullable()
    .optional();

export const corporateProfileInputSchema = z.object({
    companyName: z.string().min(2),
    gstNumber: corporatePlatformGstinValidation,
    website: z.string().url().nullable().optional(),
    companySize: z.string().trim().max(120).nullable().optional(),
    industry: z.string().trim().max(120).nullable().optional(),
    contactPerson: z.string().min(2),
    email: z.string().email(),
    phone: z.string().min(8).max(20),
    billingAddress: z.record(z.string(), z.unknown()).default({}),
    shippingAddress: z.record(z.string(), z.unknown()).default({}),
});

export const corporateAdminBuyerProfileInputSchema = z.object({
    rfqId: z.string().uuid(),
    companyName: z.string().trim().min(2).max(160),
    contactPerson: z.string().trim().min(2).max(160),
    email: z.string().trim().email().max(254),
    phone: z.string().trim().min(8).max(20),
});

export const corporateAdminManualQuoteInputSchema = z.object({
    companyName: z.string().trim().min(2).max(160),
    contactPerson: z.string().trim().min(2).max(160),
    email: z.string().trim().email().max(254),
    phone: z.string().trim().min(8).max(20),
    gstNumber: z.string().trim().max(64).nullable().optional(),
    deliveryAddress: z.string().trim().max(1000).nullable().optional(),
    deliveryCity: z.string().trim().max(100).nullable().optional(),
    deliveryState: z.string().trim().max(100).nullable().optional(),
    deliveryPincode: z
        .string()
        .trim()
        .regex(/^\d{6}$/, "Must be a 6-digit PIN code")
        .nullable()
        .optional()
        .or(z.literal("")),
    deliveryCountry: z
        .string()
        .trim()
        .max(100)
        .default("India")
        .nullable()
        .optional(),
    brandId: z.string().uuid(),
    productTypeId: z.string().uuid().nullable().optional(),
    hsnCode: z.string().trim().max(16).nullable().optional(),
    gsmOptionId: z.string().uuid().nullable().optional(),
    fabricCompositionId: z.string().uuid().nullable().optional(),
    extraChargeRuleIds: z.array(z.string().uuid()).default([]),
    manualExtraAmountPaise: z.number().int().nonnegative().default(0),
    manualExtraDescription: z.string().trim().max(255).nullable().optional(),
    quantity: z.number().int().positive().max(1_000_000),
    unitPricePaise: z.number().int().positive(),
    customizationCostPaise: z.number().int().nonnegative().default(0),
    customizations: z.array(z.record(z.string(), z.unknown())).default([]),
    commissionAmountPaise: z.number().int().nonnegative().default(0),
    commissionHsnCode: z.string().trim().max(16).nullable().optional(),
    commissionGstPercent: z.number().min(0).max(100).optional(),
    gstPercent: z.number().min(0).max(100).default(0),
    advancePercent: z.number().min(0).max(100).default(30),
    validUntil: z.string().date().nullable().optional(),
    comments: z.string().trim().max(1000).nullable().optional(),
});

export const corporateCatalogListInputSchema = z.object({
    search: z.string().trim().optional(),
    brandId: z.string().uuid().optional(),
    categoryId: z.string().uuid().optional(),
    customizationAvailable: z.boolean().optional(),
    page: z.number().int().positive().default(1),
    limit: z.number().int().positive().max(50).default(12),
});

export const corporateRfqInputSchema = z
    .object({
        profileId: z.string().uuid().nullable().optional(),
        companyName: z.string().min(2),
        contactPerson: z.string().min(2),
        email: z.string().email(),
        phone: z.string().min(8).max(20),
        useCase: z.string().min(2),
        quantity: z.number().int().positive(),
        budgetPerUnitPaise: z
            .number()
            .int()
            .nonnegative()
            .nullable()
            .optional(),
        deliveryDate: z.string().date(),
        sustainabilityRequired: z.boolean().default(false),
        brandingRequired: z.boolean().default(true),
        requirementDescription: z.string().min(10),
        procurementMode: z
            .enum(["self_service", "rfq", "enterprise_po"])
            .default("rfq"),
        attachments: z.array(corporatePlatformFileSchema).max(6).default([]),
    })
    .superRefine((value, ctx) => {
        const totalSize = value.attachments.reduce(
            (sum, file) => sum + file.size,
            0
        );
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
    customizations: z.array(z.record(z.string(), z.unknown())).default([]),
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
    customizations: z.array(z.record(z.string(), z.unknown())).default([]),
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
    orderSetup: z
        .object({
            companyName: z.string().trim().min(2).max(160),
            contactPersonName: z.string().trim().min(2).max(160),
            emailAddress: z.string().trim().email().max(254),
            mobileNumber: z.string().trim().min(8).max(20),
            gstNumber: corporatePlatformGstinValidation,
            deliveryCountry: z.string().trim().min(2).max(100),
            deliveryCity: z.string().trim().min(2).max(120),
            deliveryPincode: z.string().trim().min(3).max(20),
            deliveryAddress: z.string().trim().min(5).max(1000),
            brandingNotes: z.string().trim().max(1000).nullable().optional(),
            productTypeId: z.string().uuid().nullable().optional(),
            gsmOptionId: z.string().uuid().nullable().optional(),
            fabricCompositionId: z.string().uuid().nullable().optional(),
            colorOptionIds: z.array(z.string().uuid()).max(20).default([]),
            customColorRequest: z
                .string()
                .trim()
                .max(200)
                .nullable()
                .optional(),
            logoLocationIds: z.array(z.string().uuid()).max(20).default([]),
            printMethodId: z.string().uuid().nullable().optional(),
            extraChargeRuleIds: z.array(z.string().uuid()).max(20).default([]),
            sizeBreakdown: z
                .record(z.string(), z.number().int().nonnegative())
                .default({}),
            artworkFile: corporatePlatformFileSchema.nullable().optional(),
            employeeSheetFile: corporatePlatformFileSchema
                .nullable()
                .optional(),
        })
        .optional(),
});

export const corporateAdminPurchaseOrderInputSchema = z.object({
    quoteId: z.string().uuid(),
    poNumber: z.string().trim().min(1).max(120),
    poValuePaise: z.number().int().positive(),
    poDate: z.string().date().nullable().optional(),
    deliveryDate: z.string().date(),
    uploadedFile: corporatePlatformFileSchema,
    reviewNotes: z.string().trim().max(1000).nullable().optional(),
});

export const corporateAdminQuoteDecisionInputSchema = z.object({
    quoteId: z.string().uuid(),
    notes: z.string().trim().max(1000).nullable().optional(),
});

export const corporateAdminPaymentRequestInputSchema = z.object({
    orderId: z.string().uuid(),
    amountPaise: z.number().int().positive(),
    paymentType: z.enum(["advance", "balance", "full", "partial"]),
    expiresInDays: z.number().int().min(1).max(90).default(7),
    notes: z.string().trim().max(1000).nullable().optional(),
    sendEmail: z.boolean().default(true),
});

export const corporateAdminOfflinePaymentInputSchema = z.object({
    orderId: z.string().uuid(),
    paymentRequestId: z.string().uuid().nullable().optional(),
    amountPaise: z.number().int().positive(),
    paymentType: z.enum(["advance", "balance", "full", "partial"]),
    paymentMode: z.enum([
        "upi",
        "card",
        "net_banking",
        "manual",
        "neft",
        "rtgs",
        "bank_transfer",
    ]),
    paymentReference: z.string().trim().min(2).max(200),
    paymentDate: z.string().date(),
    proofFile: corporatePlatformFileSchema.nullable().optional(),
    notes: z.string().trim().max(1000).nullable().optional(),
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
        .enum([
            "draft",
            "ready",
            "dispatched",
            "in_transit",
            "delivered",
            "failed",
        ])
        .default("draft"),
    provider: z.string().trim().max(80).default("manual"),
});

export const corporateConsigneeAddressInputSchema = z.object({
    contactPersonName: z
        .string()
        .trim()
        .min(2, "Contact person name is required")
        .max(200),
    mobileNumber: z
        .string()
        .trim()
        .min(10, "Valid mobile number is required")
        .max(15),
    deliveryAddress: z
        .string()
        .trim()
        .min(5, "Delivery address is required")
        .max(1000),
    deliveryCity: z.string().trim().min(2, "City is required").max(100),
    deliveryState: z.string().trim().max(100).nullable().optional(),
    deliveryPincode: z
        .string()
        .trim()
        .regex(/^\d{6}$/, "Must be a valid 6-digit Indian PIN code")
        .refine((pin) => pin !== "000000", "PIN code cannot be 000000"),
    deliveryCountry: z.string().trim().min(2).max(100).default("India"),
});

export const corporateUpdateConsigneeAddressInputSchema = z.object({
    orderId: z.string().uuid(),
    contactPersonName: z
        .string()
        .trim()
        .min(2, "Contact person name is required")
        .max(200),
    mobileNumber: z
        .string()
        .trim()
        .min(10, "Valid mobile number is required")
        .max(15),
    deliveryAddress: z
        .string()
        .trim()
        .min(5, "Delivery address is required")
        .max(1000),
    deliveryCity: z.string().trim().min(2, "City is required").max(100),
    deliveryState: z.string().trim().max(100).nullable().optional(),
    deliveryPincode: z
        .string()
        .trim()
        .regex(/^\d{6}$/, "Must be a valid 6-digit Indian PIN code")
        .refine((pin) => pin !== "000000", "PIN code cannot be 000000"),
    deliveryCountry: z.string().trim().min(2).max(100).default("India"),
});

export const corporateForwardOrderInputSchema = z
    .object({
        orderId: z.string().uuid(),
        packageSource: z.enum(["preset", "custom"]),
        selectedPackingTypeId: z.string().uuid().nullable().optional(),
        lengthCm: z.number().int().positive(),
        widthCm: z.number().int().positive(),
        heightCm: z.number().int().positive(),
        weightGrams: z.number().int().positive(),
        consignee: corporateConsigneeAddressInputSchema.optional(),
    })
    .superRefine((value, ctx) => {
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

export const corporateReplacementReasonSchema = z.enum([
    "size_issue",
    "damaged_item",
    "print_issue",
    "stitching_issue",
    "wrong_item_received",
    "quantity_shortage",
    "other",
]);

export const corporateReplacementRequestStatusSchema = z.enum([
    "requested",
    "approved",
    "rejected",
]);

export const corporateReplacementRequestInputSchema = z.object({
    orderId: z.string().uuid(),
    requestedQuantity: z.number().int().positive(),
    reasonCode: corporateReplacementReasonSchema,
    reasonDetails: z.string().trim().max(1000).nullable().optional(),
    photos: z.array(corporatePlatformFileSchema).min(1).max(6),
});

export const corporateReplacementReviewInputSchema = z.object({
    requestId: z.string().uuid(),
    decision: z.enum(["approved", "rejected"]),
    adminNote: z.string().trim().max(1000).nullable().optional(),
});

export const corporateQcSubmissionInputSchema = z.object({
    orderId: z.string().uuid(),
    remarks: z.string().trim().max(1000).nullable().optional(),
    sampleCoveragePercent: z
        .number()
        .int()
        .min(0)
        .max(100)
        .nullable()
        .optional(),
    images: z.array(corporatePlatformFileSchema).min(1).max(10),
});

export const corporateQcReviewInputSchema = z.object({
    submissionId: z.string().uuid(),
    decision: z.enum(["approved", "rejected"]),
    reviewNotes: z.string().trim().max(1000).nullable().optional(),
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

export const corporateOrderProformaInvoiceInputSchema = z.object({
    orderId: z.string().uuid(),
});

export const corporateTaxInvoiceInputSchema = z.object({
    orderId: z.string().uuid(),
});

const gstinSchema = z
    .string()
    .trim()
    .regex(
        /^\d{2}[A-Z]{5}\d{4}[A-Z][1-9A-Z]Z[0-9A-Z]$/,
        "Enter a valid 15-character GSTIN"
    );

export const corporateVendorPurchaseOrderInputSchema = z.object({
    orderId: z.string().uuid(),
    unitBuyPricePaise: z.number().int().positive(),
    gstRateBps: z.number().int().min(0).max(2800),
    expectedDeliveryDate: z.string().date().nullable().optional(),
    deliveryMode: z.enum(["renivet_warehouse", "direct_to_customer"]),
    paymentTerms: z.string().trim().min(3).max(500),
    deliveryInstructions: z.string().trim().max(1000).nullable().optional(),
    customizations: z.array(z.record(z.string(), z.unknown())).default([]),
});

export const corporateBrandTaxInvoiceInputSchema = z.object({
    orderId: z.string().uuid(),
    vendorPurchaseOrderId: z.string().uuid().nullable().optional(),
    invoiceNumber: z.string().trim().min(1).max(100),
    invoiceDate: z.string().date(),
    supplierGstin: gstinSchema,
    recipientGstin: gstinSchema,
    hsnCode: z.string().trim().min(4).max(8),
    taxableValuePaise: z.number().int().nonnegative(),
    cgstPaise: z.number().int().nonnegative().default(0),
    sgstPaise: z.number().int().nonnegative().default(0),
    igstPaise: z.number().int().nonnegative().default(0),
    totalAmountPaise: z.number().int().positive(),
    file: corporatePlatformFileSchema,
});

export const corporateBrandInvoiceUploadInputSchema = z.object({
    orderId: z.string().uuid(),
    vendorPurchaseOrderId: z.string().uuid(),
    invoiceDate: z.string().date(),
    file: corporatePlatformFileSchema,
});

export const corporateBrandTaxInvoiceReviewInputSchema = z.object({
    invoiceId: z.string().uuid(),
    validationStatus: z.enum(["validated", "rejected"]),
    gstr2bStatus: z.enum(["pending", "matched", "mismatch"]),
    reviewNotes: z.string().trim().max(1000).nullable().optional(),
});

export const corporateDeliveryChallanInputSchema = z.object({
    orderId: z.string().uuid(),
    vendorPurchaseOrderId: z.string().uuid().nullable().optional(),
    eWayBillNumber: z.string().trim().max(50).nullable().optional(),
});

export const corporateDocumentSettingsInputSchema = z.object({
    legalName: z.string().trim().min(2),
    tradeName: z.string().trim().min(2),
    gstin: gstinSchema.nullable().optional(),
    cin: z.string().trim().max(30).nullable().optional(),
    addressLine1: z.string().trim().max(300).nullable().optional(),
    addressLine2: z.string().trim().max(300).nullable().optional(),
    city: z.string().trim().max(100).nullable().optional(),
    state: z.string().trim().max(100).nullable().optional(),
    postalCode: z.string().trim().max(12).nullable().optional(),
    country: z.string().trim().min(2).max(100),
    email: z.string().email().nullable().optional(),
    phone: z.string().trim().max(30).nullable().optional(),
    bankName: z.string().trim().max(100).nullable().optional(),
    bankAccountName: z.string().trim().min(2).max(150),
    bankAccountNumber: z.string().trim().max(50).nullable().optional(),
    bankAccountType: z.string().trim().max(50).nullable().optional(),
    bankIfscCode: z.string().trim().max(20).nullable().optional(),
    bankBranch: z.string().trim().max(150).nullable().optional(),
    authorizedSignatoryName: z.string().trim().min(2).max(150),
    defaultPaymentTerms: z.string().trim().min(3).max(1000),
    proformaValidityDays: z.number().int().min(1).max(90),
    balanceDueDays: z.number().int().min(0).max(180),
    isActive: z.boolean().default(true),
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
export type CorporateReplacementReason = z.infer<
    typeof corporateReplacementReasonSchema
>;
