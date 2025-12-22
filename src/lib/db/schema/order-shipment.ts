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
    returnReasonDetails,
} from "./order-return-exchange";
import { users } from "./user";
import { productTypes } from "./category";
import { products } from "./product";

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
        uploadWbn: text("upload_wbn"),
        delhiveryClientId: text("delhivery_client_id"),
        givenLength: integer("given_length"),
        givenWidth: integer("given_width"),
        givenHeight: integer("given_height"),
        delhiverySortCode: text("delhivery_sort_code"),
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
        delhiveryTrackingJson: jsonb("delhivery_tracking_json").default({}),
        is_return_label_generated: boolean("is_return_label_generated").default(false),
        is_replacement_label_generated: boolean("is_replacement_label_generated").default(false),
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
export const orderReturnRequests = pgTable(
    "order_return_requests",
    {
        id: uuid("id").primaryKey().defaultRandom(),
        orderId: text("order_id")
            .notNull()
            .references(() => orders.id, { onDelete: "cascade" }),

        orderItemId: uuid("order_item_id")
            .notNull()
            .references(() => orderItems.id, { onDelete: "cascade" }),

        brandId: uuid("brand_id")
            .notNull()
            .references(() => brands.id, { onDelete: "cascade" }),

        requestType: text("request_type", {
            enum: ["return", "replace"],
        }).notNull(),

        newVariantId: uuid("new_variant_id"), // only for replacement

        reason: text("reason"),
        comment: text("comment"),

        images: jsonb("images").default([]),

        status: text("status", {
            enum: ["pending", "approved", "rejected", "processing", "completed"],
        })
            .notNull()
            .default("pending"),

        ...timestamps,
    }
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
export const packingTypes = pgTable("packing_types", {
  id: uuid("id").defaultRandom().primaryKey(),

  // Packing Type Name
  name: text("hs_code"),

  // Base dimensions (cm)
  baseLength: integer("base_length").default(0),
  baseWidth: integer("base_width").default(0),
  baseHeight: integer("base_height").default(0),

  // Extra CM logic (0 for soft, 2 for box, 3 for fragile)
  extraCm: integer("extra_cm").default(0),

  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const brandProductTypePacking = pgTable(
  "brand_product_type_packing",
  {
    id: uuid("id").primaryKey().defaultRandom(),

    // 🔗 Relations
    brandId: uuid("brand_id")
      .notNull()
      .references(() => brands.id, { onDelete: "cascade" }),

    productTypeId: uuid("product_type_id")
      .notNull()
      .references(() => productTypes.id, { onDelete: "cascade" }),

    packingTypeId: uuid("packing_type_id")
      .references(() => packingTypes.id, { onDelete: "set null" }),

    // 🚚 Shipping flags
    isFragile: boolean("is_fragile").notNull().default(false),

    shipsInOwnBox: boolean("ships_in_own_box")
      .notNull()
      .default(false),

    canOverride: boolean("can_override")
      .notNull()
      .default(false),

    // 🕒 Meta
    createdAt: timestamp("created_at").defaultNow(),
    updatedAt: timestamp("updated_at").defaultNow(),
  },
  (table) => ({
    // 🚨 IMPORTANT: prevent duplicates
    brandProductTypeUniqueIdx: index(
      "brand_product_type_unique_idx"
    ).on(table.brandId, table.productTypeId),
  })
);

export const shipmentDiscrepancies = pgTable(
  "shipment_discrepancies",
  {
    id: uuid("id").defaultRandom().primaryKey(),

    orderId: text("order_id")
      .notNull()
      .references(() => orders.id, { onDelete: "cascade" }),

    productId: uuid("product_id")
      .notNull()
      .references(() => products.id, { onDelete: "cascade" }),

    brandId: uuid("brand_id")
      .notNull()
      .references(() => brands.id, { onDelete: "cascade" }),

    // 🔥 Brand packing rule used at shipment time
    brandPackingId: uuid("brand_packing_id")
      .references(() => brandProductTypePacking.id, { onDelete: "set null" }),

    actualWeight: integer("actual_weight").notNull(), // grams
    volumetricWeight: integer("volumetric_weight").notNull(),

    length: integer("length").notNull(),
    width: integer("width").notNull(),
    height: integer("height").notNull(),

    reason: text("reason").notNull(),
    rulesViolated: jsonb("rules_violated").notNull(),

    createdAt: timestamp("created_at").defaultNow(),
  }
);

export const shipmentDiscrepanciesRelations = relations(
  shipmentDiscrepancies,
  ({ one }) => ({
    order: one(orders, {
      fields: [shipmentDiscrepancies.orderId],
      references: [orders.id],
    }),

    product: one(products, {
      fields: [shipmentDiscrepancies.productId],
      references: [products.id],
    }),

    brand: one(brands, {
      fields: [shipmentDiscrepancies.brandId],
      references: [brands.id],
    }),

    brandProductTypePacking: one(brandProductTypePacking, {
      fields: [shipmentDiscrepancies.brandPackingId],
      references: [brandProductTypePacking.id],
    }),
  })
);


export const brandProductTypePackingRelations = relations(
  brandProductTypePacking,
  ({ one }) => ({
    brand: one(brands, {
      fields: [brandProductTypePacking.brandId],
      references: [brands.id],
    }),

    productType: one(productTypes, {
      fields: [brandProductTypePacking.productTypeId],
      references: [productTypes.id],
    }),

    packingType: one(packingTypes, {
      fields: [brandProductTypePacking.packingTypeId],
      references: [packingTypes.id],
    }),
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

export const orderReturnRequestsRelations = relations(
    orderReturnRequests,
    ({ one }) => ({
        order: one(orders, {
            fields: [orderReturnRequests.orderId],
            references: [orders.id],
        }),
        orderItem: one(orderItems, {
            fields: [orderReturnRequests.orderItemId],
            references: [orderItems.id],
        }),
        brand: one(brands, {
            fields: [orderReturnRequests.brandId],
            references: [brands.id],
        }),
    //         user: one(users, {
    //   fields: [orderReturnRequests.orderId],
    //   references: [orders.id],
    //   relationName: "returnRequestUser",
    // }),
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
        reasonDetail: one(returnReasonDetails, {
            fields: [returnShipments.returnOrderId],
            references: [returnReasonDetails.returnId],
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

export const packingTypesRelations = relations(
  packingTypes,
  ({ many }) => ({
    productTypes: many(productTypes),
  })
);
