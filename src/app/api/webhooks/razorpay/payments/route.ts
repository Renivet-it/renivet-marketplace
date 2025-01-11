import crypto from "crypto";
import { env } from "@/../env";
import { orderQueries, productQueries, refundQueries } from "@/lib/db/queries";
import { razorpay } from "@/lib/razorpay";
import {
    AppError,
    convertPaiseToRupees,
    CResponse,
    handleError,
} from "@/lib/utils";
import { razorpayPaymentWebhookSchema } from "@/lib/validations";
import { NextRequest } from "next/server";

export async function POST(req: NextRequest) {
    try {
        const body = await req.text();
        const signature = req.headers.get("x-razorpay-signature");

        const secret = env.RAZOR_PAY_WEBHOOK_SECRET;

        const isValid = validateWebhookSignature(body, signature, secret);
        if (!isValid) throw new AppError("Invalid signature", "BAD_REQUEST");

        const payload = razorpayPaymentWebhookSchema.parse(JSON.parse(body));

        const orderId = payload.payload.payment.entity.order_id;

        const existingOrder = await orderQueries.getOrderById(orderId);
        if (!existingOrder) throw new AppError("Order not found", "NOT_FOUND");

        switch (payload.event) {
            case "payment.captured":
                {
                    // const isStockAvailable = existingOrder.items.every(
                    //     (item) => {
                    //         const quantity = item.quantity;
                    //         const stock = item.productVariant.quantity;
                    //         return (
                    //             stock >= quantity &&
                    //             !item.product.isDeleted &&
                    //             item.product.isAvailable &&
                    //             item.productVariant.isAvailable &&
                    //             !item.productVariant.isDeleted
                    //         );
                    //     }
                    // );
                    // if (!isStockAvailable) {
                    //     await orderQueries.updateOrderStatus(existingOrder.id, {
                    //         paymentId: payload.payload.payment.entity.id,
                    //         paymentMethod:
                    //             payload.payload.payment.entity.method,
                    //         paymentStatus: "refund_pending",
                    //         status: "cancelled",
                    //     });
                    //     const rzpRefund = await razorpay.payments.refund(
                    //         payload.payload.payment.entity.id,
                    //         {
                    //             amount: payload.payload.payment.entity.amount,
                    //         }
                    //     );
                    //     await refundQueries.createRefund({
                    //         id: rzpRefund.id,
                    //         userId: existingOrder.userId,
                    //         orderId: existingOrder.id,
                    //         paymentId: payload.payload.payment.entity.id,
                    //         status: "pending",
                    //         amount: convertPaiseToRupees(
                    //             payload.payload.payment.entity.amount
                    //         ),
                    //     });
                    //     throw new Error(
                    //         "Insufficient stock for one or more items"
                    //     );
                    // }
                    // const updateProductStockData = existingOrder.items.map(
                    //     (item) => {
                    //         const quantity = item.quantity;
                    //         const stock = item.productVariant.quantity;
                    //         const updatedQuantity = stock - quantity;
                    //         return {
                    //             sku: item.productVariant.sku,
                    //             quantity: updatedQuantity,
                    //         };
                    //     }
                    // );
                    // await productQueries.updateProductStock(
                    //     updateProductStockData
                    // );
                    // await orderQueries.updateOrderStatus(existingOrder.id, {
                    //     paymentId: payload.payload.payment.entity.id,
                    //     paymentMethod: payload.payload.payment.entity.method,
                    //     paymentStatus: "paid",
                    //     status: "processing",
                    // });
                }
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
