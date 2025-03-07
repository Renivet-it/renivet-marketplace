import { z } from "zod";
import { orderItemSchema } from "./order-item";
import { orderShipmentSchema } from "./order-shipment";

export const orderShipmentItemSchema = z.object({
    id: z.string().uuid(),
    shipmentId: z
        .string({
            required_error: "Shipment ID is required",
            invalid_type_error: "Shipment ID must be a string",
        })
        .uuid("Shipment ID is invalid"),
    orderItemId: z
        .string({
            required_error: "Order Item ID is required",
            invalid_type_error: "Order Item ID must be a string",
        })
        .uuid("Order Item ID is invalid"),
    createdAt: z
        .union([z.string(), z.date()], {
            required_error: "Created at is required",
            invalid_type_error: "Created at must be a date",
        })
        .transform((v) => new Date(v)),
    updatedAt: z
        .union([z.string(), z.date()], {
            required_error: "Updated at is required",
            invalid_type_error: "Updated at must be a date",
        })
        .transform((v) => new Date(v)),
});

export const orderShipmentItemWithRelationsSchema =
    orderShipmentItemSchema.extend({
        shipment: orderShipmentSchema,
        orderItem: orderItemSchema,
    });

export const createOrderShipmentItemSchema = orderShipmentItemSchema.omit({
    id: true,
    createdAt: true,
    updatedAt: true,
});

export type OrderShipmentItem = z.infer<typeof orderShipmentItemSchema>;
export type OrderShipmentItemWithRelations = z.infer<
    typeof orderShipmentItemWithRelationsSchema
>;
export type CreateOrderShipmentItem = z.infer<
    typeof createOrderShipmentItemSchema
>;
