// File: /actions/process-order-after-payment.ts
"use server";

import { orderQueries, productQueries } from "@/lib/db/queries";

export async function processOrderAfterPayment({
    orderDetails,
    paymentId,
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
}) {
    try {
        // Logic 1: Minus the stock
        console.log(`Checking and updating stock for order ${orderDetails.razorpayOrderId}`);
        // const stockUpdates = orderDetails.items.map((item) => ({
        //     productId: item.productId,
        //     variantId: item.variantId ?? undefined, // Convert null to undefined
        //     quantity: item.quantity, // Amount to deduct
        // }));

        // try {
        //     await productQueries.updateProductStock(stockUpdates);
        //     console.log(`Stock updated successfully for order ${orderDetails.razorpayOrderId}`);
        // } catch (stockError) {
        //     console.error(`Failed to update stock for order ${orderDetails.razorpayOrderId}:`, stockError);
        //     throw new Error("Failed to update product stock");
        // }

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