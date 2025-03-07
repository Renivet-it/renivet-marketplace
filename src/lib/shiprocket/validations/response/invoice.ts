import { z } from "zod";

export const invoiceResponseSchema = z.object({
    is_invoice_created: z.boolean({
        invalid_type_error: "Is invoice created must be a boolean",
    }),
    invoice_url: z
        .string({
            invalid_type_error: "Invoice URL must be a string",
        })
        .url("Invalid URL"),
    not_created: z.array(z.unknown()),
});

export type InvoiceResponse = z.infer<typeof invoiceResponseSchema>;
