import { relations } from "drizzle-orm";
import {
    boolean,
    date,
    index,
    integer,
    jsonb,
    pgTable,
    text,
    timestamp,
    uniqueIndex,
    uuid,
} from "drizzle-orm/pg-core";
import { timestamps } from "../helper";
import { brands } from "./brand";
import {
    corporateFabricCompositions,
    corporateGsmOptions,
    corporateOrders,
    corporateProductTypes,
} from "./corporate-order";
import { hsnMaster } from "./finance-compliance";
import { products } from "./product";
import { users } from "./user";

const workflowStatuses = [
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
] as const;

const paymentStatuses = [
    "payment_pending",
    "payment_initiated",
    "payment_success",
    "payment_failed",
    "payment_refunded",
    "payment_partial",
] as const;

export const corporateDocumentSettings = pgTable(
    "corporate_document_settings",
    {
        id: uuid("id").primaryKey().notNull().defaultRandom(),
        legalName: text("legal_name").notNull().default("Renivet"),
        tradeName: text("trade_name").notNull().default("Renivet"),
        gstin: text("gstin"),
        cin: text("cin"),
        addressLine1: text("address_line_1"),
        addressLine2: text("address_line_2"),
        city: text("city"),
        state: text("state"),
        postalCode: text("postal_code"),
        country: text("country").notNull().default("India"),
        email: text("email"),
        phone: text("phone"),
        bankName: text("bank_name").default("IDFC First Bank"),
        bankAccountName: text("bank_account_name")
            .notNull()
            .default("Renivet Solutions Pvt Ltd"),
        bankAccountNumber: text("bank_account_number"),
        bankAccountType: text("bank_account_type").default("Business"),
        bankIfscCode: text("bank_ifsc_code"),
        bankBranch: text("bank_branch"),
        authorizedSignatoryName: text("authorized_signatory_name")
            .notNull()
            .default("Renivet"),
        defaultPaymentTerms: text("default_payment_terms")
            .notNull()
            .default(
                "30% advance on PO confirmation; balance within 15 days of dispatch."
            ),
        proformaValidityDays: integer("proforma_validity_days")
            .notNull()
            .default(14),
        balanceDueDays: integer("balance_due_days").notNull().default(15),
        isActive: boolean("is_active").notNull().default(true),
        ...timestamps,
    },
    (table) => ({
        activeIdx: index("corporate_document_settings_active_idx").on(
            table.isActive
        ),
    })
);

export const corporateDocumentSequences = pgTable(
    "corporate_document_sequences",
    {
        id: uuid("id").primaryKey().notNull().defaultRandom(),
        documentPrefix: text("document_prefix").notNull(),
        financialYear: text("financial_year").notNull(),
        lastSequence: integer("last_sequence").notNull().default(0),
        ...timestamps,
    },
    (table) => ({
        prefixFinancialYearUnique: uniqueIndex(
            "corporate_document_sequences_prefix_fy_idx"
        ).on(table.documentPrefix, table.financialYear),
    })
);

export const corporateProfiles = pgTable(
    "corporate_profiles",
    {
        id: uuid("id").primaryKey().notNull().defaultRandom(),
        userId: text("user_id").references(() => users.id, {
            onDelete: "cascade",
        }),
        companyName: text("company_name").notNull(),
        gstNumber: text("gst_number"),
        website: text("website"),
        companySize: text("company_size"),
        industry: text("industry"),
        contactPerson: text("contact_person").notNull(),
        email: text("email").notNull(),
        phone: text("phone").notNull(),
        billingAddress: jsonb("billing_address")
            .$type<Record<string, unknown>>()
            .default({})
            .notNull(),
        shippingAddress: jsonb("shipping_address")
            .$type<Record<string, unknown>>()
            .default({})
            .notNull(),
        isDefault: boolean("is_default").notNull().default(true),
        ...timestamps,
    },
    (table) => ({
        userIdx: index("corporate_profiles_user_idx").on(table.userId),
        emailIdx: index("corporate_profiles_email_idx").on(table.email),
    })
);

export const corporateProductConfigs = pgTable(
    "corporate_product_configs",
    {
        id: uuid("id").primaryKey().notNull().defaultRandom(),
        productId: uuid("product_id")
            .notNull()
            .references(() => products.id, { onDelete: "cascade" }),
        brandId: uuid("brand_id")
            .notNull()
            .references(() => brands.id, { onDelete: "cascade" }),
        isActive: boolean("is_active").notNull().default(true),
        corporateTitle: text("corporate_title").notNull(),
        corporateDescription: text("corporate_description"),
        moq: integer("moq").notNull().default(1),
        maxCapacityPerOrder: integer("max_capacity_per_order"),
        monthlyCapacity: integer("monthly_capacity"),
        leadTimeDays: integer("lead_time_days").notNull().default(10),
        unitOfMeasurement: text("unit_of_measurement", {
            enum: ["Pc", "Set", "Pair", "Box", "Kg", "Mtr", "L"],
        })
            .notNull()
            .default("Pc"),
        weightGramsPerUnit: integer("weight_grams_per_unit"),
        hsnOverrideId: uuid("hsn_override_id").references(() => hsnMaster.id, {
            onDelete: "set null",
        }),
        sampleAvailable: boolean("sample_available").notNull().default(false),
        maxPrintAreaSqCm: integer("max_print_area_sq_cm"),
        certifications: jsonb("certifications")
            .$type<string[]>()
            .default([])
            .notNull(),
        availableSizes: jsonb("available_sizes")
            .$type<string[]>()
            .default([])
            .notNull(),
        availableColors: jsonb("available_colors")
            .$type<Array<{ name: string; hex?: string | null }>>()
            .default([])
            .notNull(),
        customizationOptions: jsonb("customization_options")
            .$type<Record<string, boolean>>()
            .default({})
            .notNull(),
        customizationCharges: jsonb("customization_charges")
            .$type<Record<string, number>>()
            .default({})
            .notNull(),
        priceRangeMinPaise: integer("price_range_min_paise")
            .notNull()
            .default(0),
        priceRangeMaxPaise: integer("price_range_max_paise"),
        sustainabilityNotes: text("sustainability_notes"),
        displayOrder: integer("display_order").notNull().default(0),
        ...timestamps,
    },
    (table) => ({
        productIdx: index("corporate_product_configs_product_idx").on(
            table.productId
        ),
        brandIdx: index("corporate_product_configs_brand_idx").on(
            table.brandId
        ),
    })
);

export const corporateRfqs = pgTable(
    "corporate_rfqs",
    {
        id: uuid("id").primaryKey().notNull().defaultRandom(),
        rfqNumber: text("rfq_number").notNull(),
        corporateProfileId: uuid("corporate_profile_id").references(
            () => corporateProfiles.id,
            { onDelete: "set null" }
        ),
        userId: text("user_id")
            .notNull()
            .references(() => users.id, { onDelete: "cascade" }),
        companyName: text("company_name").notNull(),
        contactPerson: text("contact_person").notNull(),
        email: text("email").notNull(),
        phone: text("phone").notNull(),
        useCase: text("use_case").notNull(),
        quantity: integer("quantity").notNull(),
        budgetPerUnitPaise: integer("budget_per_unit_paise"),
        deliveryDate: date("delivery_date"),
        sustainabilityRequired: boolean("sustainability_required")
            .notNull()
            .default(false),
        brandingRequired: boolean("branding_required").notNull().default(true),
        requirementDescription: text("requirement_description").notNull(),
        status: text("status", {
            enum: [
                "rfq_submitted",
                "under_review",
                "brand_matching",
                "quote_preparation",
                "quote_sent",
                "customer_review",
                "quote_accepted",
                "quote_rejected",
                "closed",
            ],
        })
            .notNull()
            .default("rfq_submitted"),
        assignedAdminUserId: text("assigned_admin_user_id").references(
            () => users.id,
            { onDelete: "set null" }
        ),
        procurementMode: text("procurement_mode", {
            enum: ["self_service", "rfq", "enterprise_po"],
        })
            .notNull()
            .default("rfq"),
        ...timestamps,
    },
    (table) => ({
        numberIdx: index("corporate_rfqs_number_idx").on(table.rfqNumber),
        userIdx: index("corporate_rfqs_user_idx").on(table.userId),
        statusIdx: index("corporate_rfqs_status_idx").on(table.status),
    })
);

