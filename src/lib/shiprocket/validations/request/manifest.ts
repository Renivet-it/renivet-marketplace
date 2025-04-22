import { z } from "zod";

export const generateManifestSchema = z.object({
    shipment_id: z.array(
        z
            .number({
                required_error: "Shipment ID is required",
                invalid_type_error: "Shipment ID must be a number",
            })
            .int({ message: "Shipment ID must be an integer" })
    ),
});

export const printManifestSchema = z.object({
    order_ids: z
        .array(
            z.number({
                required_error: "Order IDs are required",
                invalid_type_error: "Order IDs must be numbers",
            })
        )
        .min(1, "At least one order ID is required"),
});

export type GenerateManifest = z.infer<typeof generateManifestSchema>;
export type PrintManifest = z.infer<typeof printManifestSchema>;
