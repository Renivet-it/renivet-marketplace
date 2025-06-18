import { z } from "zod";

export const returnOrderPhaseOne = z.object({
    orderId: z.string().min(1, "order id is required"),
    reasonId: z.string().min(1, "Please select a reason before proceeding"),
    subReasonId: z.string().optional().default(""),
    comments: z.string().min(1, "Must provide a comment for better service"),
});

export const returnOrderPhaseTwo = z.object({
    customerName: z.string().min(1, "Please provide your name"),
    pickupAddress: z.string().min(1, "Please provide a pickup address"),
    pickupCity: z
        .string()
        .min(1, "Please provide the city to pick up the package"),
    pickupState: z
        .string()
        .min(1, "Please provide the state to pick up the package"),
    pickupCountry: z
        .string()
        .min(1, "Please provide the current country you are in"),
    pickupPincode: z
        .string()
        .min(
            1,
            "Please provide the postalcode of your area to pick up the package"
        ),
    pickupEmail: z.string().email("Please provide a valid email address"),
    pickupPhone: z.string().min(1, "Please provide a valid phone number"),
});

export const returnOrderPhaseThree = z.object({
    accountHolderName: z.string().min(1, "Please provide account holder name"),
    accountNumber: z.string().min(1, "Please provide account number"),
    ifscCode: z.string().min(1, "Please provide IFSC code"),
    bankName: z.string().min(1, "Please provide bank name"),
    branch: z.string().min(1, "Please provide bank branch name"),
});

export const returnOrderPayloadValidationSchema = returnOrderPhaseOne
    .extend(returnOrderPhaseTwo.shape)
    .extend(returnOrderPhaseThree.shape);

export type ReturnOrderPayload = z.infer<
    typeof returnOrderPayloadValidationSchema
>;
export type ReturnOrderPhaseOne = z.infer<typeof returnOrderPhaseOne>;
export type ReturnOrderPhaseTwo = z.infer<typeof returnOrderPhaseTwo>;
export type ReturnOrderPhaseThree = z.infer<typeof returnOrderPhaseThree>;