export const corporateRfqDocuments = pgTable(
    "corporate_rfq_documents",
    {
        id: uuid("id").primaryKey().notNull().defaultRandom(),
        rfqId: uuid("rfq_id")
            .notNull()
            .references(() => corporateRfqs.id, { onDelete: "cascade" }),
        fileName: text("file_name").notNull(),
        fileUrl: text("file_url").notNull(),
        fileType: text("file_type").notNull(),
        fileSizeBytes: integer("file_size_bytes"),
        uploadedByUserId: text("uploaded_by_user_id").references(
            () => users.id,
            {
                onDelete: "set null",
            }
        ),
        ...timestamps,
    },
    (table) => ({
        rfqIdx: index("corporate_rfq_documents_rfq_idx").on(table.rfqId),
    })
);

export const corporateRfqAssignments = pgTable(
    "corporate_rfq_assignments",
    {
        id: uuid("id").primaryKey().notNull().defaultRandom(),
        rfqId: uuid("rfq_id")
            .notNull()
            .references(() => corporateRfqs.id, { onDelete: "cascade" }),
        assignedToUserId: text("assigned_to_user_id")
            .notNull()
            .references(() => users.id, { onDelete: "cascade" }),
        assignedByUserId: text("assigned_by_user_id").references(
            () => users.id,
            {
                onDelete: "set null",
            }
        ),
        ...timestamps,
    },
    (table) => ({
        rfqIdx: index("corporate_rfq_assignments_rfq_idx").on(table.rfqId),
    })
);

export const corporateRfqBrandMatches = pgTable(
    "corporate_rfq_brand_matches",
    {
        id: uuid("id").primaryKey().notNull().defaultRandom(),
        rfqId: uuid("rfq_id")
            .notNull()
            .references(() => corporateRfqs.id, { onDelete: "cascade" }),
        brandId: uuid("brand_id")
            .notNull()
            .references(() => brands.id, { onDelete: "cascade" }),
        confidenceScoreBps: integer("confidence_score_bps")
            .notNull()
            .default(0),
        recommendationNotes: text("recommendation_notes"),
        ...timestamps,
    },
    (table) => ({
        rfqIdx: index("corporate_rfq_brand_matches_rfq_idx").on(table.rfqId),
    })
);

export const corporateQuotes = pgTable(
    "corporate_quotes",
    {
        id: uuid("id").primaryKey().notNull().defaultRandom(),
        quoteNumber: text("quote_number").notNull(),
        rfqId: uuid("rfq_id").references(() => corporateRfqs.id, {
            onDelete: "set null",
        }),
        corporateProfileId: uuid("corporate_profile_id")
            .notNull()
            .references(() => corporateProfiles.id, { onDelete: "cascade" }),
        brandId: uuid("brand_id")
            .notNull()
            .references(() => brands.id, { onDelete: "cascade" }),
        productId: uuid("product_id").references(() => products.id, {
            onDelete: "set null",
        }),
        corporateProductConfigId: uuid(
            "corporate_product_config_id"
        ).references(() => corporateProductConfigs.id, {
            onDelete: "set null",
        }),
        productTypeId: uuid("product_type_id").references(
            () => corporateProductTypes.id,
            { onDelete: "set null" }
        ),
        gsmOptionId: uuid("gsm_option_id").references(
            () => corporateGsmOptions.id,
            { onDelete: "set null" }
        ),
        fabricCompositionId: uuid("fabric_composition_id").references(
            () => corporateFabricCompositions.id,
            { onDelete: "set null" }
        ),
        hsnCode: text("hsn_code"),
        extraChargeRuleIds: jsonb("extra_charge_rule_ids")
            .$type<string[]>()
            .default([]),
        manualExtraAmountPaise: integer("manual_extra_amount_paise")
            .notNull()
            .default(0),
        manualExtraDescription: text("manual_extra_description"),
        quantity: integer("quantity").notNull(),
        subtotalPaise: integer("subtotal_paise").notNull(),
        customizationCostPaise: integer("customization_cost_paise")
            .notNull()
            .default(0),
        gstAmountPaise: integer("gst_amount_paise").notNull().default(0),
        totalAmountPaise: integer("total_amount_paise").notNull(),
        advanceAmountPaise: integer("advance_amount_paise")
            .notNull()
            .default(0),
        balanceAmountPaise: integer("balance_amount_paise")
            .notNull()
            .default(0),
        commissionAmountPaise: integer("commission_amount_paise")
            .notNull()
            .default(0),
        commissionGstRateBps: integer("commission_gst_rate_bps")
            .notNull()
            .default(1800),
        commissionGstAmountPaise: integer("commission_gst_amount_paise")
            .notNull()
            .default(0),
        commissionTotalPaise: integer("commission_total_paise")
            .notNull()
            .default(0),
        validUntil: date("valid_until"),
        status: text("status", {
            enum: [
                "draft",
                "sent",
                "customer_review",
                "revision_requested",
                "approved",
                "rejected",
                "expired",
            ],
        })
            .notNull()
            .default("draft"),
        customerDecisionNotes: text("customer_decision_notes"),
        ...timestamps,
    },
    (table) => ({
        quoteNumberIdx: index("corporate_quotes_number_idx").on(
            table.quoteNumber
        ),
        profileIdx: index("corporate_quotes_profile_idx").on(
            table.corporateProfileId
        ),
        statusIdx: index("corporate_quotes_status_idx").on(table.status),
    })
);

export const corporateQuoteRevisions = pgTable(
    "corporate_quote_revisions",
    {
        id: uuid("id").primaryKey().notNull().defaultRandom(),
        quoteId: uuid("quote_id")
            .notNull()
            .references(() => corporateQuotes.id, { onDelete: "cascade" }),
        revisionNumber: integer("revision_number").notNull(),
        subtotalPaise: integer("subtotal_paise").notNull(),
        customizationCostPaise: integer("customization_cost_paise")
            .notNull()
            .default(0),
        gstAmountPaise: integer("gst_amount_paise").notNull().default(0),
        totalAmountPaise: integer("total_amount_paise").notNull(),
        comments: text("comments"),
        createdByUserId: text("created_by_user_id").references(() => users.id, {
            onDelete: "set null",
        }),
        ...timestamps,
    },
    (table) => ({
        quoteIdx: index("corporate_quote_revisions_quote_idx").on(
            table.quoteId
        ),
    })
);

export const corporateDocuments = pgTable(
    "corporate_documents",
    {
        id: uuid("id").primaryKey().notNull().defaultRandom(),
        entityType: text("entity_type").notNull(),
        entityId: uuid("entity_id").notNull(),
        documentType: text("document_type").notNull(),
        fileName: text("file_name").notNull(),
        fileUrl: text("file_url").notNull(),
        fileSizeBytes: integer("file_size_bytes"),
        mimeType: text("mime_type"),
        version: integer("version").notNull().default(1),
        uploadedByUserId: text("uploaded_by_user_id").references(
            () => users.id,
            {
                onDelete: "set null",
            }
        ),
        ...timestamps,
    },
    (table) => ({
        entityIdx: index("corporate_documents_entity_idx").on(
            table.entityType,
            table.entityId
        ),
    })
);

export const corporateCustomizations = pgTable(
    "corporate_customizations",
    {
        id: uuid("id").primaryKey().notNull().defaultRandom(),
        quoteId: uuid("quote_id").references(() => corporateQuotes.id, {
            onDelete: "cascade",
        }),
        orderId: uuid("order_id").references(() => corporateOrders.id, {
            onDelete: "cascade",
        }),
        customizationType: text("customization_type").notNull(),
        costPaise: integer("cost_paise").notNull().default(0),
        status: text("status", {
            enum: ["pending", "approved", "rejected", "completed"],
        })
            .notNull()
            .default("pending"),
        metadata: jsonb("metadata")
            .$type<Record<string, unknown>>()
            .default({})
            .notNull(),
        ...timestamps,
    },
    (table) => ({
        quoteIdx: index("corporate_customizations_quote_idx").on(table.quoteId),
        orderIdx: index("corporate_customizations_order_idx").on(table.orderId),
    })
);

