import { z } from "zod";

const addressSchema = z.object({
    company_id: z.number({
        invalid_type_error: "Company ID must be a number",
    }),
    pickup_code: z.string({
        invalid_type_error: "Pickup code must be a string",
    }),
    address: z.string({
        invalid_type_error: "Address must be a string",
    }),
    address_2: z
        .string({
            invalid_type_error: "Address 2 must be a string",
        })
        .optional(),
    address_type: z.null().optional(),
    city: z.string({
        invalid_type_error: "City must be a string",
    }),
    state: z.string({
        invalid_type_error: "State must be a string",
    }),
    country: z.string({
        invalid_type_error: "Country must be a string",
    }),
    gstin: z
        .string({
            invalid_type_error: "GSTIN must be a string",
        })
        .nullable()
        .optional(),
    pin_code: z.string({
        invalid_type_error: "PIN code must be a string",
    }),
    phone: z.string({
        invalid_type_error: "Phone must be a string",
    }),
    email: z
        .string({
            invalid_type_error: "Email must be a string",
        })
        .email({ message: "Invalid email format" }),
    name: z.string({
        invalid_type_error: "Name must be a string",
    }),
    alternate_phone: z
        .string({
            invalid_type_error: "Alternate phone must be a string",
        })
        .nullable()
        .optional(),
    lat: z
        .number({
            invalid_type_error: "Latitude must be a number",
        })
        .nullable()
        .optional(),
    long: z
        .number({
            invalid_type_error: "Longitude must be a number",
        })
        .nullable()
        .optional(),
    status: z.number({
        invalid_type_error: "Status must be a number",
    }),
    phone_verified: z.number({
        invalid_type_error: "Phone verified must be a number",
    }),
    rto_address_id: z.number({
        invalid_type_error: "RTO address ID must be a number",
    }),
    extra_info: z.string({
        invalid_type_error: "Extra info must be a string",
    }),
    updated_at: z.string({
        invalid_type_error: "Updated at must be a string",
    }),
    created_at: z.string({
        invalid_type_error: "Created at must be a string",
    }),
    id: z.number({
        invalid_type_error: "ID must be a number",
    }),
});

export const pickupLocationResponseSchema = z.object({
    success: z.boolean({
        invalid_type_error: "Success must be a boolean",
    }),
    address: addressSchema,
    pickup_id: z.number({
        invalid_type_error: "Pickup ID must be a number",
    }),
    company_name: z.string({
        invalid_type_error: "Company name must be a string",
    }),
    full_name: z.string({
        invalid_type_error: "Full name must be a string",
    }),
});

export type PickupLocationResponse = z.infer<
    typeof pickupLocationResponseSchema
>;
