import { z } from "zod";

const shipmentReturnItemSchema = z.object({
  name: z.string(),
  qc_enable: z.boolean(),
  qc_product_name: z.string(),
  sku: z.string(),
  units: z.number().int(),
  selling_price: z.number(),
  discount: z.number().optional(),
  qc_brand: z.string().optional(),
  qc_product_image: z.string().url().optional()
});

export const shipmentReturnPayload = z.object({
  order_id: z.string(),
  order_date: z.string(), // Or use z.coerce.date() if you want to parse it to Date
  channel_id: z.string().optional(),
  pickup_customer_name: z.string(),
  pickup_last_name: z.string().optional(),
  pickup_address: z.string(),
  pickup_address_2: z.string().optional(),
  pickup_city: z.string(),
  pickup_state: z.string(),
  pickup_country: z.string(),
  pickup_pincode: z.number().int(),
  pickup_email: z.string().email(),
  pickup_phone: z.string(),
  pickup_isd_code: z.string().optional(),
  shipping_customer_name: z.string(),
  shipping_last_name: z.string().optional(),
  shipping_address: z.string(),
  shipping_address_2: z.string().optional(),
  shipping_city: z.string(),
  shipping_country: z.string(),
  shipping_pincode: z.number().int(),
  shipping_state: z.string(),
  shipping_email: z.string().email().optional(),
  shipping_isd_code: z.string().optional(),
  shipping_phone: z.union([z.string(), z.number()]), // You had a number here
  order_items: z.array(shipmentReturnItemSchema),
  payment_method: z.enum(["PREPAID"]).default("PREPAID"), // Add more if needed
  total_discount: z.union([z.string(), z.number()]).optional(),
  sub_total: z.number(),
  length: z.number(),
  breadth: z.number(),
  height: z.number(),
  weight: z.number()
});

export type OrderReturnShiprockRequest = z.infer<typeof shipmentReturnPayload>;