export const corporateSizeBreakdowns = pgTable(
    "corporate_size_breakdowns",
    {
        id: uuid("id").primaryKey().notNull().defaultRandom(),
        orderId: uuid("order_id")
            .notNull()
            .references(() => corporateOrders.id, { onDelete: "cascade" }),
        sizeName: text("size_name").notNull(),
        quantity: integer("quantity").notNull(),
        ...timestamps,
    },
    (table) => ({
        orderIdx: index("corporate_size_breakdowns_order_idx").on(
            table.orderId
        ),
    })
);

export const corporatePaymentTerms = pgTable("corporate_payment_terms", {
    id: uuid("id").primaryKey().notNull().defaultRandom(),
    orderId: uuid("order_id").references(() => corporateOrders.id, {
        onDelete: "cascade",
    }),
    quoteId: uuid("quote_id").references(() => corporateQuotes.id, {
        onDelete: "cascade",
    }),
    paymentTerm: text("payment_term", {
        enum: ["immediate", "net_7", "net_15", "net_30", "custom"],
    })
        .notNull()
        .default("immediate"),
    advancePercentageBps: integer("advance_percentage_bps")
        .notNull()
        .default(0),
    balanceDueDays: integer("balance_due_days"),
    approvedByUserId: text("approved_by_user_id").references(() => users.id, {
        onDelete: "set null",
    }),
    customTermsText: text("custom_terms_text"),
    ...timestamps,
});

export const corporatePaymentRequests = pgTable(
    "corporate_payment_requests",
    {
        id: uuid("id").primaryKey().notNull().defaultRandom(),
        orderId: uuid("order_id")
            .notNull()
            .references(() => corporateOrders.id, { onDelete: "cascade" }),
        recipientEmail: text("recipient_email").notNull(),
        tokenHash: text("token_hash").notNull(),
        amountPaise: integer("amount_paise").notNull(),
        paymentType: text("payment_type", {
            enum: ["advance", "balance", "full", "partial"],
        }).notNull(),
        status: text("status", {
            enum: ["pending", "initiated", "paid", "expired", "cancelled"],
        })
            .notNull()
            .default("pending"),
        razorpayOrderId: text("razorpay_order_id"),
        razorpayPaymentId: text("razorpay_payment_id"),
        paymentReference: text("payment_reference"),
        paymentMode: text("payment_mode"),
        proofFileUrl: text("proof_file_url"),
        notes: text("notes"),
        expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
        sentAt: timestamp("sent_at", { withTimezone: true }),
        paidAt: timestamp("paid_at", { withTimezone: true }),
        createdByUserId: text("created_by_user_id").references(() => users.id, {
            onDelete: "set null",
        }),
        ...timestamps,
    },
    (table) => ({
        orderIdx: index("corporate_payment_requests_order_idx").on(
            table.orderId
        ),
        recipientIdx: index("corporate_payment_requests_recipient_idx").on(
            table.recipientEmail
        ),
        statusIdx: index("corporate_payment_requests_status_idx").on(
            table.status
        ),
        razorpayPaymentUnique: uniqueIndex(
            "corporate_payment_requests_razorpay_payment_unique"
        ).on(table.razorpayPaymentId),
        tokenUnique: uniqueIndex("corporate_payment_requests_token_unique").on(
            table.tokenHash
        ),
    })
);

export const corporatePurchaseOrders = pgTable(
    "corporate_purchase_orders",
    {
        id: uuid("id").primaryKey().notNull().defaultRandom(),
        poNumber: text("po_number").notNull(),
        corporateOrderId: uuid("corporate_order_id").references(
            () => corporateOrders.id,
            { onDelete: "set null" }
        ),
        quoteId: uuid("quote_id").references(() => corporateQuotes.id, {
            onDelete: "set null",
        }),
        corporateProfileId: uuid("corporate_profile_id").references(
            () => corporateProfiles.id,
            { onDelete: "set null" }
        ),
        companyName: text("company_name"),
        poValuePaise: integer("po_value_paise").notNull(),
        poDate: date("po_date"),
        deliveryDate: date("delivery_date"),
        productScopeSummary: text("product_scope_summary"),
        authorizedSignatoryName: text("authorized_signatory_name"),
        authorizedSignatoryConfirmed: boolean("authorized_signatory_confirmed")
            .notNull()
            .default(false),
        uploadedFileUrl: text("uploaded_file_url"),
        validationIssues: jsonb("validation_issues")
            .$type<string[]>()
            .default([])
            .notNull(),
        status: text("status", {
            enum: [
                "po_uploaded",
                "po_review",
                "po_accepted",
                "po_rejected",
                "po_requires_changes",
            ],
        })
            .notNull()
            .default("po_uploaded"),
        approvedByUserId: text("approved_by_user_id").references(
            () => users.id,
            {
                onDelete: "set null",
            }
        ),
        approvedAt: date("approved_at"),
        reviewNotes: text("review_notes"),
        ...timestamps,
    },
    (table) => ({
        poNumberIdx: index("corporate_purchase_orders_number_idx").on(
            table.poNumber
        ),
    })
);

export const corporateQcSubmissions = pgTable(
    "corporate_qc_submissions",
    {
        id: uuid("id").primaryKey().notNull().defaultRandom(),
        orderId: uuid("order_id")
            .notNull()
            .references(() => corporateOrders.id, { onDelete: "cascade" }),
        submittedByUserId: text("submitted_by_user_id").references(
            () => users.id,
            {
                onDelete: "set null",
            }
        ),
        status: text("status", {
            enum: ["pending", "submitted", "approved", "rejected"],
        })
            .notNull()
            .default("pending"),
        remarks: text("remarks"),
        sampleCoveragePercent: integer("sample_coverage_percent"),
        submittedAt: date("submitted_at"),
        reviewedByUserId: text("reviewed_by_user_id").references(
            () => users.id,
            {
                onDelete: "set null",
            }
        ),
        reviewedAt: timestamp("reviewed_at"),
        reviewNotes: text("review_notes"),
        ...timestamps,
    },
    (table) => ({
        orderIdx: index("corporate_qc_submissions_order_idx").on(table.orderId),
    })
);

export const corporateQcImages = pgTable(
    "corporate_qc_images",
    {
        id: uuid("id").primaryKey().notNull().defaultRandom(),
        qcSubmissionId: uuid("qc_submission_id")
            .notNull()
            .references(() => corporateQcSubmissions.id, {
                onDelete: "cascade",
            }),
        imageUrl: text("image_url").notNull(),
        imageType: text("image_type").notNull(),
        ...timestamps,
    },
    (table) => ({
        qcIdx: index("corporate_qc_images_qc_idx").on(table.qcSubmissionId),
    })
);

export const corporateShipments = pgTable(
    "corporate_shipments",
    {
        id: uuid("id").primaryKey().notNull().defaultRandom(),
        orderId: uuid("order_id")
            .notNull()
            .references(() => corporateOrders.id, { onDelete: "cascade" }),
        courierName: text("courier_name"),
        trackingNumber: text("tracking_number"),
        awbNumber: text("awb_number"),
        trackingUrl: text("tracking_url"),
        dispatchDate: date("dispatch_date"),
        deliveryDate: date("delivery_date"),
        status: text("status", {
            enum: [
                "draft",
                "ready",
                "dispatched",
                "in_transit",
                "delivered",
                "failed",
            ],
        })
            .notNull()
            .default("draft"),
        actualQuantityDelivered: integer("actual_quantity_delivered"),
        provider: text("provider").notNull().default("manual"),
        rawPayload: jsonb("raw_payload")
            .$type<Record<string, unknown>>()
            .default({})
            .notNull(),
        ...timestamps,
    },
    (table) => ({
        orderIdx: index("corporate_shipments_order_idx").on(table.orderId),
        trackingIdx: index("corporate_shipments_tracking_idx").on(
            table.trackingNumber
        ),
    })
);

