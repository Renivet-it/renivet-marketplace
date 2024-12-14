import { z } from "zod";
import { brandSchema } from "./brand";
import { orderItemSchema } from "./order-item";
import { productSchema } from "./product";

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
    paymentStatus: z.enum(["pending", "paid", "failed"]),
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
        .string({
            required_error: "Tax Amount is required",
            invalid_type_error: "Tax Amount must be a number",
        })
        .refine((v) => !isNaN(parseFloat(v)), {
            message: "Tax Amount must be a number",
        }),
    deliveryAmount: z
        .string({
            required_error: "Delivery Amount is required",
            invalid_type_error: "Delivery Amount must be a number",
        })
        .refine((v) => !isNaN(parseFloat(v)), {
            message: "Delivery Amount must be a number",
        }),
    discountAmount: z
        .string({
            required_error: "Discount Amount is required",
            invalid_type_error: "Discount Amount must be a number",
        })
        .refine((v) => !isNaN(parseFloat(v)), {
            message: "Discount Amount must be a number",
        }),
    totalAmount: z
        .string({
            required_error: "Total Amount is required",
            invalid_type_error: "Total Amount must be a number",
        })
        .refine((v) => !isNaN(parseFloat(v)), {
            message: "Total Amount must be a number",
        }),
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
            product: productSchema.extend({
                price: z.number().nonnegative(),
                brand: brandSchema,
            }),
        })
    ),
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
