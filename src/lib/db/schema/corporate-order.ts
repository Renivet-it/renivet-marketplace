import { relations } from "drizzle-orm";
import {
    boolean,
    index,
    integer,
    jsonb,
    pgTable,
    serial,
    text,
    uniqueIndex,
    uuid,
} from "drizzle-orm/pg-core";
import { timestamps } from "../helper";
import { brands } from "./brand";
import { corporateQuotes, corporateShipments } from "./corporate-platform";
import { users } from "./user";

export const corporateProductTypes = pgTable(
    "corporate_product_types",
    {
        id: uuid("id").primaryKey().notNull().defaultRandom(),
        name: text("name").notNull(),
        description: text("description"),
        isActive: boolean("is_active").notNull().default(true),
        sortOrder: integer("sort_order").notNull().default(0),
        ...timestamps,
    },
    (table) => ({
        nameUnique: uniqueIndex("corporate_product_types_name_unique").on(
            table.name
        ),
    })
);

export const corporateGsmOptions = pgTable(
    "corporate_gsm_options",
    {
        id: uuid("id").primaryKey().notNull().defaultRandom(),
        label: text("label").notNull(),
        gsmValue: integer("gsm_value").notNull(),
        isActive: boolean("is_active").notNull().default(true),
        sortOrder: integer("sort_order").notNull().default(0),
        ...timestamps,
    },
    (table) => ({
        labelUnique: uniqueIndex("corporate_gsm_options_label_unique").on(
            table.label
        ),
    })
);

export const corporateFabricCompositions = pgTable(
    "corporate_fabric_compositions",
    {
        id: uuid("id").primaryKey().notNull().defaultRandom(),
        name: text("name").notNull(),
        description: text("description"),
        isActive: boolean("is_active").notNull().default(true),
        sortOrder: integer("sort_order").notNull().default(0),
        ...timestamps,
    },
    (table) => ({
        nameUnique: uniqueIndex(
            "corporate_fabric_compositions_name_unique"
        ).on(table.name),
    })
);

export const corporateColorOptions = pgTable(
    "corporate_color_options",
    {
        id: uuid("id").primaryKey().notNull().defaultRandom(),
        name: text("name").notNull(),
        hexCode: text("hex_code"),
        isCustom: boolean("is_custom").notNull().default(false),
        isActive: boolean("is_active").notNull().default(true),
        sortOrder: integer("sort_order").notNull().default(0),
        ...timestamps,
    },
    (table) => ({
        nameUnique: uniqueIndex("corporate_color_options_name_unique").on(
            table.name
        ),
    })
);

export const corporatePrintMethods = pgTable(
    "corporate_print_methods",
    {
        id: uuid("id").primaryKey().notNull().defaultRandom(),
        name: text("name").notNull(),
        priceModifierPaise: integer("price_modifier_paise")
            .notNull()
            .default(0),
        isActive: boolean("is_active").notNull().default(true),
        sortOrder: integer("sort_order").notNull().default(0),
        ...timestamps,
    },
    (table) => ({
        nameUnique: uniqueIndex("corporate_print_methods_name_unique").on(
            table.name
        ),
    })
);

export const corporateLogoLocations = pgTable(
    "corporate_logo_locations",
    {
        id: uuid("id").primaryKey().notNull().defaultRandom(),
        name: text("name").notNull(),
        placementGroup: text("placement_group").notNull(),
        isActive: boolean("is_active").notNull().default(true),
        sortOrder: integer("sort_order").notNull().default(0),
        ...timestamps,
    },
    (table) => ({
        nameUnique: uniqueIndex("corporate_logo_locations_name_unique").on(
            table.name
        ),
    })
);

export const corporateExtraChargeRules = pgTable(
    "corporate_extra_charge_rules",
    {
        id: uuid("id").primaryKey().notNull().defaultRandom(),
        code: text("code").notNull(),
        name: text("name").notNull(),
        chargeType: text("charge_type", {
            enum: ["flat", "per_unit", "per_location"],
        })
            .notNull()
            .default("flat"),
        amountPaise: integer("amount_paise").notNull().default(0),
        isDefaultSelected: boolean("is_default_selected")
            .notNull()
            .default(false),
        isActive: boolean("is_active").notNull().default(true),
        sortOrder: integer("sort_order").notNull().default(0),
        ...timestamps,
    },
    (table) => ({
        codeUnique: uniqueIndex("corporate_extra_charge_rules_code_unique").on(
            table.code
        ),
    })
);