export const corporatePayments = pgTable(
    "corporate_payments",
    {
        id: uuid("id").primaryKey().notNull().defaultRandom(),
        orderId: uuid("order_id").references(() => corporateOrders.id, {
            onDelete: "cascade",
        }),
        quoteId: uuid("quote_id").references(() => corporateQuotes.id, {
            onDelete: "cascade",
        }),
        paymentType: text("payment_type", {
            enum: ["advance", "balance", "manual", "refund", "partial"],
        })
            .notNull()
            .default("advance"),
        paymentMode: text("payment_mode", {
            enum: [
                "razorpay",
                "upi",
                "card",
                "net_banking",
                "manual",
                "neft",
                "rtgs",
                "bank_transfer",
            ],
        })
            .notNull()
            .default("razorpay"),
        amountPaise: integer("amount_paise").notNull(),
        paymentReference: text("payment_reference"),
        paymentStatus: text("payment_status", {
            enum: paymentStatuses,
        })
            .notNull()
            .default("payment_pending"),
        paymentDate: date("payment_date"),
        metadata: jsonb("metadata")
            .$type<Record<string, unknown>>()
            .default({})
            .notNull(),
        ...timestamps,
    },
    (table) => ({
        orderIdx: index("corporate_payments_order_idx").on(table.orderId),
        statusIdx: index("corporate_payments_status_idx").on(
            table.paymentStatus
        ),
    })
);

export const corporateProformaInvoices = pgTable(
    "corporate_proforma_invoices",
    {
        id: uuid("id").primaryKey().notNull().defaultRandom(),
        invoiceNumber: text("invoice_number").notNull(),
        quoteId: uuid("quote_id").references(() => corporateQuotes.id, {
            onDelete: "cascade",
        }),
        orderId: uuid("order_id").references(() => corporateOrders.id, {
            onDelete: "cascade",
        }),
        customerId: uuid("customer_id").references(() => corporateProfiles.id, {
            onDelete: "set null",
        }),
        invoiceDate: date("invoice_date"),
        subtotalPaise: integer("subtotal_paise").notNull(),
        gstAmountPaise: integer("gst_amount_paise").notNull(),
        totalAmountPaise: integer("total_amount_paise").notNull(),
        validUntil: date("valid_until"),
        paymentTerms: text("payment_terms"),
        deliveryTimeline: text("delivery_timeline"),
        termsAndConditions: text("terms_and_conditions"),
        status: text("status", {
            enum: ["draft", "issued", "cancelled"],
        })
            .notNull()
            .default("draft"),
        ...timestamps,
    },
    (table) => ({
        orderIdx: index("corporate_proforma_invoices_order_id_idx").on(
            table.orderId
        ),
    })
);

export const corporateReceiptVouchers = pgTable(
    "corporate_receipt_vouchers",
    {
        id: uuid("id").primaryKey().notNull().defaultRandom(),
        voucherNumber: text("voucher_number").notNull(),
        orderId: uuid("order_id")
            .notNull()
            .references(() => corporateOrders.id, { onDelete: "cascade" }),
        paymentId: uuid("payment_id").references(() => corporatePayments.id, {
            onDelete: "set null",
        }),
        voucherDate: date("voucher_date").notNull(),
        amountPaise: integer("amount_paise").notNull(),
        paymentMode: text("payment_mode").notNull(),
        paymentReference: text("payment_reference"),
        poReference: text("po_reference"),
        status: text("status", {
            enum: ["issued", "cancelled"],
        })
            .notNull()
            .default("issued"),
        ...timestamps,
    },
    (table) => ({
        voucherNumberUnique: uniqueIndex(
            "corporate_receipt_vouchers_number_idx"
        ).on(table.voucherNumber),
        orderIdx: index("corporate_receipt_vouchers_order_idx").on(
            table.orderId
        ),
        paymentIdx: uniqueIndex("corporate_receipt_vouchers_payment_idx").on(
            table.paymentId
        ),
    })
);

export const corporateFulfillmentOrders = pgTable(
    "corporate_fulfillment_orders",
    {
        id: uuid("id").primaryKey().notNull().defaultRandom(),
        foNumber: text("fo_number").notNull(),
        orderId: uuid("order_id")
            .notNull()
            .references(() => corporateOrders.id, { onDelete: "cascade" }),
        brandId: uuid("brand_id")
            .notNull()
            .references(() => brands.id, { onDelete: "restrict" }),
        issueDate: date("issue_date").notNull(),
        expectedDeliveryDate: date("expected_delivery_date"),
        quantity: integer("quantity").notNull(),
        unitSellPricePaise: integer("unit_sell_price_paise")
            .notNull()
            .default(0),
        totalAmountPaise: integer("total_amount_paise").notNull().default(0),
        deliveryMode: text("delivery_mode", {
            enum: ["renivet_warehouse", "direct_to_customer"],
        })
            .notNull()
            .default("direct_to_customer"),
        deliveryAddress: text("delivery_address").notNull(),
        paymentTerms: text("payment_terms").notNull(),
        deliveryInstructions: text("delivery_instructions"),
        customizations: jsonb("customizations")
            .$type<Array<Record<string, unknown>>>()
            .notNull()
            .default([]),
        status: text("status", {
            enum: ["draft", "issued", "accepted", "cancelled"],
        })
            .notNull()
            .default("issued"),
        createdByUserId: text("created_by_user_id").references(() => users.id, {
            onDelete: "set null",
        }),
        ...timestamps,
    },
    (table) => ({
        foNumberUnique: uniqueIndex(
            "corporate_fulfillment_orders_number_idx"
        ).on(table.foNumber),
        orderIdx: index("corporate_fulfillment_orders_order_idx").on(
            table.orderId
        ),
        brandIdx: index("corporate_fulfillment_orders_brand_idx").on(
            table.brandId
        ),
    })
);

export const corporateVendorPurchaseOrders = corporateFulfillmentOrders;

export const corporateBrandTaxInvoices = pgTable(
    "corporate_brand_tax_invoices",
    {
        id: uuid("id").primaryKey().notNull().defaultRandom(),
        orderId: uuid("order_id")
            .notNull()
            .references(() => corporateOrders.id, { onDelete: "cascade" }),
        brandId: uuid("brand_id")
            .notNull()
            .references(() => brands.id, { onDelete: "restrict" }),
        vendorPurchaseOrderId: uuid("vendor_purchase_order_id").references(
            () => corporateFulfillmentOrders.id,
            { onDelete: "set null" }
        ),
        invoiceNumber: text("invoice_number").notNull(),
        invoiceDate: date("invoice_date").notNull(),
        supplierGstin: text("supplier_gstin").notNull(),
        recipientGstin: text("recipient_gstin").notNull(),
        hsnCode: text("hsn_code").notNull(),
        taxableValuePaise: integer("taxable_value_paise").notNull(),
        cgstPaise: integer("cgst_paise").notNull().default(0),
        sgstPaise: integer("sgst_paise").notNull().default(0),
        igstPaise: integer("igst_paise").notNull().default(0),
        totalAmountPaise: integer("total_amount_paise").notNull(),
        fileName: text("file_name").notNull(),
        fileUrl: text("file_url").notNull(),
        validationStatus: text("validation_status", {
            enum: ["pending", "validated", "rejected"],
        })
            .notNull()
            .default("pending"),
        validationIssues: jsonb("validation_issues")
            .$type<string[]>()
            .notNull()
            .default([]),
        gstr2bStatus: text("gstr2b_status", {
            enum: ["pending", "matched", "mismatch"],
        })
            .notNull()
            .default("pending"),
        reviewNotes: text("review_notes"),
        isDeprecated: boolean("is_deprecated").notNull().default(true),
        uploadedByUserId: text("uploaded_by_user_id").references(
            () => users.id,
            {
                onDelete: "set null",
            }
        ),
        ...timestamps,
    },
    (table) => ({
        invoiceUnique: uniqueIndex(
            "corporate_brand_tax_invoices_brand_number_idx"
        ).on(table.brandId, table.invoiceNumber),
        orderIdx: index("corporate_brand_tax_invoices_order_idx").on(
            table.orderId
        ),
        gstr2bIdx: index("corporate_brand_tax_invoices_gstr2b_idx").on(
            table.gstr2bStatus
        ),
    })
);

