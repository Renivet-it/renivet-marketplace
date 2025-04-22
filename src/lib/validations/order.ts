import { z } from "zod";
import { orderItemSchema } from "./order-item";
import { orderShipmentSchema } from "./order-shipment";
import { productVariantSchema, productWithBrandSchema } from "./product";
import { addressSchema } from "./address";

export const orderSchema = z.object({
    id: z
        .string({
            required_error: "ID is required",
            invalid_type_error: "ID must be a string",
        })
        .min(1, "ID is invalid"),
    userId: z
        .string({
            required_error: "User ID is required",
            invalid_type_error: "User ID must be a string",
        })
        .min(1, "User ID is invalid"),
    receiptId: z
        .string({
            required_error: "Receipt ID is required",
            invalid_type_error: "Receipt ID must be a string",
        })
        .min(1, "Receipt ID is invalid"),
    paymentMethod: z
        .string({
            required_error: "Payment Method is required",
            invalid_type_error: "Payment Method must be a string",
        })
        .min(1, "Payment Method is invalid")
        .nullable(),
    paymentId: z
        .string({
            required_error: "Payment ID is required",
            invalid_type_error: "Payment ID must be a string",
        })
        .min(1, "Payment ID is invalid")
        .nullable(),
    paymentStatus: z.enum([
        "pending",
        "paid",
        "failed",
        "refund_pending",
        "refunded",
        "refund_failed",
    ]),
    status: z.enum([
        "pending",
        "processing",
        "shipped",
        "delivered",
        "cancelled",
    ]),
    addressId: z
        .string({
            required_error: "Address ID is required",
            invalid_type_error: "Address ID must be a string",
        })
        .uuid("Address ID is invalid"),
    totalItems: z
        .number({
            required_error: "Total Items is required",
            invalid_type_error: "Total Items must be a number",
        })
        .int("Total Items must be an integer")
        .positive("Total Items must be a positive number"),
    taxAmount: z
        .union([z.string(), z.number()])
        .transform((val) => Number(val))
        .pipe(z.number().min(0, "Tax Amount must be a positive number")),
    deliveryAmount: z
        .union([z.string(), z.number()])
        .transform((val) => Number(val))
        .pipe(z.number().min(0, "Delivery Amount must be a positive number")),
    discountAmount: z
        .union([z.string(), z.number()])
        .transform((val) => Number(val))
        .pipe(z.number().min(0, "Discount Amount must be a positive number")),
    totalAmount: z
        .union([z.string(), z.number()])
        .transform((val) => Number(val))
        .pipe(z.number().min(0, "Total Amount must be a positive number")),
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

export const orderWithItemAndBrandSchema = orderSchema.extend({
    items: z.array(
        orderItemSchema.extend({
            product: productWithBrandSchema.omit({
                values: true,
                journey: true,
            }),
            variant: productVariantSchema.nullable(),
        })
    ),
    shipments: z.array(orderShipmentSchema),
    address: addressSchema
});

export const createOrderSchema = orderSchema.omit({
    status: true,
    paymentStatus: true,
    paymentId: true,
    createdAt: true,
    updatedAt: true,
});

export const updateOrderStatusSchema = orderSchema.pick({
    paymentId: true,
    paymentMethod: true,
    paymentStatus: true,
    status: true,
});

export type Order = z.infer<typeof orderSchema>;
export type OrderWithItemAndBrand = z.infer<typeof orderWithItemAndBrandSchema>;
export type CreateOrder = z.infer<typeof createOrderSchema>;
export type UpdateOrderStatus = z.infer<typeof updateOrderStatusSchema>;
