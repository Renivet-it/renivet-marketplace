import { relations } from "drizzle-orm";
import {
    boolean,
    index,
    integer,
    pgTable,
    text,
    uniqueIndex,
    uuid,
    jsonb
} from "drizzle-orm/pg-core";
import { timestamps } from "../helper";
import { addresses } from "./address";
import { orderShipments } from "./order-shipment";
import { products, productVariants, returnExchangePolicy } from "./product";
import { refunds } from "./refund";
import { users } from "./user";

export const orders = pgTable(
    "orders",
    {
        id: text("id").primaryKey().notNull().unique(),
        userId: text("user_id")
            .notNull()
            .references(() => users.id, {
                onDelete: "cascade",
            }),
        receiptId: text("receipt_id").notNull().unique(),
        paymentId: text("payment_id"),
        paymentMethod: text("payment_method"),
        paymentStatus: text("payment_status", {
            enum: [
                "pending",
                "paid",
                "failed",
                "refund_pending",
                "refunded",
                "refund_failed",
            ],
        })
            .notNull()
            .default("pending"),
        status: text("status", {
            enum: [
                "pending",
                "processing",
                "shipped",
                "delivered",
                "cancelled",
            ],
        })
            .notNull()
            .default("pending"),
        addressId: uuid("address_id")
            .notNull()
            .references(() => addresses.id),
        totalItems: integer("total_items").notNull(),
        taxAmount: integer("tax_amount").notNull(),
        deliveryAmount: integer("delivery_amount").notNull(),
        discountAmount: integer("discount_amount").notNull().default(0),
        totalAmount: integer("total_amount").notNull(),
        ...timestamps,
    },
    (table) => ({
        orderReceiptIdIdx: uniqueIndex("order_receipt_id_idx").on(
            table.receiptId
        ),
        orderPaymentIdIdx: index("order_payment_id_idx").on(table.paymentId),
        orderUserIdIdx: index("order_user_id_idx").on(table.userId),
        orderIdUserIdIdx: uniqueIndex("order_id_user_id_idx").on(
            table.id,
            table.userId
        ),
        orderStatusIdx: index("order_status_idx").on(table.status),
        orderPaymentStatusIdx: index("order_payment_status_idx").on(
            table.paymentStatus
        ),
    })
);

export const ordersIntent = pgTable(
    "orders_intent",
    {
        id: text("id").primaryKey().notNull().unique(),
        userId: text("user_id")
            .notNull()
            .references(() => users.id, {
                onDelete: "cascade",
            }),
        productId: uuid("product_id")
            .notNull()
            .references(() => products.id, {
                onDelete: "cascade",
            }),
        variantId: uuid("variant_id").references(() => productVariants.id, {
            onDelete: "cascade",
        }),
        paymentId: text("payment_id"),
        paymentStatus: text("payment_status"),
        status: text("status"),
        orderId: text("order_id")
            .references(() => orders.id, {
                onDelete: "cascade",
            }),
        totalItems: integer("total_items"),
        totalAmount: integer("total_amount"),
        logDetails: jsonb("log_details"),
        shiprocketRequest: jsonb("shiprocket_request"), // Store full Shiprocket API request
        shiprocketResponse: jsonb("shiprocket_response"), // Store Shiprocket API response
        orderLog: jsonb("order_log"),
        ...timestamps,
    },

    (table) => ({
        orderIntentUserIdIdx: index("order_intent_user_id_idx").on(table.userId),
        orderIntentOrderIdIdx: index("order_intent_order_id_idx").on(table.orderId),
    })
);


export const orderItems = pgTable(
    "order_items",
    {
        id: uuid("id").primaryKey().notNull().unique().defaultRandom(),
        orderId: text("order_id")
            .notNull()
            .references(() => orders.id, {
                onDelete: "cascade",
            }),
        productId: uuid("product_id")
            .notNull()
            .references(() => products.id, {
                onDelete: "cascade",
            }),
        variantId: uuid("variant_id").references(() => productVariants.id, {
            onDelete: "cascade",
        }),
        sku: text("sku"),
        quantity: integer("quantity").notNull().default(1),
        ...timestamps,
    },
    (table) => ({
        orderItemOrderIdIdx: index("order_item_order_id_idx").on(table.orderId),
        orderItemProductIdIdx: index("order_item_product_id_idx").on(
            table.productId
        ),
        orderItemVariantIdIdx: index("order_item_variant_id_idx").on(
            table.variantId
        ),
        orderItemProductIdVariantIdIdx: index(
            "order_item_product_id_variant_id_idx"
        ).on(table.productId, table.variantId),
    })
);

export const orderRelations = relations(orders, ({ one, many }) => ({
    items: many(orderItems),
    address: one(addresses, {
        fields: [orders.addressId],
        references: [addresses.id],
    }),
    user: one(users, {
        fields: [orders.userId],
        references: [users.id],
    }),
    refunds: many(refunds),
    shipments: many(orderShipments),
    intent: many(ordersIntent),
    item: one(orderItems, {
        fields: [orders.id],
        references: [orderItems.orderId]
    })
}));

export const orderItemsRelations = relations(orderItems, ({ one }) => ({
    order: one(orders, {
        fields: [orderItems.orderId],
        references: [orders.id],
    }),
    product: one(products, {
        fields: [orderItems.productId],
        references: [products.id],
    }),
    variant: one(productVariants, {
        fields: [orderItems.variantId],
        references: [productVariants.id],
    }),
    returnExchangePolicy: one(returnExchangePolicy, {
        fields: [orderItems.productId],
        references: [returnExchangePolicy.productId],
    }),
}));


export const orderIntentRelations = relations(ordersIntent, ({ one }) => ({
    order: one(orders, {
        fields: [ordersIntent.orderId],
        references: [orders.id],
    }),
    product: one(products, {
        fields: [ordersIntent.productId],
        references: [products.id],
    }),
    variant: one(productVariants, {
        fields: [ordersIntent.variantId],
        references: [productVariants.id],
    }),
        user: one(users, {
        fields: [ordersIntent.userId],
        references: [users.id],
    }),
}));