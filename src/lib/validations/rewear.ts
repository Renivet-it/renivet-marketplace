import { z } from "zod";

export const rewearPickupRequestSchema = z.object({
    id: z.string().uuid(),
    fullName: z.string().min(1),
    mobileNumber: z.string().min(10),
    locality: z.string().min(1),
    garmentCount: z.string().min(1),
    contactMethod: z.enum(["WhatsApp", "Phone call", "SMS"]),
    categoryNote: z.string().nullable(),
    consent: z.literal(true),
    createdAt: z.union([z.string(), z.date()]).transform((value) => new Date(value)),
    updatedAt: z.union([z.string(), z.date()]).transform((value) => new Date(value)),
});

export const createRewearPickupRequestSchema = z.object({
    fullName: z.string().trim().min(1, "Full name is required"),
    mobileNumber: z
        .string()
        .trim()
        .regex(/^[+\d][\d\s()-]{9,}$/, "Enter a valid mobile number"),
    locality: z.string().trim().min(1, "Locality or PIN code is required"),
    garmentCount: z.string().min(1, "Select an approximate garment count"),
    contactMethod: z.enum(["WhatsApp", "Phone call", "SMS"]),
    categoryNote: z.string().trim().max(500).optional(),
    consent: z.literal(true, {
        errorMap: () => ({ message: "Consent is required" }),
    }),
});

export type RewearPickupRequest = z.infer<typeof rewearPickupRequestSchema>;
export type CreateRewearPickupRequest = z.infer<
    typeof createRewearPickupRequestSchema
>;
