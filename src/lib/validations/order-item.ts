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
    productId: z
        .string({
            required_error: "Product ID is required",
            invalid_type_error: "Product ID must be a string",
        })
        .uuid("Product ID is invalid"),
    quantity: z
        .number({
            required_error: "Quantity is required",
            invalid_type_error: "Quantity must be a number",
        })
        .int("Quantity must be an integer")
        .positive("Quantity must be positive"),
    size: z.enum(["One Size", "XS", "S", "M", "L", "XL", "XXL"], {
        required_error: "Size is required",
        invalid_type_error: "Size must be a string",
    }),
    color: z
        .object({
            name: z
                .string({
                    required_error: "Color name is required",
                    invalid_type_error: "Color name must be a string",
                })
                .min(1, "Color name must be at least 1 characters long"),
            hex: z
                .string({
                    required_error: "Color hex is required",
                    invalid_type_error: "Color hex must be a string",
                })
                .length(7, "Color hex must be 7 characters long")
                .regex(/^#[0-9A-Fa-f]{6}$/, "Invalid hex color"),
        })
        .nullable(),
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
