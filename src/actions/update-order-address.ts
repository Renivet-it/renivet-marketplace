"use server";

import { orderQueries } from "@/lib/db/queries";
import { auth } from "@clerk/nextjs/server";

export async function updateOrderAddress({
    orderId,
    addressId,
}: {
    orderId: string;
    addressId: string;
}) {
    const { userId } = await auth();
    if (!userId) throw new Error("Unauthorized");

    const existingOrder = await orderQueries.getOrderById(orderId);
    if (!existingOrder) throw new Error("Order not found");
    if (existingOrder.userId !== userId)
        throw new Error("Order does not belong to user");

    const updatedOrder = await orderQueries.updateOrderAddress(
        existingOrder.id,
        addressId
    );

    return updatedOrder;
}
