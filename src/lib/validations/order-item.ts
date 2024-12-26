import { z } from "zod";

export const orderItemSchema = z.object({
    id: z
        .string({
            required_error: "ID is required",
            invalid_type_error: "ID must be a string",
        })
        .uuid("ID is invalid"),
    orderId: z
        .string({
            required_error: "Order ID is required",
            invalid_type_error: "Order ID must be a string",
        })
        .min(1, "Order ID is invalid"),
    sku: z
        .string({
            required_error: "SKU is required",
            invalid_type_error: "SKU must be a string",
        })
        .min(1, "SKU is invalid"),
    quantity: z
        .number({
            required_error: "Quantity is required",
            invalid_type_error: "Quantity must be a number",
        })
        .int("Quantity must be an integer")
        .positive("Quantity must be positive"),
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

export const createOrderItemSchema = orderItemSchema.omit({
    id: true,
    createdAt: true,
    updatedAt: true,
});

export type OrderItem = z.infer<typeof orderItemSchema>;
export type CreateOrderItem = z.infer<typeof createOrderItemSchema>;
