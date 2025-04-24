import { z } from "zod";

export interface getCouriersParams {
    type: "active" | "inactive" | "all";
}

// export interface GetCourierServiceabilityParams {
//     pickup_postcode: number; // required
//     delivery_postcode: number; // required
//     order_id?: number; // optional

//     // Conditional: required based on context
//     cod?: boolean; // 1 for COD, 0 for prepaid
//     weight?: string; // in kg

//     // Optional dimensions
//     length?: number; // in cm
//     breadth?: number; // in cm
//     height?: number; // in cm

//     declared_value?: number; // order price in INR

//     mode?: "Air" | "Surface"; // travel mode

//     is_return?: boolean; // 1 = return order

//     couriers_type?: boolean; // 1 to show only "document" couriers
//     only_local?: boolean; // 1 to show only hyperlocal couriers

//     qc_check?: boolean; // QC check (only if is_return = 1)
// }

export const GetCourierServiceabilitySchema = z.object({
    pickup_postcode: z.coerce.number(), // converts string -> number
    delivery_postcode: z.coerce.number(),
    order_id: z.coerce.number().optional(),

    cod: z.coerce.number().optional(),
    weight: z.coerce.number().optional(),

    length: z.coerce.number().optional(),
    breadth: z.coerce.number().optional(),
    height: z.coerce.number().optional(),

    declared_value: z.coerce.number().optional(),

    mode: z.enum(["Air", "Surface"]).optional(),

    is_return: z.coerce.number().optional(),
    couriers_type: z.coerce.number().optional(),
    only_local: z.coerce.number().optional(),
    qc_check: z.coerce.number().optional(),
});

export type GetCourierServiceabilityParams = z.infer<typeof GetCourierServiceabilitySchema>;