export const corporateDeliveryChallans = pgTable(
    "corporate_delivery_challans",
    {
        id: uuid("id").primaryKey().notNull().defaultRandom(),
        challanNumber: text("challan_number").notNull(),
        orderId: uuid("order_id")
            .notNull()
            .references(() => corporateOrders.id, { onDelete: "cascade" }),
        vendorPurchaseOrderId: uuid("vendor_purchase_order_id").references(
            () => corporateFulfillmentOrders.id,
            { onDelete: "set null" }
        ),
        challanDate: date("challan_date").notNull(),
        consignorName: text("consignor_name").notNull(),
        consignorAddress: text("consignor_address").notNull(),
        consigneeName: text("consignee_name").notNull(),
        consigneeAddress: text("consignee_address").notNull(),
        onBehalfOf: text("on_behalf_of"),
        reasonForMovement: text("reason_for_movement")
            .notNull()
            .default("Supply of goods"),
        eWayBillNumber: text("e_way_bill_number"),
        status: text("status", {
            enum: ["draft", "issued", "cancelled"],
        })
            .notNull()
            .default("issued"),
        createdByUserId: text("created_by_user_id").references(() => users.id, {
            onDelete: "set null",
        }),
        ...timestamps,
    },
    (table) => ({
        challanNumberUnique: uniqueIndex(
            "corporate_delivery_challans_number_idx"
        ).on(table.challanNumber),
        orderIdx: index("corporate_delivery_challans_order_idx").on(
            table.orderId
        ),
    })
);

export const corporateTaxInvoices = pgTable("corporate_tax_invoices", {
    id: uuid("id").primaryKey().notNull().defaultRandom(),
    invoiceNumber: text("invoice_number").notNull(),
    orderId: uuid("order_id")
        .notNull()
        .references(() => corporateOrders.id, { onDelete: "cascade" }),
    brandId: uuid("brand_id").references(() => brands.id, {
        onDelete: "restrict",
    }),
    buyerGstin: text("buyer_gstin"),
    poReference: text("po_reference"),
    invoiceDate: date("invoice_date"),
    taxableValuePaise: integer("taxable_value_paise").notNull(),
    cgstPaise: integer("cgst_paise").notNull().default(0),
    sgstPaise: integer("sgst_paise").notNull().default(0),
    igstPaise: integer("igst_paise").notNull().default(0),
    totalAmountPaise: integer("total_amount_paise").notNull(),
    advanceAdjustmentPaise: integer("advance_adjustment_paise")
        .notNull()
        .default(0),
    paymentTerms: text("payment_terms"),
    bankDetailsSnapshot: jsonb("bank_details_snapshot").$type<
        Record<string, unknown>
    >(),
    receiptVoucherId: uuid("receipt_voucher_id").references(
        () => corporateReceiptVouchers.id,
        { onDelete: "set null" }
    ),
    dueDate: date("due_date"),
    eWayBillNumber: text("e_way_bill_number"),
    irn: text("irn"),
    status: text("status", {
        enum: ["draft", "issued", "cancelled"],
    })
        .notNull()
        .default("draft"),
    ...timestamps,
});

export const corporateCancellations = pgTable("corporate_cancellations", {
    id: uuid("id").primaryKey().notNull().defaultRandom(),
    orderId: uuid("order_id")
        .notNull()
        .references(() => corporateOrders.id, { onDelete: "cascade" }),
    requestedByUserId: text("requested_by_user_id").references(() => users.id, {
        onDelete: "set null",
    }),
    cancellationReason: text("cancellation_reason").notNull(),
    refundPercentageBps: integer("refund_percentage_bps").notNull().default(0),
    refundAmountPaise: integer("refund_amount_paise").notNull().default(0),
    status: text("status", {
        enum: ["requested", "approved", "rejected", "processed"],
    })
        .notNull()
        .default("requested"),
    ...timestamps,
});

export const corporateRefunds = pgTable("corporate_refunds", {
    id: uuid("id").primaryKey().notNull().defaultRandom(),
    cancellationId: uuid("cancellation_id").references(
        () => corporateCancellations.id,
        { onDelete: "set null" }
    ),
    orderId: uuid("order_id").references(() => corporateOrders.id, {
        onDelete: "cascade",
    }),
    refundAmountPaise: integer("refund_amount_paise").notNull(),
    refundMethod: text("refund_method").notNull(),
    refundReference: text("refund_reference"),
    refundStatus: text("refund_status", {
        enum: ["pending", "processed", "failed"],
    })
        .notNull()
        .default("pending"),
    ...timestamps,
});

export const corporateCreditNotes = pgTable("corporate_credit_notes", {
    id: uuid("id").primaryKey().notNull().defaultRandom(),
    brandId: uuid("brand_id").references(() => brands.id, {
        onDelete: "restrict",
    }),
    taxInvoiceId: uuid("tax_invoice_id").references(
        () => corporateTaxInvoices.id,
        {
            onDelete: "set null",
        }
    ),
    creditNoteNumber: text("credit_note_number").notNull(),
    buyerGstin: text("buyer_gstin"),
    hsnCode: text("hsn_code"),
    amountPaise: integer("amount_paise").notNull(),
    cgstPaise: integer("cgst_paise").notNull().default(0),
    sgstPaise: integer("sgst_paise").notNull().default(0),
    igstPaise: integer("igst_paise").notNull().default(0),
    reason: text("reason"),
    ...timestamps,
});

export const corporateDebitNotes = pgTable(
    "corporate_debit_notes",
    {
        id: uuid("id").primaryKey().notNull().defaultRandom(),
        brandId: uuid("brand_id")
            .notNull()
            .references(() => brands.id, { onDelete: "restrict" }),
        orderId: uuid("order_id")
            .notNull()
            .references(() => corporateOrders.id, { onDelete: "cascade" }),
        originalInvoiceId: uuid("original_invoice_id").references(
            () => corporateTaxInvoices.id,
            { onDelete: "set null" }
        ),
        debitNoteNumber: text("debit_note_number").notNull(),
        buyerGstin: text("buyer_gstin").notNull(),
        hsnCode: text("hsn_code").notNull(),
        reason: text("reason"),
        taxableValuePaise: integer("taxable_value_paise").notNull(),
        cgstPaise: integer("cgst_paise").notNull().default(0),
        sgstPaise: integer("sgst_paise").notNull().default(0),
        igstPaise: integer("igst_paise").notNull().default(0),
        totalPaise: integer("total_paise").notNull(),
        status: text("status", {
            enum: ["draft", "issued", "cancelled"],
        })
            .notNull()
            .default("draft"),
        ...timestamps,
    },
    (table) => ({
        numberUnique: uniqueIndex("corporate_debit_notes_number_idx").on(
            table.debitNoteNumber
        ),
        orderIdx: index("corporate_debit_notes_order_idx").on(table.orderId),
        brandIdx: index("corporate_debit_notes_brand_idx").on(table.brandId),
    })
);

export const corporateRefundVouchers = pgTable(
    "corporate_refund_vouchers",
    {
        id: uuid("id").primaryKey().notNull().defaultRandom(),
        voucherNumber: text("voucher_number").notNull(),
        orderId: uuid("order_id")
            .notNull()
            .references(() => corporateOrders.id, { onDelete: "cascade" }),
        cancellationId: uuid("cancellation_id").references(
            () => corporateCancellations.id,
            { onDelete: "set null" }
        ),
        refundId: uuid("refund_id").references(() => corporateRefunds.id, {
            onDelete: "set null",
        }),
        receiptVoucherId: uuid("receipt_voucher_id").references(
            () => corporateReceiptVouchers.id,
            { onDelete: "set null" }
        ),
        voucherDate: date("voucher_date").notNull(),
        amountPaise: integer("amount_paise").notNull(),
        reason: text("reason"),
        status: text("status", {
            enum: ["issued", "cancelled"],
        })
            .notNull()
            .default("issued"),
        ...timestamps,
    },
    (table) => ({
        voucherNumberUnique: uniqueIndex(
            "corporate_refund_vouchers_number_idx"
        ).on(table.voucherNumber),
        orderIdx: index("corporate_refund_vouchers_order_idx").on(
            table.orderId
        ),
    })
);

export const corporateBrandCommissions = pgTable(
    "corporate_brand_commissions",
    {
        id: uuid("id").primaryKey().notNull().defaultRandom(),
        brandId: uuid("brand_id")
            .notNull()
            .references(() => brands.id, { onDelete: "cascade" }),
        commissionPercentageBps: integer("commission_percentage_bps")
            .notNull()
            .default(0),
        effectiveFrom: date("effective_from"),
        ...timestamps,
    }
);

