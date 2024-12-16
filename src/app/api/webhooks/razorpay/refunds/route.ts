import crypto from "crypto";
import { env } from "@/../env";
import { orderQueries, refundQueries } from "@/lib/db/queries";
import { AppError, CResponse, handleError } from "@/lib/utils";
import { razorPayRefundWebhookSchema } from "@/lib/validations";
import { NextRequest } from "next/server";

export async function POST(req: NextRequest) {
    try {
        const body = await req.text();
        const signature = req.headers.get("x-razorpay-signature");

        const secret = env.RAZOR_PAY_WEBHOOK_SECRET;

        const isValid = validateWebhookSignature(body, signature, secret);
        if (!isValid) throw new AppError("Invalid signature", "BAD_REQUEST");

        const payload = razorPayRefundWebhookSchema.parse(JSON.parse(body));

        const orderId = payload.payload.payment.entity.order_id;

        const existingOrder = await orderQueries.getOrderById(orderId);
        if (!existingOrder) throw new AppError("Order not found", "NOT_FOUND");

        switch (payload.event) {
            case "refund.processed":
                {
                    await Promise.all([
                        orderQueries.updateOrderStatus(existingOrder.id, {
                            paymentId: payload.payload.payment.entity.id,
                            paymentMethod:
                                payload.payload.payment.entity.method,
                            paymentStatus: "refunded",
                            status: "cancelled",
                        }),
                        refundQueries.updateRefundStatus(
                            payload.payload.refund.entity.id,
                            payload.payload.refund.entity.status
                        ),
                    ]);
                }
                break;

            case "refund.failed":
                {
                    await Promise.all([
                        orderQueries.updateOrderStatus(existingOrder.id, {
                            paymentId: payload.payload.payment.entity.id,
                            paymentMethod:
                                payload.payload.payment.entity.method,
                            paymentStatus: "refund_failed",
                            status: "cancelled",
                        }),
                        refundQueries.updateRefundStatus(
                            payload.payload.refund.entity.id,
                            payload.payload.refund.entity.status
                        ),
                    ]);
                }
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
