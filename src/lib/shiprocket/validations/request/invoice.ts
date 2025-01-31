import { z } from "zod";

export const invoiceSchema = z.object({
    ids: z.array(
        z
            .number({
                required_error: "Shipment ID is required",
                invalid_type_error: "Shipment ID must be a number",
            })
            .int({ message: "Shipment ID must be an integer" })
    ),
});

export type Invoice = z.infer<typeof invoiceSchema>;