export const corporateBrandPayouts = pgTable("corporate_brand_payouts", {
    id: uuid("id").primaryKey().notNull().defaultRandom(),
    orderId: uuid("order_id")
        .notNull()
        .references(() => corporateOrders.id, { onDelete: "cascade" }),
    brandId: uuid("brand_id")
        .notNull()
        .references(() => brands.id, { onDelete: "cascade" }),
    grossOrderValuePaise: integer("gross_order_value_paise").notNull(),
    commissionAmountPaise: integer("commission_amount_paise").notNull(),
    netPayablePaise: integer("net_payable_paise").notNull(),
    payoutStatus: text("payout_status", {
        enum: ["queued", "approved", "paid", "held"],
    })
        .notNull()
        .default("queued"),
    settlementHoldUntil: timestamp("settlement_hold_until"),
    payoutDate: date("payout_date"),
    ...timestamps,
});

export const corporateSettlementStatements = pgTable(
    "corporate_settlement_statements",
    {
        id: uuid("id").primaryKey().notNull().defaultRandom(),
        orderId: uuid("order_id")
            .notNull()
            .references(() => corporateOrders.id, { onDelete: "cascade" }),
        brandId: uuid("brand_id")
            .notNull()
            .references(() => brands.id, { onDelete: "cascade" }),
        statementNumber: text("statement_number").notNull(),
        statementDate: date("statement_date").notNull(),
        grossPaidPaise: integer("gross_paid_paise").notNull(),
        gstEmbeddedPaise: integer("gst_embedded_paise").notNull(),
        taxableValuePaise: integer("taxable_value_paise").notNull(),
        commissionPercentBps: integer("commission_percent_bps").notNull(),
        commissionAmountPaise: integer("commission_amount_paise").notNull(),
        commissionGstRateBps: integer("commission_gst_rate_bps")
            .notNull()
            .default(1800),
        commissionGstAmountPaise: integer(
            "commission_gst_amount_paise"
        ).notNull(),
        tcsPercentBps: integer("tcs_percent_bps").notNull().default(50),
        tcsAmountPaise: integer("tcs_amount_paise").notNull(),
        tdsPercentBps: integer("tds_percent_bps").notNull().default(10),
        tdsAmountPaise: integer("tds_amount_paise").notNull(),
        netRemittancePaise: integer("net_remittance_paise").notNull(),
        status: text("status", {
            enum: ["draft", "issued", "settled"],
        })
            .notNull()
            .default("issued"),
        notes: text("notes"),
        ...timestamps,
    },
    (table) => ({
        statementNumberIdx: uniqueIndex(
            "corporate_settlement_statements_number_idx"
        ).on(table.statementNumber),
        orderIdx: index("corporate_settlement_statements_order_idx").on(
            table.orderId
        ),
        brandIdx: index("corporate_settlement_statements_brand_idx").on(
            table.brandId
        ),
    })
);

export const corporateTasks = pgTable(
    "corporate_tasks",
    {
        id: uuid("id").primaryKey().notNull().defaultRandom(),
        taskType: text("task_type").notNull(),
        entityType: text("entity_type").notNull(),
        entityId: uuid("entity_id").notNull(),
        assignedToUserId: text("assigned_to_user_id").references(
            () => users.id,
            {
                onDelete: "set null",
            }
        ),
        dueDate: date("due_date"),
        status: text("status", {
            enum: ["open", "in_progress", "completed", "escalated"],
        })
            .notNull()
            .default("open"),
        priority: text("priority", {
            enum: ["low", "medium", "high", "critical"],
        })
            .notNull()
            .default("medium"),
        notes: text("notes"),
        ...timestamps,
    },
    (table) => ({
        entityIdx: index("corporate_tasks_entity_idx").on(
            table.entityType,
            table.entityId
        ),
        assigneeIdx: index("corporate_tasks_assignee_idx").on(
            table.assignedToUserId
        ),
    })
);

export const corporateSlaRules = pgTable("corporate_sla_rules", {
    id: uuid("id").primaryKey().notNull().defaultRandom(),
    workflowType: text("workflow_type").notNull(),
    stageName: text("stage_name").notNull(),
    slaHours: integer("sla_hours").notNull(),
    escalationLevel1Hours: integer("escalation_level_1_hours"),
    escalationLevel2Hours: integer("escalation_level_2_hours"),
    escalationLevel3Hours: integer("escalation_level_3_hours"),
    isActive: boolean("is_active").notNull().default(true),
    ...timestamps,
});

export const corporateEscalations = pgTable(
    "corporate_escalations",
    {
        id: uuid("id").primaryKey().notNull().defaultRandom(),
        entityType: text("entity_type").notNull(),
        entityId: uuid("entity_id").notNull(),
        escalationLevel: integer("escalation_level").notNull().default(1),
        status: text("status", {
            enum: ["open", "resolved"],
        })
            .notNull()
            .default("open"),
        triggeredAt: date("triggered_at"),
        resolvedAt: date("resolved_at"),
        ...timestamps,
    },
    (table) => ({
        entityIdx: index("corporate_escalations_entity_idx").on(
            table.entityType,
            table.entityId
        ),
    })
);

export const corporateNotifications = pgTable("corporate_notifications", {
    id: uuid("id").primaryKey().notNull().defaultRandom(),
    recipientType: text("recipient_type").notNull(),
    recipientId: text("recipient_id"),
    notificationType: text("notification_type").notNull(),
    channel: text("channel", {
        enum: ["email", "whatsapp", "system"],
    })
        .notNull()
        .default("email"),
    status: text("status", {
        enum: ["pending", "sent", "failed"],
    })
        .notNull()
        .default("pending"),
    sentAt: date("sent_at"),
    payload: jsonb("payload")
        .$type<Record<string, unknown>>()
        .default({})
        .notNull(),
    ...timestamps,
});

export const corporateEvents = pgTable("corporate_events", {
    id: uuid("id").primaryKey().notNull().defaultRandom(),
    eventType: text("event_type").notNull(),
    entityType: text("entity_type").notNull(),
    entityId: uuid("entity_id").notNull(),
    payload: jsonb("payload")
        .$type<Record<string, unknown>>()
        .default({})
        .notNull(),
    ...timestamps,
});

export const corporateActivityTimeline = pgTable(
    "corporate_activity_timeline",
    {
        id: uuid("id").primaryKey().notNull().defaultRandom(),
        entityType: text("entity_type").notNull(),
        entityId: uuid("entity_id").notNull(),
        eventName: text("event_name").notNull(),
        eventDetails: jsonb("event_details")
            .$type<Record<string, unknown>>()
            .default({})
            .notNull(),
        createdBy: text("created_by"),
        ...timestamps,
    },
    (table) => ({
        entityIdx: index("corporate_activity_timeline_entity_idx").on(
            table.entityType,
            table.entityId
        ),
    })
);

export const corporateExceptions = pgTable("corporate_exceptions", {
    id: uuid("id").primaryKey().notNull().defaultRandom(),
    exceptionType: text("exception_type").notNull(),
    severity: text("severity", {
        enum: ["low", "medium", "high", "critical"],
    })
        .notNull()
        .default("medium"),
    entityType: text("entity_type").notNull(),
    entityId: uuid("entity_id").notNull(),
    status: text("status", {
        enum: ["open", "investigating", "resolved"],
    })
        .notNull()
        .default("open"),
    details: text("details"),
    ...timestamps,
});

export const corporateCronLogs = pgTable("corporate_cron_logs", {
    id: uuid("id").primaryKey().notNull().defaultRandom(),
    jobName: text("job_name").notNull(),
    executionStatus: text("execution_status", {
        enum: ["success", "failed"],
    }).notNull(),
    remarks: text("remarks"),
    executedAt: date("executed_at"),
    ...timestamps,
});

export const corporateReports = pgTable("corporate_reports", {
    id: uuid("id").primaryKey().notNull().defaultRandom(),
    reportType: text("report_type").notNull(),
    fileUrl: text("file_url"),
    generatedAt: date("generated_at"),
    ...timestamps,
});

export const corporateAdminAuditLogs = pgTable("corporate_admin_audit_logs", {
    id: uuid("id").primaryKey().notNull().defaultRandom(),
    adminId: text("admin_id").references(() => users.id, {
        onDelete: "set null",
    }),
    actionType: text("action_type").notNull(),
    entityType: text("entity_type").notNull(),
    entityId: uuid("entity_id"),
    oldValue: jsonb("old_value")
        .$type<Record<string, unknown> | null>()
        .default(null),
    newValue: jsonb("new_value")
        .$type<Record<string, unknown> | null>()
        .default(null),
    ...timestamps,
});

