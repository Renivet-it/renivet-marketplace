// File: /actions/process-order-after-payment.ts
"use server";

import { orderQueries, productQueries } from "@/lib/db/queries";
import { auth } from "@clerk/nextjs/server";

export async function processOrderAfterPayment({
    orderDetails,
    paymentId,
    orderIntentId,
}: {
    orderDetails: {
        razorpayOrderId: string;
        items: Array<{
            productId: string;
            variantId: string | null;
            sku: any;
            quantity: number;
            categoryId: string;
            price: number;
            brandId: string;
        }>;
    };
    paymentId: string;
    orderIntentId: string;
}) {
    try {
        const { userId } = await auth();

        // Update payment status in intent
        await orderQueries.updatePaymentStatus(orderIntentId, "paid", {
            paymentId: paymentId,
            paymentMethod: "razorpay", // Fixed typo from "razerpay"
        });
for (const item of orderDetails.items) {
    await productQueries.trackPurchase(
        item.productId,
        item.brandId,
        userId ?? undefined // Make sure you pass the actual userId from order
    );
}
        // Logic 2: Mark as paid
        console.log(`Updating order status to paid for order ${orderDetails.razorpayOrderId}`);
        try {
            await orderQueries.updateOrderStatus(orderDetails.razorpayOrderId, {
                paymentId,
                paymentMethod: "razorpay",
                paymentStatus: "paid",
                status: "processing",
            });
            console.log(`Order ${orderDetails.razorpayOrderId} marked as paid`);
        } catch (statusError) {
            console.error(`Failed to update order status for order ${orderDetails.razorpayOrderId}:`, statusError);
            throw new Error("Failed to update order payment status");
        }
    } catch (error) {
        console.error(`Failed to process order ${orderDetails.razorpayOrderId}:`, {
            error: error instanceof Error ? error.message : "Unknown error",
            stack: error instanceof Error ? error.stack : undefined,
        });
        throw error; // Re-throw to be handled by caller
    }
}