import { relations } from "drizzle-orm";
import {
    bigint,
    boolean,
    foreignKey,
    index,
    integer,
    jsonb,
    pgTable,
    text,
    timestamp,
    uuid,
} from "drizzle-orm/pg-core";
import { timestamps } from "../helper";
import { brands } from "./brand";
import { mediaExchangeShipment, mediaReturnShipment } from "./media";
import { orderItems, orders } from "./order";
import {
    returnAddressDetails,
    returnItemDetails,
    returnPaymentDetails,
} from "./order-return-exchange";

export const orderShipments = pgTable(
    "order_shipments",
    {
        id: uuid("id").primaryKey().notNull().unique().defaultRandom(),
        orderId: text("order_id")
            .notNull()
            .references(() => orders.id, { onDelete: "cascade" })
            .unique("order_id_unique_idx"),
        brandId: uuid("brand_id")
            .notNull()
            .references(() => brands.id, { onDelete: "cascade" }),
        shiprocketOrderId: integer("shiprocket_order_id"), // Changed from text to integer
        shiprocketShipmentId: integer("shiprocket_shipment_id"), // Added new field
        courierCompanyId: integer("courier_company_id"), // Added new field
        courierName: text("courier_name"), // Added new field
        awbNumber: text("awb_number"),
        trackingNumber: text("tracking_number"),
        status: text("status", {
            enum: [
                "pending",
                "processing",
                "pickup_scheduled",
                "pickup_generated",
                "pickup_queued",
                "pickup_exception",
                "pickup_rescheduled",
                "pickup_completed",
                "in_transit",
                "out_for_delivery",
                "delivered",
                "cancelled",
                "rto_initiated",
                "rto_delivered",
                "failed",
            ],
        })
            .notNull()
            .default("pending"),
        shipmentDate: timestamp("shipment_date"),
        estimatedDeliveryDate: timestamp("estimated_delivery_date"),
        labelUrl: text("label_url"),
        manifestUrl: text("manifest_url"),
        invoiceUrl: text("invoice_url"),
        isPickupScheduled: boolean("is_pickup_scheduled").default(false),
        pickupScheduledDate: timestamp("pickup_scheduled_date"),
        pickupTokenNumber: text("pickup_token_number"),
        ...timestamps,
        isAwbGenerated: boolean("is_awb_generated").default(false),
        awbDetailsShipRocketJson: jsonb("awb_details_shiprocket_json").default(
            {}
        ),
        pickUpDetailsShipRocketJson: jsonb(
            "pick_up_details_shiprocket_json"
        ).default({}),
        isRtoReturn: boolean("is_rto_return").default(false),
    },
    (table) => ({
        orderShipmentOrderIdIdx: index("order_shipment_order_id_idx").on(
            table.orderId
        ),
        orderShipmentBrandIdIdx: index("order_shipment_brand_id_idx").on(
            table.brandId
        ),
        orderShipmentStatusIdx: index("order_shipment_status_idx").on(
            table.status
        ),
    })
);

export const orderShipmentItems = pgTable(
    "order_shipment_items",
    {
        id: uuid("id").primaryKey().notNull().unique().defaultRandom(),
        shipmentId: uuid("shipment_id")
            .notNull()
            .references(() => orderShipments.id, { onDelete: "cascade" }),
        orderItemId: uuid("order_item_id") // Changed type to uuid
            .notNull()
            .references(() => orderItems.id, { onDelete: "cascade" }), // Changed reference to orderItems
        ...timestamps,
    },
    (table) => ({
        shipmentItemShipmentIdIdx: index("shipment_item_shipment_id_idx").on(
            table.shipmentId
        ),
        shipmentItemOrderItemIdIdx: index("shipment_item_order_item_id_idx").on(
            table.orderItemId
        ),
    })
);

