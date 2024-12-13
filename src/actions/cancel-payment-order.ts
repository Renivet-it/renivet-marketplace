"use server";

import { orderQueries } from "@/lib/db/queries";
import { auth } from "@clerk/nextjs/server";

export async function cancelPaymentOrder(orderId: string) {
    const { userId } = await auth();
    if (!userId) throw new Error("Unauthorized");

    const existingOrder = await orderQueries.getOrderById(orderId);
    if (!existingOrder) throw new Error("Order not found");
    if (existingOrder.userId !== userId)
        throw new Error("Order does not belong to user");

    await orderQueries.updateOrderStatus(existingOrder.id, {
        status: "cancelled",
        paymentId: null,
        paymentMethod: null,
        paymentStatus: "failed",
    });
}
