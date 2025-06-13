import { relations } from "drizzle-orm";
import {
    date,
    foreignKey,
    integer,
    pgTable,
    text,
    uuid,
} from "drizzle-orm/pg-core";
import { timestamps } from "../helper";
import { brands } from "./brand";
import { returnShipments } from "./order-shipment";
import { users } from "./user";
import { reasonMasters } from "./reason";

export const returnItemDetails = pgTable(
    "order_return_item_details",
    {
        id: uuid("id").primaryKey().defaultRandom(),
        orderId: uuid("delivered_order_id"),
        returnId: text("return_id"),
        brandId: uuid("brand_id"),
        productName: text("product_name"),
        sku: text("sku"),
        units: integer("units"),
        sellingPrice: integer("selling_price"),
        ...timestamps,
    },
    (t) => [
        foreignKey({
            name: "return_item_details_return_id_fk",
            columns: [t.returnId],
            foreignColumns: [returnShipments.returnOrderId],
        }).onDelete("cascade"),
        foreignKey({
            name: "return_item_details_brand_id_fk",
            columns: [t.brandId],
            foreignColumns: [brands.id],
        }).onDelete("cascade"),
    ]
);

export const returnPaymentDetails = pgTable(
    "order_return_payment_details",
    {
        id: uuid("id").primaryKey().defaultRandom(),
        returnId: text("return_id"),
        userId: text("payment_refund_requested_user_id"),
        brandId: uuid("brand_id"),
        accountHolderName: text("account_holder_name"),
        accountNumber: text("account_number"),
        ifscCode: text("ifsc_code"),
        bankName: text("bank_name"),
        branch: text("branch"),
        paymentMethod: text("payment_method"),
        amount: integer("amount"),
        status: text("status"),
        transactionId: text("transaction_id"),
        transactionDate: date("transaction_date"),
        ...timestamps,
    },
    (t) => [
        foreignKey({
            name: "return_payment_details_return_id_fk",
            columns: [t.returnId],
            foreignColumns: [returnShipments.returnOrderId],
        }).onDelete("cascade"),
        foreignKey({
            name: "return_payment_details_brand_id_fk",
            columns: [t.brandId],
            foreignColumns: [brands.id],
        }).onDelete("cascade"),
        foreignKey({
            name: "return_payment_details_user_id_fk",
            columns: [t.userId],
            foreignColumns: [users.id],
        }).onDelete("cascade"),
    ]
);

export const returnAddressDetails = pgTable(
    "order_return_address_details",
    {
        id: uuid("id").primaryKey().defaultRandom(),
        returnId: text("return_id"),
        customerName: text("customer_name"),
        pickupAddress: text("pickup_address"),
        pickupCity: text("pickup_city"),
        pickupState: text("pickup_state"),
        pickupCountry: text("pickup_country"),
        pickupPincode: text("pickup_pincode"),
        pickupEmail: text("pickup_email"),
        pickupPhone: text("pickup_phone"),
        ...timestamps,
    },
    (t) => [
        foreignKey({
            name: "return_address_details_return_id_fk",
            columns: [t.returnId],
            foreignColumns: [returnShipments.returnOrderId],
        }).onDelete("cascade"),
    ]
);

export const returnReasonDetails = pgTable(
    "order_return_reason_details",
    {
        id: uuid("id").primaryKey().defaultRandom(),
        returnId: text("return_id"),
        subReasonId: uuid("sub_reason_id"),
        comment: text("comment"),
        ...timestamps,
    },
    (t) => [
        foreignKey({
            name: "return_reason_details_return_id_fk",
            columns: [t.returnId],
            foreignColumns: [returnShipments.returnOrderId],
        }).onDelete("cascade"),
        foreignKey({
            name: "return_reason_details_sub_reason_id_fk",
            columns: [t.subReasonId],
            foreignColumns: [reasonMasters.id],
        }).onDelete("cascade"),
    ]
);

export const returnPaymentDetailsRelations = relations(
    returnPaymentDetails,
    ({ one }) => ({
        brand: one(brands, {
            fields: [returnPaymentDetails.brandId],
            references: [brands.id],
        }),
        user: one(users, {
            fields: [returnPaymentDetails.userId],
            references: [users.id],
        }),
        returnShipment: one(returnShipments, {
            fields: [returnPaymentDetails.returnId],
            references: [returnShipments.returnOrderId],
        }),
    })
);

export const returnAddressDetailsRelations = relations(returnAddressDetails, ({ one }) => ({
    returnShipment: one(returnShipments, {
        fields: [returnAddressDetails.returnId],
        references: [returnShipments.returnOrderId],
    }),
}));

export const returnItemDetailsRelations = relations(returnItemDetails, ({ one }) => ({
    returnShipment: one(returnShipments, {
        fields: [returnItemDetails.returnId],
        references: [returnShipments.returnOrderId],
    }),
    brand: one(brands, {
        fields: [returnItemDetails.brandId],
        references: [brands.id],
    }),
}));

export const returnReasonDetailsRelations = relations(
  returnReasonDetails,
  ({ one }) => ({
    return: one(returnShipments, {
      fields: [returnReasonDetails.returnId],
      references: [returnShipments.returnOrderId],
    }),
    reason: one(reasonMasters, {
      fields: [returnReasonDetails.subReasonId],
      references: [reasonMasters.id],
    }),
  })
);
