import { z } from "zod";

export const returnShipmentSchema = z.object({
    deliveredOrderId: z.string(),
    returnOrderId: z.string(),
    srOrderId: z.number().optional(),
    srShipmentId: z.number().optional(),
    status: z.string().optional(),
    rtoExchangeType: z.boolean().optional(),
    awb: z.number().optional(),
    courierCompanyName: z.string().optional(),
    srResponse: z.record(z.any()).optional(),
    isPayable: z.boolean()
});

export const returnShipmentAddressSchema = z.object({
    returnId: z.string(),
    customerName: z.string(),
    pickupAddress: z.string(),
    pickupCity: z.string(),
    pickupState: z.string(),
    pickupCountry: z.string(),
    pickupPincode: z.string(),
    pickupEmail: z.string(),
    pickupPhone: z.string(),
});

export const returnShipmentItemSchema = z.object({
    orderId: z.string(),
    returnId: z.string(),
    brandId: z.string(),
    productName: z.string(),
    sku: z.string(),
    units: z.number(),
    sellingPrice: z.number(),
});

export const returnShipmentPaymentSchema = z.object({
    returnId: z.string(),
    userId: z.string(),
    brandId: z.string(),
    accountHolderName: z.string(),
    accountNumber: z.string(),
    ifscCode: z.string(),
    bankName: z.string(),
    branch: z.string(),
    paymentMethod: z.string().optional(),
    amount: z.number().optional(),
    status: z.string().optional(),
    transactionId: z.string().optional(),
    transactionDate: z
        .string()
        .optional()
        .refine((val) => !val || /^\d{4}-\d{2}-\d{2}$/.test(val), {
            message: "Date must be in YYYY-MM-DD format",
        }),
});

export const returnShipmentReasonSchema = z.object({
    returnId: z.string(),
    subReasonId: z.string(),
    comment: z.string(),
});

export type returnShipment = z.infer<typeof returnShipmentSchema>;
export type returnShipmentAddress = z.infer<typeof returnShipmentAddressSchema>;
export type returnShipmentItem = z.infer<typeof returnShipmentItemSchema>;
export type returnShipmentPayment = z.infer<typeof returnShipmentPaymentSchema>;
export type returnShipmentReason = z.infer<typeof returnShipmentReasonSchema>;
