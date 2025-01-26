"use server";

import crypto from "crypto";
import { env } from "@/../env";
import { orderQueries } from "@/lib/db/queries";
import { RazorpayPaymentResponse } from "@/lib/validations";
import { auth } from "@clerk/nextjs/server";

export async function verifyPayment({
    razorpay_order_id,
    razorpay_payment_id,
    razorpay_signature,
}: RazorpayPaymentResponse) {
    const { userId } = await auth();
    if (!userId) throw new Error("Unauthorized");

    const secret = env.RAZOR_PAY_SECRET_KEY;

    const generated_signature = crypto
        .createHmac("sha256", secret)
        .update(`${razorpay_order_id}|${razorpay_payment_id}`)
        .digest("hex");

    if (generated_signature !== razorpay_signature)
        throw new Error("Invalid signature");

    const existingOrder = await orderQueries.getOrderById(razorpay_order_id);
    if (!existingOrder) throw new Error("Order not found");
    if (existingOrder.userId !== userId)
        throw new Error("Order does not belong to user");

    if (
        existingOrder.paymentStatus === "refund_pending" &&
        existingOrder.status === "cancelled"
    )
        throw new Error(
            "Order cancelled due to insufficient stock, refund pending"
        );

    if (
        existingOrder.paymentStatus === "failed" ||
        existingOrder.paymentStatus === "pending"
    )
        throw new Error("Payment not completed or failed");

    return existingOrder;
}
