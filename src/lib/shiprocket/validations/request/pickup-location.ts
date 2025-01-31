import { z } from "zod";

export const pickupLocationSchema = z.object({
    pickup_location: z
        .string({
            required_error: "Pickup location is required",
            invalid_type_error: "Pickup location must be a string",
        })
        .max(36, { message: "Pickup location cannot exceed 36 characters" }),
    name: z.string({
        required_error: "Shipper's name is required",
        invalid_type_error: "Name must be a string",
    }),
    email: z
        .string({
            required_error: "Email is required",
            invalid_type_error: "Email must be a string",
        })
        .email({ message: "Invalid email format" }),
    phone: z
        .number({
            required_error: "Phone number is required",
            invalid_type_error: "Phone must be a number",
        })
        .int({ message: "Phone number must be an integer" }),
    address: z
        .string({
            required_error: "Address is required",
            invalid_type_error: "Address must be a string",
        })
        .max(80, { message: "Address cannot exceed 80 characters" }),
    address_2: z.string().optional(),
    city: z.string({
        required_error: "City is required",
        invalid_type_error: "City must be a string",
    }),
    state: z.string({
        required_error: "State is required",
        invalid_type_error: "State must be a string",
    }),
    country: z.string({
        required_error: "Country is required",
        invalid_type_error: "Country must be a string",
    }),
    pin_code: z
        .number({
            required_error: "PIN code is required",
            invalid_type_error: "PIN code must be a number",
        })
        .int({ message: "PIN code must be an integer" }),
    lat: z
        .number({
            invalid_type_error: "Latitude must be a number",
        })
        .optional(),
    long: z
        .number({
            invalid_type_error: "Longitude must be a number",
        })
        .optional(),
    address_type: z
        .string({
            invalid_type_error: "Address type must be a string",
        })
        .optional(),
    vendor_name: z
        .string({
            invalid_type_error: "Vendor name must be a string",
        })
        .optional(),
    gstin: z
        .string({
            invalid_type_error: "GSTIN must be a string",
        })
        .optional(),
});

export type PickupLocation = z.infer<typeof pickupLocationSchema>;