export const corporatePricingSlabs = pgTable(
    "corporate_pricing_slabs",
    {
        id: uuid("id").primaryKey().notNull().defaultRandom(),
        productTypeId: uuid("product_type_id")
            .notNull()
            .references(() => corporateProductTypes.id, {
                onDelete: "cascade",
            }),
        gsmOptionId: uuid("gsm_option_id")
            .notNull()
            .references(() => corporateGsmOptions.id, {
                onDelete: "cascade",
            }),
        minQuantity: integer("min_quantity").notNull(),
        maxQuantity: integer("max_quantity"),
        unitPricePaise: integer("unit_price_paise").notNull(),
        isActive: boolean("is_active").notNull().default(true),
        sortOrder: integer("sort_order").notNull().default(0),
        ...timestamps,
    },
    (table) => ({
        pricingLookupIdx: index("corporate_pricing_slabs_lookup_idx").on(
            table.productTypeId,
            table.gsmOptionId,
            table.minQuantity
        ),
    })
);

export const corporateOrderSettings = pgTable("corporate_order_settings", {
    id: uuid("id").primaryKey().notNull().defaultRandom(),
    gstRateBps: integer("gst_rate_bps").notNull().default(1800),
    advancePercentBps: integer("advance_percent_bps").notNull().default(3000),
    expectedTimelineText: text("expected_timeline_text")
        .notNull()
        .default("10-15 business days from approval and artwork confirmation."),
    isActive: boolean("is_active").notNull().default(true),
    ...timestamps,
});

export const corporateOrders = pgTable(
    "corporate_orders",
    {
        id: uuid("id").primaryKey().notNull().defaultRandom(),
        sequenceNo: serial("sequence_no").notNull(),
        publicOrderId: text("public_order_id").notNull(),
        userId: text("user_id")
            .notNull()
            .references(() => users.id, { onDelete: "cascade" }),
        quoteId: uuid("quote_id").references(() => corporateQuotes.id, {
            onDelete: "set null",
        }),
        brandId: uuid("brand_id").references(() => brands.id, {
            onDelete: "set null",
        }),
        status: text("status", {
            enum: [
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
            ],
        })
            .notNull()
            .default("draft"),
        paymentStatus: text("payment_status", {
            enum: ["pending", "paid", "failed"],
        })
            .notNull()
            .default("pending"),
        companyName: text("company_name").notNull(),
        contactPersonName: text("contact_person_name").notNull(),
        emailAddress: text("email_address").notNull(),
        mobileNumber: text("mobile_number").notNull(),
        gstNumber: text("gst_number"),
        deliveryCountry: text("delivery_country").notNull(),
        deliveryCity: text("delivery_city").notNull(),
        deliveryPincode: text("delivery_pincode").notNull(),
        deliveryAddress: text("delivery_address").notNull(),
        numberOfEmployees: integer("number_of_employees").notNull(),
        employeeCount: integer("employee_count").notNull(),
        quantity: integer("quantity").notNull(),
        sizeBreakdown: jsonb("size_breakdown")
            .$type<Record<string, number>>()
            .notNull()
            .default({}),
        employeeRows: jsonb("employee_rows")
            .$type<Array<{ employeeName: string; size: string }>>()
            .notNull()
            .default([]),
        companySnapshot: jsonb("company_snapshot")
            .$type<Record<string, unknown>>()
            .notNull(),
        productConfigSnapshot: jsonb("product_config_snapshot")
            .$type<Record<string, unknown>>()
            .notNull(),
        brandingConfigSnapshot: jsonb("branding_config_snapshot")
            .$type<Record<string, unknown>>()
            .notNull(),
        pricingSnapshot: jsonb("pricing_snapshot")
            .$type<Record<string, unknown>>()
            .notNull(),
        artworkFile: jsonb("artwork_file")
            .$type<Record<string, unknown> | null>()
            .default(null),
        employeeSheetFile: jsonb("employee_sheet_file")
            .$type<Record<string, unknown> | null>()
            .default(null),
        subtotalPaise: integer("subtotal_paise").notNull(),
        customizationPaise: integer("customization_paise").notNull().default(0),
        gstRateBps: integer("gst_rate_bps").notNull(),
        gstPaise: integer("gst_paise").notNull(),
        totalPaise: integer("total_paise").notNull(),
        advancePercentBps: integer("advance_percent_bps").notNull(),
        advancePaidPaise: integer("advance_paid_paise").notNull(),
        balanceDuePaise: integer("balance_due_paise").notNull(),
        razorpayOrderId: text("razorpay_order_id"),
        razorpayPaymentId: text("razorpay_payment_id"),
        razorpaySignature: text("razorpay_signature"),
        paymentReference: text("payment_reference"),
        balancePaymentLink: text("balance_payment_link"),
        balancePaymentNotes: text("balance_payment_notes"),
        balancePaymentStatus: text("balance_payment_status", {
            enum: ["pending", "shared", "paid"],
        })
            .notNull()
            .default("pending"),
        customerNotes: text("customer_notes"),
        internalNotes: text("internal_notes"),
        ...timestamps,
    },
    (table) => ({
        publicOrderUnique: uniqueIndex("corporate_orders_public_order_unique").on(
            table.publicOrderId
        ),
        sequenceUnique: uniqueIndex("corporate_orders_sequence_unique").on(
            table.sequenceNo
        ),
        userIdx: index("corporate_orders_user_idx").on(table.userId),
        quoteIdx: index("corporate_orders_quote_idx").on(table.quoteId),
        brandIdx: index("corporate_orders_brand_idx").on(table.brandId),
        statusIdx: index("corporate_orders_status_idx").on(table.status),
        paymentStatusIdx: index("corporate_orders_payment_status_idx").on(
            table.paymentStatus
        ),
    })
);

