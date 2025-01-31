import { env } from "@/../env";
import { AppError, CResponse, handleError } from "@/lib/utils";
import { NextRequest } from "next/server";
import { z } from "zod";

const webhookResponse = z.object({
    awb: z
        .number({
            invalid_type_error: "AWB must be a number",
        })
        .int("AWB must be an integer"),
    current_status: z.string(),
    order_id: z.string(),
    current_timestamp: z.string(),
    etd: z.string(),
    current_status_id: z
        .number({
            invalid_type_error: "Current status ID must be a number",
        })
        .int("Current status ID must be an integer"),
    shipment_status: z.string(),
    shipment_status_id: z
        .number({
            invalid_type_error: "Shipment status ID must be a number",
        })
        .int("Shipment status ID must be an integer"),
    channel_order_id: z.string(),
    channel: z.string(),
    courier_name: z.string(),
    scans: z.array(
        z.object({
            date: z.string(),
            activity: z.string(),
            location: z.string(),
        })
    ),
});

export async function POST(req: NextRequest) {
    try {
        const reqApiKey = req.headers.get("x-api-key");
        if (reqApiKey !== env.SHIPROCKET_WEBHOOK_API_KEY)
            throw new AppError("Unauthorized", "UNAUTHORIZED");

        const payload = await req.json();

        console.log(payload);

        return CResponse({
            message: "OK",
        });
    } catch (err) {
        return handleError(err);
    }
}
