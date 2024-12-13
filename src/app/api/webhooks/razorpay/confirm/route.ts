import crypto from "crypto";
import { env } from "@/../env";
import { orderQueries } from "@/lib/db/queries";
import { AppError, CResponse, handleError } from "@/lib/utils";
import { razorpayResponseSchema } from "@/lib/validations";
import { NextRequest } from "next/server";

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const payload = razorpayResponseSchema.parse(body);

        const secret = env.RAZOR_PAY_SECRET_KEY;

        const generated_signature = crypto
            .createHmac("sha256", secret)
            .update(
                `${payload.razorpay_order_id}|${payload.razorpay_payment_id}`
            )
            .digest("hex");

        if (generated_signature !== payload.razorpay_signature)
            throw new AppError("Invalid signature", "BAD_REQUEST");

        const existingOrder = await orderQueries.getOrderById(
            payload.razorpay_order_id
        );
        if (!existingOrder) throw new AppError("Order not found", "NOT_FOUND");
        if (existingOrder.paymentStatus !== "paid")
            throw new AppError(
                "Payment not completed or failed",
                "BAD_REQUEST"
            );

        return CResponse({
            message: "OK",
        });
    } catch (err) {
        return handleError(err);
    }
}