export const corporateFinanceAuditLogs = pgTable(
    "corporate_finance_audit_logs",
    {
        id: uuid("id").primaryKey().notNull().defaultRandom(),
        actorId: text("actor_id").references(() => users.id, {
            onDelete: "set null",
        }),
        entityType: text("entity_type").notNull(),
        entityId: uuid("entity_id"),
        action: text("action").notNull(),
        metadata: jsonb("metadata")
            .$type<Record<string, unknown>>()
            .default({})
            .notNull(),
        ...timestamps,
    }
);

export const corporateBrandAuditLogs = pgTable("corporate_brand_audit_logs", {
    id: uuid("id").primaryKey().notNull().defaultRandom(),
    brandId: uuid("brand_id").references(() => brands.id, {
        onDelete: "set null",
    }),
    actorId: text("actor_id").references(() => users.id, {
        onDelete: "set null",
    }),
    action: text("action").notNull(),
    entityType: text("entity_type").notNull(),
    entityId: uuid("entity_id"),
    metadata: jsonb("metadata")
        .$type<Record<string, unknown>>()
        .default({})
        .notNull(),
    ...timestamps,
});

export const corporateProfilesRelations = relations(
    corporateProfiles,
    ({ many }) => ({
        rfqs: many(corporateRfqs),
        quotes: many(corporateQuotes),
    })
);

export const corporateRfqsRelations = relations(
    corporateRfqs,
    ({ one, many }) => ({
        profile: one(corporateProfiles, {
            fields: [corporateRfqs.corporateProfileId],
            references: [corporateProfiles.id],
        }),
        user: one(users, {
            fields: [corporateRfqs.userId],
            references: [users.id],
        }),
        documents: many(corporateRfqDocuments),
        quotes: many(corporateQuotes),
    })
);

export const corporateRfqDocumentsRelations = relations(
    corporateRfqDocuments,
    ({ one }) => ({
        rfq: one(corporateRfqs, {
            fields: [corporateRfqDocuments.rfqId],
            references: [corporateRfqs.id],
        }),
        uploadedBy: one(users, {
            fields: [corporateRfqDocuments.uploadedByUserId],
            references: [users.id],
        }),
    })
);

export const corporateQuotesRelations = relations(
    corporateQuotes,
    ({ one, many }) => ({
        rfq: one(corporateRfqs, {
            fields: [corporateQuotes.rfqId],
            references: [corporateRfqs.id],
        }),
        profile: one(corporateProfiles, {
            fields: [corporateQuotes.corporateProfileId],
            references: [corporateProfiles.id],
        }),
        brand: one(brands, {
            fields: [corporateQuotes.brandId],
            references: [brands.id],
        }),
        productType: one(corporateProductTypes, {
            fields: [corporateQuotes.productTypeId],
            references: [corporateProductTypes.id],
        }),
        gsmOption: one(corporateGsmOptions, {
            fields: [corporateQuotes.gsmOptionId],
            references: [corporateGsmOptions.id],
        }),
        fabricComposition: one(corporateFabricCompositions, {
            fields: [corporateQuotes.fabricCompositionId],
            references: [corporateFabricCompositions.id],
        }),
        revisions: many(corporateQuoteRevisions),
    })
);

export const corporateQuoteRevisionsRelations = relations(
    corporateQuoteRevisions,
    ({ one }) => ({
        quote: one(corporateQuotes, {
            fields: [corporateQuoteRevisions.quoteId],
            references: [corporateQuotes.id],
        }),
        createdBy: one(users, {
            fields: [corporateQuoteRevisions.createdByUserId],
            references: [users.id],
        }),
    })
);

export const corporateReplacementRequests = pgTable(
    "corporate_replacement_requests",
    {
        id: uuid("id").primaryKey().notNull().defaultRandom(),
        orderId: uuid("order_id")
            .notNull()
            .references(() => corporateOrders.id, { onDelete: "cascade" }),
        requestedByUserId: text("requested_by_user_id").references(
            () => users.id,
            {
                onDelete: "set null",
            }
        ),
        reviewedByUserId: text("reviewed_by_user_id").references(
            () => users.id,
            {
                onDelete: "set null",
            }
        ),
        replacementOrderId: uuid("replacement_order_id").references(
            () => corporateOrders.id,
            { onDelete: "set null" }
        ),
        requestedQuantity: integer("requested_quantity").notNull().default(1),
        reasonCode: text("reason_code", {
            enum: [
                "size_issue",
                "damaged_item",
                "print_issue",
                "stitching_issue",
                "wrong_item_received",
                "quantity_shortage",
                "other",
            ],
        }).notNull(),
        reasonDetails: text("reason_details"),
        photos: jsonb("photos")
            .$type<
                Array<{
                    name: string;
                    url: string;
                    type: string;
                    size: number;
                    key?: string | undefined;
                }>
            >()
            .default([])
            .notNull(),
        status: text("status", {
            enum: ["requested", "approved", "rejected"],
        })
            .notNull()
            .default("requested"),
        adminNote: text("admin_note"),
        reviewedAt: date("reviewed_at"),
        ...timestamps,
    },
    (table) => ({
        orderIdx: index("corporate_replacement_requests_order_idx").on(
            table.orderId
        ),
        statusIdx: index("corporate_replacement_requests_status_idx").on(
            table.status
        ),
        replacementOrderIdx: index(
            "corporate_replacement_requests_replacement_order_idx"
        ).on(table.replacementOrderId),
    })
);

export const corporateRtoShipments = pgTable(
    "corporate_rto_shipments",
    {
        id: uuid("id").primaryKey().notNull().defaultRandom(),
        orderId: uuid("order_id")
            .notNull()
            .references(() => corporateOrders.id, { onDelete: "cascade" }),
        replacementRequestId: uuid("replacement_request_id")
            .notNull()
            .references(() => corporateReplacementRequests.id, {
                onDelete: "cascade",
            }),
        provider: text("provider").notNull().default("delhivery"),
        pickupLocationCode: text("pickup_location_code"),
        originalAwbNumber: text("original_awb_number"),
        reverseAwbNumber: text("reverse_awb_number"),
        reverseTrackingNumber: text("reverse_tracking_number"),
        reverseTrackingUrl: text("reverse_tracking_url"),
        reasonCode: text("reason_code", {
            enum: [
                "size_issue",
                "damaged_item",
                "print_issue",
                "stitching_issue",
                "wrong_item_received",
                "quantity_shortage",
                "other",
            ],
        }).notNull(),
        status: text("status", {
            enum: [
                "draft",
                "requested",
                "pickup_scheduled",
                "in_transit",
                "received",
                "completed",
                "cancelled",
                "failed",
            ],
        })
            .notNull()
            .default("draft"),
        rawPayload: jsonb("raw_payload")
            .$type<Record<string, unknown>>()
            .default({})
            .notNull(),
        createdByUserId: text("created_by_user_id").references(() => users.id, {
            onDelete: "set null",
        }),
        handledByUserId: text("handled_by_user_id").references(() => users.id, {
            onDelete: "set null",
        }),
        scheduledPickupDate: date("scheduled_pickup_date"),
        receivedAt: date("received_at"),
        notes: text("notes"),
        ...timestamps,
    },
    (table) => ({
        orderIdx: index("corporate_rto_shipments_order_idx").on(table.orderId),
        requestIdx: uniqueIndex("corporate_rto_shipments_request_idx").on(
            table.replacementRequestId
        ),
        statusIdx: index("corporate_rto_shipments_status_idx").on(table.status),
        reverseAwbIdx: index("corporate_rto_shipments_reverse_awb_idx").on(
            table.reverseAwbNumber
        ),
    })
);

export const corporatePurchaseOrdersRelations = relations(
    corporatePurchaseOrders,
    ({ one }) => ({
        quote: one(corporateQuotes, {
            fields: [corporatePurchaseOrders.quoteId],
            references: [corporateQuotes.id],
        }),
        profile: one(corporateProfiles, {
            fields: [corporatePurchaseOrders.corporateProfileId],
            references: [corporateProfiles.id],
        }),
        order: one(corporateOrders, {
            fields: [corporatePurchaseOrders.corporateOrderId],
            references: [corporateOrders.id],
        }),
    })
);