export const corporateOrderStatusHistory = pgTable(
    "corporate_order_status_history",
    {
        id: uuid("id").primaryKey().notNull().defaultRandom(),
        corporateOrderId: uuid("corporate_order_id")
            .notNull()
            .references(() => corporateOrders.id, {
                onDelete: "cascade",
            }),
        fromStatus: text("from_status"),
        toStatus: text("to_status").notNull(),
        changedByUserId: text("changed_by_user_id").references(() => users.id, {
            onDelete: "set null",
        }),
        note: text("note"),
        metadata: jsonb("metadata")
            .$type<Record<string, unknown> | null>()
            .default(null),
        ...timestamps,
    },
    (table) => ({
        orderIdx: index("corporate_order_status_history_order_idx").on(
            table.corporateOrderId
        ),
    })
);

export const corporatePricingSlabRelations = relations(
    corporatePricingSlabs,
    ({ one }) => ({
        productType: one(corporateProductTypes, {
            fields: [corporatePricingSlabs.productTypeId],
            references: [corporateProductTypes.id],
        }),
        gsmOption: one(corporateGsmOptions, {
            fields: [corporatePricingSlabs.gsmOptionId],
            references: [corporateGsmOptions.id],
        }),
    })
);

export const corporateOrdersRelations = relations(
    corporateOrders,
    ({ one, many }) => ({
        user: one(users, {
            fields: [corporateOrders.userId],
            references: [users.id],
        }),
        quote: one(corporateQuotes, {
            fields: [corporateOrders.quoteId],
            references: [corporateQuotes.id],
        }),
        brand: one(brands, {
            fields: [corporateOrders.brandId],
            references: [brands.id],
        }),
        shipment: one(corporateShipments, {
            fields: [corporateOrders.id],
            references: [corporateShipments.orderId],
        }),
        statusHistory: many(corporateOrderStatusHistory),
    })
);

export const corporateOrderStatusHistoryRelations = relations(
    corporateOrderStatusHistory,
    ({ one }) => ({
        order: one(corporateOrders, {
            fields: [corporateOrderStatusHistory.corporateOrderId],
            references: [corporateOrders.id],
        }),
        changedBy: one(users, {
            fields: [corporateOrderStatusHistory.changedByUserId],
            references: [users.id],
        }),
    })
);