export const returnShipments = pgTable(
    "order_return_shipments",
    {
        id: uuid("id").primaryKey().notNull().unique().defaultRandom(),
        deliveredOrderId: text("delivered_order_id").notNull(),
        returnOrderId: text("return_order_id").notNull().unique(),
        srOrderId: bigint("sr_order_id", { mode: "number" }),
        srShipmentId: bigint("sr_shipment_id", { mode: "number" }),
        status: text("status"),
        rtoExchangeType: boolean("rto_exchange_type").default(false),
        awb: bigint("awb", { mode: "number" }),
        courierCompanyName: text("company_name_courier"),
        srResponse: jsonb("sr_response_json").default({}),
        isPayable: boolean("is_payable").default(false),
        ...timestamps,
    },
    (table) => ({
        returnShipmentDeliveredOrderIdIdx: index("rs_doi_idx").on(
            table.deliveredOrderId
        ),
        returnShipmentReturnOrderIdIdx: index("rs_roi_idx").on(
            table.returnOrderId
        ),
        deliveredOrderIdFK: foreignKey({
            columns: [table.deliveredOrderId],
            foreignColumns: [orderShipments.orderId],
            name: "delivered_order_id_fk",
        }).onDelete("cascade"),
    })
);

export const exchangeShipments = pgTable(
    "order_exchange_shipments",
    {
        id: uuid("id").primaryKey().notNull().unique().defaultRandom(),
        deliveredOrderId: text("delivered_order_id").notNull(),
        returnedOrderId: uuid("returned_order_id").notNull(),
        exchangeOrderId: text("exchange_order_id").notNull().unique(),
        srOrderId: bigint("sr_order_id", { mode: "number" }),
        srShipmentId: bigint("sr_shipment_id", { mode: "number" }),
        status: text("status"),
        awb: bigint("awb", { mode: "number" }),
        courierCompanyName: text("company_courier_name"),
        srResponse: jsonb("sr_response_json").default({}),
        ...timestamps,
    },
    (table) => ({
        exchangeShipmentDeliveredOrderIdIdx: index("es_doi_idx").on(
            table.deliveredOrderId
        ),
        exchangeShipmentReturnedOrderIdIdx: index("es_roi_idx").on(
            table.returnedOrderId
        ),
        deliveredOrderIdFK: foreignKey({
            columns: [table.deliveredOrderId],
            foreignColumns: [orderShipments.orderId],
            name: "delivered_order_id_fk",
        }).onDelete("cascade"),
        returnedOrderIdFK: foreignKey({
            columns: [table.returnedOrderId],
            foreignColumns: [returnShipments.id],
            name: "return_order_id_fk",
        }).onDelete("cascade"),
    })
);

export const orderShipmentsRelations = relations(
    orderShipments,
    ({ one, many }) => ({
        order: one(orders, {
            fields: [orderShipments.orderId],
            references: [orders.id],
        }),
        brand: one(brands, {
            fields: [orderShipments.brandId],
            references: [brands.id],
        }),
        items: many(orderShipmentItems),
    })
);

export const orderShipmentItemsRelations = relations(
    orderShipmentItems,
    ({ one }) => ({
        shipment: one(orderShipments, {
            fields: [orderShipmentItems.shipmentId],
            references: [orderShipments.id],
        }),
    })
);

export const returnShipmentsRelations = relations(
    returnShipments,
    ({ one }) => ({
        deliveredOrder: one(orderShipments, {
            fields: [returnShipments.deliveredOrderId],
            references: [orderShipments.orderId],
        }),
        exchange: one(exchangeShipments, {
            fields: [returnShipments.id],
            references: [exchangeShipments.returnedOrderId],
        }),
        item: one(returnItemDetails, {
            fields: [returnShipments.returnOrderId],
            references: [returnItemDetails.returnId],
        }),
        address: one(returnAddressDetails, {
            fields: [returnShipments.returnOrderId],
            references: [returnAddressDetails.returnId],
        }),
        payment: one(returnPaymentDetails, {
            fields: [returnShipments.returnOrderId],
            references: [returnPaymentDetails.returnId],
        }),
    })
);

export const exchangeShipmentsRelations = relations(
    exchangeShipments,
    ({ one }) => ({
        deliveredOrder: one(orderShipments, {
            fields: [exchangeShipments.deliveredOrderId],
            references: [orderShipments.orderId],
        }),
        returnedOrder: one(returnShipments, {
            fields: [exchangeShipments.returnedOrderId],
            references: [returnShipments.id],
        }),
    })
);

export const returnShipmentMediaRelation = relations(
    returnShipments,
    ({ many }) => ({
        mediaReturn: many(mediaReturnShipment),
    })
);

export const exchangeShipmentMediaRelation = relations(
    exchangeShipments,
    ({ many }) => ({
        mediaReturn: many(mediaExchangeShipment),
    })
);
