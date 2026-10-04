// File: /actions/process-order-after-payment.ts
"use server";

import {
    orderQueries,
    paymentEventQueries,
    productQueries,
} from "@/lib/db/queries";
import { reconcilePaymentBinding } from "@/lib/payments/payment-reconciliation";
import { razorpay } from "@/lib/razorpay";
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
        if (!userId) throw new Error("Unauthorized");

        const existingOrder = await orderQueries.getOrderById(
            orderDetails.razorpayOrderId
        );
        if (!existingOrder) throw new Error("Order not found");
        if (existingOrder.userId !== userId) throw new Error("Forbidden");

        const providerPayment = await razorpay.payments.fetch(paymentId);
        const reconciledPayment = reconcilePaymentBinding({
            providerOrderId: providerPayment.order_id,
            expectedProviderOrderId: existingOrder.id,
            providerPaymentId: providerPayment.id,
            expectedPaymentId: existingOrder.paymentId,
            providerAmountPaise: Number(providerPayment.amount),
            expectedAmountPaise: Math.round(existingOrder.totalAmount * 100),
            providerCurrency: providerPayment.currency,
            expectedCurrency: "INR",
        });

        const eventClaim = await paymentEventQueries.claim({
            eventType: "payment.captured",
            providerPaymentId: reconciledPayment.providerPaymentId,
            providerOrderId: reconciledPayment.providerOrderId,
            orderId: existingOrder.id,
            orderIntentId,
            amountPaise: reconciledPayment.amountPaise,
            currency: reconciledPayment.currency,
            metadata: { source: "processOrderAfterPayment" },
        });

        if (!eventClaim.claimed) return;

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
        // Mark the server-bound order as paid only after provider reconciliation.
        console.log(`Updating order status to paid for order ${orderDetails.razorpayOrderId}`);
        try {
            await orderQueries.updateOrderStatus(orderDetails.razorpayOrderId, {
                paymentId: reconciledPayment.providerPaymentId,
                paymentMethod: "razorpay",
                paymentStatus: "paid",
                status: "processing",
            });
            await paymentEventQueries.markApplied(eventClaim.receipt.id);
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
