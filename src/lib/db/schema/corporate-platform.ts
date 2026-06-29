import { relations } from "drizzle-orm";
import {
    boolean,
    date,
    index,
    integer,
    jsonb,
    pgTable,
    text,
    uuid,
} from "drizzle-orm/pg-core";
import { timestamps } from "../helper";
import { brands } from "./brand";
import { corporateOrders } from "./corporate-order";
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

export const corporateProfiles = pgTable(
    "corporate_profiles",
    {
        id: uuid("id").primaryKey().notNull().defaultRandom(),
        userId: text("user_id")
            .notNull()
            .references(() => users.id, { onDelete: "cascade" }),
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
        priceRangeMinPaise: integer("price_range_min_paise").notNull().default(0),
        priceRangeMaxPaise: integer("price_range_max_paise"),
        sustainabilityNotes: text("sustainability_notes"),
        displayOrder: integer("display_order").notNull().default(0),
        ...timestamps,
    },
    (table) => ({
        productIdx: index("corporate_product_configs_product_idx").on(
            table.productId
        ),
        brandIdx: index("corporate_product_configs_brand_idx").on(table.brandId),
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
        uploadedByUserId: text("uploaded_by_user_id").references(() => users.id, {
            onDelete: "set null",
        }),
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
        assignedByUserId: text("assigned_by_user_id").references(() => users.id, {
            onDelete: "set null",
        }),
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
        confidenceScoreBps: integer("confidence_score_bps").notNull().default(0),
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
        corporateProductConfigId: uuid("corporate_product_config_id").references(
            () => corporateProductConfigs.id,
            { onDelete: "set null" }
        ),
        quantity: integer("quantity").notNull(),
        subtotalPaise: integer("subtotal_paise").notNull(),
        customizationCostPaise: integer("customization_cost_paise")
            .notNull()
            .default(0),
        gstAmountPaise: integer("gst_amount_paise").notNull().default(0),
        totalAmountPaise: integer("total_amount_paise").notNull(),
        advanceAmountPaise: integer("advance_amount_paise").notNull().default(0),
        balanceAmountPaise: integer("balance_amount_paise").notNull().default(0),
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
        quoteNumberIdx: index("corporate_quotes_number_idx").on(table.quoteNumber),
        profileIdx: index("corporate_quotes_profile_idx").on(table.corporateProfileId),
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
        quoteIdx: index("corporate_quote_revisions_quote_idx").on(table.quoteId),
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
        uploadedByUserId: text("uploaded_by_user_id").references(() => users.id, {
            onDelete: "set null",
        }),
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
        orderIdx: index("corporate_size_breakdowns_order_idx").on(table.orderId),
    })
);

export const corporatePaymentTerms = pgTable(
    "corporate_payment_terms",
    {
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
    }
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
        approvedByUserId: text("approved_by_user_id").references(() => users.id, {
            onDelete: "set null",
        }),
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
        submittedByUserId: text("submitted_by_user_id").references(() => users.id, {
            onDelete: "set null",
        }),
        status: text("status", {
            enum: ["pending", "submitted", "approved", "rejected"],
        })
            .notNull()
            .default("pending"),
        remarks: text("remarks"),
        sampleCoveragePercent: integer("sample_coverage_percent"),
        submittedAt: date("submitted_at"),
        reviewedByUserId: text("reviewed_by_user_id").references(() => users.id, {
            onDelete: "set null",
        }),
        reviewedAt: date("reviewed_at"),
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
            .references(() => corporateQcSubmissions.id, { onDelete: "cascade" }),
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
            enum: ["draft", "ready", "dispatched", "in_transit", "delivered", "failed"],
        })
            .notNull()
            .default("draft"),
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
        statusIdx: index("corporate_payments_status_idx").on(table.paymentStatus),
    })
);

export const corporateProformaInvoices = pgTable(
    "corporate_proforma_invoices",
    {
        id: uuid("id").primaryKey().notNull().defaultRandom(),
        invoiceNumber: text("invoice_number").notNull(),
        quoteId: uuid("quote_id")
            .notNull()
            .references(() => corporateQuotes.id, { onDelete: "cascade" }),
        customerId: uuid("customer_id").references(() => corporateProfiles.id, {
            onDelete: "set null",
        }),
        invoiceDate: date("invoice_date"),
        subtotalPaise: integer("subtotal_paise").notNull(),
        gstAmountPaise: integer("gst_amount_paise").notNull(),
        totalAmountPaise: integer("total_amount_paise").notNull(),
        status: text("status", {
            enum: ["draft", "issued", "cancelled"],
        })
            .notNull()
            .default("draft"),
        ...timestamps,
    }
);

export const corporateTaxInvoices = pgTable(
    "corporate_tax_invoices",
    {
        id: uuid("id").primaryKey().notNull().defaultRandom(),
        invoiceNumber: text("invoice_number").notNull(),
        orderId: uuid("order_id")
            .notNull()
            .references(() => corporateOrders.id, { onDelete: "cascade" }),
        invoiceDate: date("invoice_date"),
        taxableValuePaise: integer("taxable_value_paise").notNull(),
        cgstPaise: integer("cgst_paise").notNull().default(0),
        sgstPaise: integer("sgst_paise").notNull().default(0),
        igstPaise: integer("igst_paise").notNull().default(0),
        totalAmountPaise: integer("total_amount_paise").notNull(),
        status: text("status", {
            enum: ["draft", "issued", "cancelled"],
        })
            .notNull()
            .default("draft"),
        ...timestamps,
    }
);

export const corporateCancellations = pgTable(
    "corporate_cancellations",
    {
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
    }
);

export const corporateRefunds = pgTable(
    "corporate_refunds",
    {
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
    }
);

export const corporateCreditNotes = pgTable(
    "corporate_credit_notes",
    {
        id: uuid("id").primaryKey().notNull().defaultRandom(),
        taxInvoiceId: uuid("tax_invoice_id").references(() => corporateTaxInvoices.id, {
            onDelete: "set null",
        }),
        creditNoteNumber: text("credit_note_number").notNull(),
        amountPaise: integer("amount_paise").notNull(),
        reason: text("reason"),
        ...timestamps,
    }
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

export const corporateBrandPayouts = pgTable(
    "corporate_brand_payouts",
    {
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
        payoutDate: date("payout_date"),
        ...timestamps,
    }
);

export const corporateTasks = pgTable(
    "corporate_tasks",
    {
        id: uuid("id").primaryKey().notNull().defaultRandom(),
        taskType: text("task_type").notNull(),
        entityType: text("entity_type").notNull(),
        entityId: uuid("entity_id").notNull(),
        assignedToUserId: text("assigned_to_user_id").references(() => users.id, {
            onDelete: "set null",
        }),
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
        assigneeIdx: index("corporate_tasks_assignee_idx").on(table.assignedToUserId),
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
    oldValue: jsonb("old_value").$type<Record<string, unknown> | null>().default(null),
    newValue: jsonb("new_value").$type<Record<string, unknown> | null>().default(null),
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

export const corporateRfqsRelations = relations(corporateRfqs, ({ one, many }) => ({
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
}));

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

export type CorporateWorkflowStatus = (typeof workflowStatuses)[number];
export type CorporatePaymentLifecycleStatus = (typeof paymentStatuses)[number];
