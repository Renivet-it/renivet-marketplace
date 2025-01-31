import { z } from "zod";

const orderItemSchema = z.object({
    name: z.string({
        required_error: "Product name is required",
        invalid_type_error: "Product name must be a string",
    }),
    sku: z.string({
        required_error: "SKU is required",
        invalid_type_error: "SKU must be a string",
    }),
    units: z
        .number({
            required_error: "Units are required",
            invalid_type_error: "Units must be a number",
        })
        .int({ message: "Units must be an integer" }),
    selling_price: z
        .number({
            required_error: "Selling price is required",
            invalid_type_error: "Selling price must be a number",
        })
        .int({ message: "Selling price must be an integer" }),
    discount: z
        .number({
            invalid_type_error: "Discount must be a number",
        })
        .int({ message: "Discount must be an integer" })
        .optional(),
    tax: z
        .number({
            invalid_type_error: "Tax must be a number",
        })
        .optional(),
    hsn: z
        .number({
            invalid_type_error: "HSN must be a number",
        })
        .int({ message: "HSN must be an integer" })
        .optional(),
});

export const orderSchema = z.object({
    order_id: z
        .string({
            required_error: "Order ID is required",
            invalid_type_error: "Order ID must be a string",
        })
        .max(50, { message: "Order ID cannot exceed 50 characters" }),
    order_date: z.string({
        required_error: "Order date is required",
        invalid_type_error: "Order date must be a string",
    }),
    pickup_location: z.string({
        required_error: "Pickup location is required",
        invalid_type_error: "Pickup location must be a string",
    }),
    channel_id: z
        .number({
            invalid_type_error: "Channel ID must be a number",
        })
        .int({ message: "Channel ID must be an integer" })
        .optional(),
    comment: z
        .string({
            invalid_type_error: "Comment must be a string",
        })
        .optional(),
    reseller_name: z
        .string({
            invalid_type_error: "Reseller name must be a string",
        })
        .optional(),
    company_name: z
        .string({
            invalid_type_error: "Company name must be a string",
        })
        .optional(),
    billing_customer_name: z.string({
        required_error: "Billing customer name is required",
        invalid_type_error: "Billing customer name must be a string",
    }),
    billing_last_name: z
        .string({
            invalid_type_error: "Billing last name must be a string",
        })
        .optional(),
    billing_address: z.string({
        required_error: "Billing address is required",
        invalid_type_error: "Billing address must be a string",
    }),
    billing_address_2: z
        .string({
            invalid_type_error: "Billing address 2 must be a string",
        })
        .optional(),
    billing_city: z
        .string({
            required_error: "Billing city is required",
            invalid_type_error: "Billing city must be a string",
        })
        .max(30, { message: "Billing city cannot exceed 30 characters" }),
    billing_pincode: z
        .number({
            required_error: "Billing pincode is required",
            invalid_type_error: "Billing pincode must be a number",
        })
        .int({ message: "Billing pincode must be an integer" }),
    billing_state: z.string({
        required_error: "Billing state is required",
        invalid_type_error: "Billing state must be a string",
    }),
    billing_country: z.string({
        required_error: "Billing country is required",
        invalid_type_error: "Billing country must be a string",
    }),
    billing_email: z
        .string({
            required_error: "Billing email is required",
            invalid_type_error: "Billing email must be a string",
        })
        .email({ message: "Invalid billing email format" }),
    billing_phone: z
        .number({
            required_error: "Billing phone is required",
            invalid_type_error: "Billing phone must be a number",
        })
        .int({ message: "Billing phone must be an integer" }),
    billing_alternate_phone: z
        .number({
            invalid_type_error: "Billing alternate phone must be a number",
        })
        .int({ message: "Billing alternate phone must be an integer" })
        .optional(),
    shipping_is_billing: z.boolean({
        required_error: "Shipping is billing flag is required",
        invalid_type_error: "Shipping is billing must be a boolean",
    }),
    shipping_customer_name: z
        .string({
            invalid_type_error: "Shipping customer name must be a string",
        })
        .optional(),
    shipping_last_name: z
        .string({
            invalid_type_error: "Shipping last name must be a string",
        })
        .optional(),
    shipping_address: z
        .string({
            invalid_type_error: "Shipping address must be a string",
        })
        .optional(),
    shipping_address_2: z
        .string({
            invalid_type_error: "Shipping address 2 must be a string",
        })
        .optional(),
    billing_isd_code: z
        .string({
            invalid_type_error: "Billing ISD code must be a string",
        })
        .optional(),
    shipping_city: z
        .string({
            invalid_type_error: "Shipping city must be a string",
        })
        .optional(),
    shipping_pincode: z
        .number({
            invalid_type_error: "Shipping pincode must be a number",
        })
        .int({ message: "Shipping pincode must be an integer" })
        .optional(),
    shipping_country: z
        .string({
            invalid_type_error: "Shipping country must be a string",
        })
        .optional(),
    shipping_state: z
        .string({
            invalid_type_error: "Shipping state must be a string",
        })
        .optional(),
    shipping_email: z
        .string({
            invalid_type_error: "Shipping email must be a string",
        })
        .email({ message: "Invalid shipping email format" })
        .optional(),
    shipping_phone: z
        .number({
            invalid_type_error: "Shipping phone must be a number",
        })
        .int({ message: "Shipping phone must be an integer" })
        .optional(),
    longitude: z
        .number({
            invalid_type_error: "Longitude must be a number",
        })
        .optional(),
    latitude: z
        .number({
            invalid_type_error: "Latitude must be a number",
        })
        .optional(),
    order_items: z.array(orderItemSchema),
    payment_method: z.enum(["COD", "Prepaid"], {
        required_error: "Payment method is required",
        invalid_type_error: "Payment method must be either COD or Prepaid",
    }),
    shipping_charges: z
        .number({
            invalid_type_error: "Shipping charges must be a number",
        })
        .int({ message: "Shipping charges must be an integer" })
        .optional(),
    giftwrap_charges: z
        .number({
            invalid_type_error: "Giftwrap charges must be a number",
        })
        .int({ message: "Giftwrap charges must be an integer" })
        .optional(),
    transaction_charges: z
        .number({
            invalid_type_error: "Transaction charges must be a number",
        })
        .int({ message: "Transaction charges must be an integer" })
        .optional(),
    total_discount: z
        .number({
            invalid_type_error: "Total discount must be a number",
        })
        .int({ message: "Total discount must be an integer" })
        .optional(),
    sub_total: z
        .number({
            required_error: "Sub total is required",
            invalid_type_error: "Sub total must be a number",
        })
        .int({ message: "Sub total must be an integer" }),
    length: z
        .number({
            required_error: "Length is required",
            invalid_type_error: "Length must be a number",
        })
        .min(0.5, { message: "Length must be more than 0.5" }),
    breadth: z
        .number({
            required_error: "Breadth is required",
            invalid_type_error: "Breadth must be a number",
        })
        .min(0.5, { message: "Breadth must be more than 0.5" }),
    height: z
        .number({
            required_error: "Height is required",
            invalid_type_error: "Height must be a number",
        })
        .min(0.5, { message: "Height must be more than 0.5" }),
    weight: z
        .number({
            required_error: "Weight is required",
            invalid_type_error: "Weight must be a number",
        })
        .min(0, { message: "Weight must be more than 0" }),
    ewaybill_no: z
        .string({
            invalid_type_error: "Ewaybill number must be a string",
        })
        .optional(),
    customer_gstin: z
        .string({
            invalid_type_error: "Customer GSTIN must be a string",
        })
        .optional(),
    invoice_number: z
        .string({
            invalid_type_error: "Invoice number must be a string",
        })
        .optional(),
    order_type: z
        .enum(["ESSENTIALS", "NON ESSENTIALS"], {
            invalid_type_error:
                "Order type must be either ESSENTIALS or NON ESSENTIALS",
        })
        .optional(),
    checkout_shipping_method: z
        .enum(["SR_RUSH", "SR_STANDARD", "SR_EXPRESS", "SR_QUICK"], {
            invalid_type_error: "Invalid shipping method",
        })
        .optional(),
    what3words_address: z
        .string({
            invalid_type_error: "What3words address must be a string",
        })
        .optional(),
    is_insurance_opt: z
        .boolean({
            invalid_type_error: "Insurance opt must be a boolean",
        })
        .optional(),
    is_document: z
        .number({
            invalid_type_error: "Is document must be a number",
        })
        .int({ message: "Is document must be 0 or 1" })
        .min(0)
        .max(1)
        .optional(),
});

export type Order = z.infer<typeof orderSchema>;
