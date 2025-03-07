import { z } from "zod";

const assignedDateTimeSchema = z.object({
    date: z.string({
        invalid_type_error: "Date must be a string",
    }),
    timezone_type: z.number({
        invalid_type_error: "Timezone type must be a number",
    }),
    timezone: z.string({
        invalid_type_error: "Timezone must be a string",
    }),
});

const shippedBySchema = z.object({
    shipper_company_name: z.string({
        invalid_type_error: "Shipper company name must be a string",
    }),
    shipper_address_1: z.string({
        invalid_type_error: "Shipper address 1 must be a string",
    }),
    shipper_address_2: z.string({
        invalid_type_error: "Shipper address 2 must be a string",
    }),
    shipper_city: z.string({
        invalid_type_error: "Shipper city must be a string",
    }),
    shipper_state: z.string({
        invalid_type_error: "Shipper state must be a string",
    }),
    shipper_country: z.string({
        invalid_type_error: "Shipper country must be a string",
    }),
    shipper_postcode: z.string({
        invalid_type_error: "Shipper postcode must be a string",
    }),
    shipper_first_mile_activated: z.number({
        invalid_type_error: "Shipper first mile activated must be a number",
    }),
    shipper_phone: z.string({
        invalid_type_error: "Shipper phone must be a string",
    }),
    lat: z.string({
        invalid_type_error: "Latitude must be a string",
    }),
    long: z.string({
        invalid_type_error: "Longitude must be a string",
    }),
    shipper_email: z
        .string({
            invalid_type_error: "Shipper email must be a string",
        })
        .email({ message: "Invalid shipper email format" }),
    rto_company_name: z.string({
        invalid_type_error: "RTO company name must be a string",
    }),
    rto_address_1: z.string({
        invalid_type_error: "RTO address 1 must be a string",
    }),
    rto_address_2: z.string({
        invalid_type_error: "RTO address 2 must be a string",
    }),
    rto_city: z.string({
        invalid_type_error: "RTO city must be a string",
    }),
    rto_state: z.string({
        invalid_type_error: "RTO state must be a string",
    }),
    rto_country: z.string({
        invalid_type_error: "RTO country must be a string",
    }),
    rto_postcode: z.string({
        invalid_type_error: "RTO postcode must be a string",
    }),
    rto_phone: z.string({
        invalid_type_error: "RTO phone must be a string",
    }),
    rto_email: z
        .string({
            invalid_type_error: "RTO email must be a string",
        })
        .email({ message: "Invalid RTO email format" }),
});

const awbDataSchema = z.object({
    courier_company_id: z.number({
        invalid_type_error: "Courier company ID must be a number",
    }),
    awb_code: z.string({
        invalid_type_error: "AWB code must be a string",
    }),
    cod: z.number({
        invalid_type_error: "COD must be a number",
    }),
    order_id: z.number({
        invalid_type_error: "Order ID must be a number",
    }),
    shipment_id: z.number({
        invalid_type_error: "Shipment ID must be a number",
    }),
    awb_code_status: z.number({
        invalid_type_error: "AWB code status must be a number",
    }),
    assigned_date_time: assignedDateTimeSchema,
    applied_weight: z.number({
        invalid_type_error: "Applied weight must be a number",
    }),
    company_id: z.number({
        invalid_type_error: "Company ID must be a number",
    }),
    courier_name: z.string({
        invalid_type_error: "Courier name must be a string",
    }),
    child_courier_name: z
        .string({
            invalid_type_error: "Child courier name must be a string",
        })
        .nullable(),
    pickup_scheduled_date: z.string({
        invalid_type_error: "Pickup scheduled date must be a string",
    }),
    routing_code: z.string({
        invalid_type_error: "Routing code must be a string",
    }),
    rto_routing_code: z.string({
        invalid_type_error: "RTO routing code must be a string",
    }),
    invoice_no: z.string({
        invalid_type_error: "Invoice number must be a string",
    }),
    transporter_id: z.string({
        invalid_type_error: "Transporter ID must be a string",
    }),
    transporter_name: z.string({
        invalid_type_error: "Transporter name must be a string",
    }),
    shipped_by: shippedBySchema,
});

export const awbResponseSchema = z.object({
    awb_assign_status: z.number({
        invalid_type_error: "AWB assign status must be a number",
    }),
    response: z.object({
        data: awbDataSchema,
    }),
});

export type AWBResponse = z.infer<typeof awbResponseSchema>;
