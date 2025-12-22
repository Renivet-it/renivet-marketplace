import { z } from "zod";
import { brandSchema } from "./brand";
import { orderSchema } from "./order";
import { is } from "drizzle-orm";

export const orderShipmentSchema = z.object({
    id: z.string().uuid(),
    orderId: z
        .string({
            required_error: "Order ID is required",
            invalid_type_error: "Order ID must be a string",
        })
        .min(1, "Order ID is invalid"),
    brandId: z
        .string({
            required_error: "Brand ID is required",
            invalid_type_error: "Brand ID must be a string",
        })
        .uuid("Brand ID is invalid"),
    shiprocketOrderId: z.number().nullable(), // Changed from string to number
    shiprocketShipmentId: z.number().nullable(), // Added new field
    uploadWbn: z.string().nullable().optional(), // Added new field
    delhiveryClientId: z.string().nullable().optional(),
    delhiverySortCode: z.string().nullable().optional(),
    delhiveryTrackingJson: z.object({}).nullable().default({}).optional(),
    courierCompanyId: z.number().nullable(), // Added new field
    courierName: z.string().nullable(), // Added new field
    awbNumber: z.string().nullable(),
    trackingNumber: z.string().nullable(),
    givenLength: z.number().nullable().optional(),
    givenWidth: z.number().nullable().optional(),
    givenHeight: z.number().nullable().optional(),
    status: z
        .enum(
            [
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
            {
                required_error: "Status is required",
            }
        )
        .default("pending"),
    shipmentDate: z
        .union([z.string(), z.date()], {
            required_error: "Shipment date is required",
            invalid_type_error: "Shipment date must be a date",
        })
        .transform((v) => new Date(v))
        .nullable(),
    estimatedDeliveryDate: z
        .union([z.string(), z.date()], {
            required_error: "Estimated delivery date is required",
            invalid_type_error: "Estimated delivery date must be a date",
        })
        .transform((v) => new Date(v))
        .nullable(),
    labelUrl: z.string().nullable(),
    manifestUrl: z.string().nullable(),
    invoiceUrl: z.string().nullable(),
    isPickupScheduled: z.boolean().default(false),
    pickupScheduledDate: z
        .union([z.string(), z.date()], {
            invalid_type_error: "Pickup scheduled date must be a date",
        })
        .transform((v) => new Date(v))
        .nullable(),
    pickupTokenNumber: z.string().nullable(),
    isAwbGenerated: z.boolean().default(false),
    isReturnLabelGenerated: z.boolean().default(false).nullable().optional(),
    isReplacementLabelGenerated: z.boolean().default(false).nullable().optional(),
    isRto: z.boolean().default(false).nullable().optional(),
    isRtoReturn: z.boolean().default(false),
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
        // awbDetailsShipRocketJson: z.object({}).nullable().default({}),
  awbDetailsShipRocketJson: z
    .object({
      awb_assign_status: z.number().optional(),
      no_pickup_popup: z.number().optional(),
      quick_pick: z.number().optional(),
      response: z
        .object({
          data: z
            .object({
              applied_weight: z.number().optional(),
              assigned_date_time: z
                .object({
                  date: z.string().optional(),
                  timezone: z.string().optional(),
                  timezone_type: z.number().optional(),
                })
                .optional(),
              awb_code: z.string().optional(),
              awb_code_status: z.number().optional(),
              child_courier_name: z.string().nullable().optional(),
              cod: z.number().optional(),
              company_id: z.number().optional(),
              courier_company_id: z.number().optional(),
              courier_name: z.string().optional(),
              freight_charges: z.number().optional(),
            })
            .optional(),
        })
        .optional(),
    })
    .nullable()
    .optional()
    .default({}),

});

export const orderShipmentWithRelationsSchema = orderShipmentSchema.extend({
    order: z.lazy(() => orderSchema),
    brand: brandSchema,
});

export const createOrderShipmentSchema = orderShipmentSchema.omit({
    id: true,
    shiprocketOrderId: true,
    awbNumber: true,
    uploadWbn: true,
     delhiveryClientId: true,
     delhiveryTrackingJson: true,
     delhiverySortCode: true,
        givenHeight: true,
        givenLength: true,
        givenWidth: true,
    trackingNumber: true,
    shipmentDate: true,
    estimatedDeliveryDate: true,
    labelUrl: true,
    manifestUrl: true,
    invoiceUrl: true,
    pickupScheduledDate: true,
    pickupTokenNumber: true,
    createdAt: true,
    updatedAt: true,
    awbDetailsShipRocketJson: true,
    isReturnLabelGenerated: true,
    isReplacementLabelGenerated: true,
    isRto: true,
});

export const updateOrderShipmentSchema = orderShipmentSchema.pick({
    shiprocketOrderId: true,
    shiprocketShipmentId: true,
    courierCompanyId: true,
    courierName: true,
    awbNumber: true,
    uploadWbn: true,
     delhiveryClientId: true,
     delhiveryTrackingJson: true,
     delhiverySortCode: true,
     givenHeight: true,
     givenLength: true,
     givenWidth: true,
    trackingNumber: true,
    status: true,
    shipmentDate: true,
    estimatedDeliveryDate: true,
    labelUrl: true,
    manifestUrl: true,
    invoiceUrl: true,
    isPickupScheduled: true,
    pickupScheduledDate: true,
    pickupTokenNumber: true,
    awbDetailsShipRocketJson: true,
    isReturnLabelGenerated: true,
    isReplacementLabelGenerated: true,
    isRto: true,
});

export type OrderShipment = z.infer<typeof orderShipmentSchema>;
export type OrderShipmentWithRelations = z.infer<
    typeof orderShipmentWithRelationsSchema
>;
export type CreateOrderShipment = z.infer<typeof createOrderShipmentSchema>;
export type UpdateOrderShipment = z.infer<typeof updateOrderShipmentSchema>;
