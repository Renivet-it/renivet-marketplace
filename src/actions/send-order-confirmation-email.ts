// File: /actions/send-order-confirmation-email.ts
"use server";

import { resend } from "@/lib/resend";
import { OrderPlaced } from "@/lib/resend/emails";
import { env } from "@/../env";
import { orderQueries } from "@/lib/db/queries";

export async function sendOrderConfirmationEmail({
    orderId,
    user,
}: {
    orderId: string;
    user: {
        id: string;
        email: string;
        firstName: string;
        lastName?: string;
    };
}) {
    try {
        console.log(`Fetching order for email with ID: ${orderId}`);
        const existingOrder = await orderQueries.getOrderById(orderId);
        if (!existingOrder) {
            throw new Error(`Order with ID ${orderId} not found`);
        }

        const emailData = {
            user: {
                name: `${user.firstName} ${user.lastName || ""}`.trim(),
            },
            order: {
                id: existingOrder.id,
                shipmentId: existingOrder.shipments?.[0]?.id || "",
                awb: existingOrder.shipments?.[0]?.awbNumber || "",
                amount: existingOrder.totalAmount,
                items: existingOrder.items.map((item) => ({
                    title: item.product.title,
                    slug: item.product.slug,
                    quantity: item.quantity,
                    price: item.variant?.price || item.product.price || 0,
                })),
            },
        };
        console.log(`Email data for order ${orderId}:`, emailData);

        console.log(`Sending email from: ${env.RESEND_EMAIL_FROM}`);
        console.log(`Sending email to: ${user.email}`);
        await resend.emails.send({
            from: env.RESEND_EMAIL_FROM,
            to: user.email,
            subject: "Order Placed Successfully",
            react: OrderPlaced(emailData),
        });

        return { success: true, message: "Order confirmation email sent successfully" };
    } catch (error) {
        console.error("Failed to send order confirmation email:", error);
        throw new Error(error instanceof Error ? error.message : "Failed to send email");
    }
}