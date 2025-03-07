import { z } from "zod";

export const labelResponseSchema = z.object({
    label_created: z.number({
        invalid_type_error: "Label created must be a number",
    }),
    label_url: z
        .string({
            invalid_type_error: "Label URL must be a string",
        })
        .url("Invalid URL"),
    response: z.string({
        invalid_type_error: "Response must be a string",
    }),
    not_created: z.array(z.unknown()),
});

export type LabelResponse = z.infer<typeof labelResponseSchema>;
