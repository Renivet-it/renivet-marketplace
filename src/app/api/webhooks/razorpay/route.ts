import crypto from "crypto";
import { env } from "@/../env";
import { orderQueries } from "@/lib/db/queries";
import { AppError, CResponse, handleError } from "@/lib/utils";
import { razorpayWebhookSchema } from "@/lib/validations";
import { NextRequest } from "next/server";

export async function POST(req: NextRequest) {
    try {
        const body = await req.text();
        const signature = req.headers.get("x-razorpay-signature");

        const secret = env.RAZOR_PAY_WEBHOOK_SECRET;

        const isValid = validateWebhookSignature(body, signature, secret);
        if (!isValid) throw new AppError("Invalid signature", "BAD_REQUEST");

        const payload = razorpayWebhookSchema.parse(JSON.parse(body));

        const orderId = payload.payload.payment.entity.order_id;

        const existingOrder = await orderQueries.getOrderById(orderId);
        if (!existingOrder) throw new AppError("Order not found", "NOT_FOUND");

        switch (payload.event) {
            case "payment.captured":
                await orderQueries.updateOrderStatus(existingOrder.id, {
                    paymentId: payload.payload.payment.entity.id,
                    paymentMethod: payload.payload.payment.entity.method,
                    paymentStatus: "paid",
                    status: "processing",
                });
                break;

            case "payment.failed":
                await orderQueries.updateOrderStatus(existingOrder.id, {
                    paymentId: payload.payload.payment.entity.id,
                    paymentMethod: payload.payload.payment.entity.method,
                    paymentStatus: "failed",
                    status: "pending",
                });
                break;
        }

        return CResponse({
            message: "OK",
        });
    } catch (err) {
        console.log(err);
        return handleError(err);
    }
}

function validateWebhookSignature(
    body: string,
    signature: string | null,
    secret: string | undefined
): boolean {
    if (!signature || !secret) return false;

    const expectedSignature = crypto
        .createHmac("sha256", secret)
        .update(body)
        .digest("hex");

    return crypto.timingSafeEqual(
        Buffer.from(signature),
        Buffer.from(expectedSignature)
    );
}