export const corporateProformaInvoicesRelations = relations(
    corporateProformaInvoices,
    ({ one }) => ({
        quote: one(corporateQuotes, {
            fields: [corporateProformaInvoices.quoteId],
            references: [corporateQuotes.id],
        }),
        order: one(corporateOrders, {
            fields: [corporateProformaInvoices.orderId],
            references: [corporateOrders.id],
        }),
        customer: one(corporateProfiles, {
            fields: [corporateProformaInvoices.customerId],
            references: [corporateProfiles.id],
        }),
    })
);

export const corporateReceiptVouchersRelations = relations(
    corporateReceiptVouchers,
    ({ one }) => ({
        order: one(corporateOrders, {
            fields: [corporateReceiptVouchers.orderId],
            references: [corporateOrders.id],
        }),
        payment: one(corporatePayments, {
            fields: [corporateReceiptVouchers.paymentId],
            references: [corporatePayments.id],
        }),
    })
);

export const corporateVendorPurchaseOrdersRelations = relations(
    corporateVendorPurchaseOrders,
    ({ one }) => ({
        order: one(corporateOrders, {
            fields: [corporateVendorPurchaseOrders.orderId],
            references: [corporateOrders.id],
        }),
        brand: one(brands, {
            fields: [corporateVendorPurchaseOrders.brandId],
            references: [brands.id],
        }),
        createdBy: one(users, {
            fields: [corporateVendorPurchaseOrders.createdByUserId],
            references: [users.id],
        }),
    })
);

export const corporateBrandTaxInvoicesRelations = relations(
    corporateBrandTaxInvoices,
    ({ one }) => ({
        order: one(corporateOrders, {
            fields: [corporateBrandTaxInvoices.orderId],
            references: [corporateOrders.id],
        }),
        brand: one(brands, {
            fields: [corporateBrandTaxInvoices.brandId],
            references: [brands.id],
        }),
        vendorPurchaseOrder: one(corporateVendorPurchaseOrders, {
            fields: [corporateBrandTaxInvoices.vendorPurchaseOrderId],
            references: [corporateVendorPurchaseOrders.id],
        }),
        uploadedBy: one(users, {
            fields: [corporateBrandTaxInvoices.uploadedByUserId],
            references: [users.id],
        }),
    })
);

export const corporateDeliveryChallansRelations = relations(
    corporateDeliveryChallans,
    ({ one }) => ({
        order: one(corporateOrders, {
            fields: [corporateDeliveryChallans.orderId],
            references: [corporateOrders.id],
        }),
        vendorPurchaseOrder: one(corporateVendorPurchaseOrders, {
            fields: [corporateDeliveryChallans.vendorPurchaseOrderId],
            references: [corporateVendorPurchaseOrders.id],
        }),
        createdBy: one(users, {
            fields: [corporateDeliveryChallans.createdByUserId],
            references: [users.id],
        }),
    })
);

export const corporateTaxInvoicesRelations = relations(
    corporateTaxInvoices,
    ({ one }) => ({
        order: one(corporateOrders, {
            fields: [corporateTaxInvoices.orderId],
            references: [corporateOrders.id],
        }),
        brand: one(brands, {
            fields: [corporateTaxInvoices.brandId],
            references: [brands.id],
        }),
        receiptVoucher: one(corporateReceiptVouchers, {
            fields: [corporateTaxInvoices.receiptVoucherId],
            references: [corporateReceiptVouchers.id],
        }),
    })
);

export const corporateCreditNotesRelations = relations(
    corporateCreditNotes,
    ({ one }) => ({
        taxInvoice: one(corporateTaxInvoices, {
            fields: [corporateCreditNotes.taxInvoiceId],
            references: [corporateTaxInvoices.id],
        }),
        brand: one(brands, {
            fields: [corporateCreditNotes.brandId],
            references: [brands.id],
        }),
    })
);

export const corporateDebitNotesRelations = relations(
    corporateDebitNotes,
    ({ one }) => ({
        order: one(corporateOrders, {
            fields: [corporateDebitNotes.orderId],
            references: [corporateOrders.id],
        }),
        brand: one(brands, {
            fields: [corporateDebitNotes.brandId],
            references: [brands.id],
        }),
        originalInvoice: one(corporateTaxInvoices, {
            fields: [corporateDebitNotes.originalInvoiceId],
            references: [corporateTaxInvoices.id],
        }),
    })
);

export const corporateRefundVouchersRelations = relations(
    corporateRefundVouchers,
    ({ one }) => ({
        order: one(corporateOrders, {
            fields: [corporateRefundVouchers.orderId],
            references: [corporateOrders.id],
        }),
        receiptVoucher: one(corporateReceiptVouchers, {
            fields: [corporateRefundVouchers.receiptVoucherId],
            references: [corporateReceiptVouchers.id],
        }),
        cancellation: one(corporateCancellations, {
            fields: [corporateRefundVouchers.cancellationId],
            references: [corporateCancellations.id],
        }),
        refund: one(corporateRefunds, {
            fields: [corporateRefundVouchers.refundId],
            references: [corporateRefunds.id],
        }),
    })
);

export const corporateProductConfigsRelations = relations(
    corporateProductConfigs,
    ({ one }) => ({
        product: one(products, {
            fields: [corporateProductConfigs.productId],
            references: [products.id],
        }),
        brand: one(brands, {
            fields: [corporateProductConfigs.brandId],
            references: [brands.id],
        }),
    })
);

export const corporateQcSubmissionsRelations = relations(
    corporateQcSubmissions,
    ({ one, many }) => ({
        order: one(corporateOrders, {
            fields: [corporateQcSubmissions.orderId],
            references: [corporateOrders.id],
        }),
        submittedBy: one(users, {
            fields: [corporateQcSubmissions.submittedByUserId],
            references: [users.id],
        }),
        reviewedBy: one(users, {
            fields: [corporateQcSubmissions.reviewedByUserId],
            references: [users.id],
        }),
        images: many(corporateQcImages),
    })
);

export const corporateQcImagesRelations = relations(
    corporateQcImages,
    ({ one }) => ({
        submission: one(corporateQcSubmissions, {
            fields: [corporateQcImages.qcSubmissionId],
            references: [corporateQcSubmissions.id],
        }),
    })
);

export const corporateShipmentsRelations = relations(
    corporateShipments,
    ({ one }) => ({
        order: one(corporateOrders, {
            fields: [corporateShipments.orderId],
            references: [corporateOrders.id],
        }),
    })
);

export const corporateReplacementRequestsRelations = relations(
    corporateReplacementRequests,
    ({ one }) => ({
        order: one(corporateOrders, {
            fields: [corporateReplacementRequests.orderId],
            references: [corporateOrders.id],
            relationName: "corporate_order_replacement_requests",
        }),
        replacementOrder: one(corporateOrders, {
            fields: [corporateReplacementRequests.replacementOrderId],
            references: [corporateOrders.id],
            relationName: "corporate_order_replacement_orders",
        }),
        requestedBy: one(users, {
            fields: [corporateReplacementRequests.requestedByUserId],
            references: [users.id],
        }),
        reviewedBy: one(users, {
            fields: [corporateReplacementRequests.reviewedByUserId],
            references: [users.id],
        }),
        rtoShipment: one(corporateRtoShipments, {
            fields: [corporateReplacementRequests.id],
            references: [corporateRtoShipments.replacementRequestId],
        }),
    })
);

export const corporateRtoShipmentsRelations = relations(
    corporateRtoShipments,
    ({ one }) => ({
        order: one(corporateOrders, {
            fields: [corporateRtoShipments.orderId],
            references: [corporateOrders.id],
        }),
        replacementRequest: one(corporateReplacementRequests, {
            fields: [corporateRtoShipments.replacementRequestId],
            references: [corporateReplacementRequests.id],
        }),
        createdBy: one(users, {
            fields: [corporateRtoShipments.createdByUserId],
            references: [users.id],
        }),
        handledBy: one(users, {
            fields: [corporateRtoShipments.handledByUserId],
            references: [users.id],
        }),
    })
);

export type CorporateWorkflowStatus = (typeof workflowStatuses)[number];
export type CorporatePaymentLifecycleStatus = (typeof paymentStatuses)[number];
