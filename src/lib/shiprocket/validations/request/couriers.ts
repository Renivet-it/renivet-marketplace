import { z } from "zod";

export interface getCouriersParams {
    type: "active" | "inactive" | "all";
}


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

export const postShipmentPickupSchema = z.object({
    shipment_id: z.coerce.number(),
    status: z.coerce.string().optional(),
    pickup_date: z.coerce.date().optional(),
});

export type GetCourierServiceabilityParams = z.infer<typeof GetCourierServiceabilitySchema>;
export type PostShipmentPickupBody = z.infer<typeof postShipmentPickupSchema>;