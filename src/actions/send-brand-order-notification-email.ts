"use server";

import { resend } from "@/lib/resend";
import { brandOrderNotification as BrandOrderNotification } from "@/lib/resend/emails";
import { env } from "@/../env";
import { orderQueries } from "@/lib/db/queries";
import { format } from "date-fns";

export async function sendBrandOrderNotificationEmail({
    orderId,
    brand,
}: {
    orderId: string;
    brand: {
        id: string;
        name: string;
        email: string;
        street: string;
        city: string;
        state: string;
        zip: string;
        country: string;
        customerName: string;
    };
}) {
    try {
        console.log(`Fetching order for brand email with ID: ${orderId}`);
        const existingOrder = await orderQueries.getOrderById(orderId);
        if (!existingOrder) {
            throw new Error(`Order with ID ${orderId} not found`);
        }

        // Get customer and address details
        // const existingAddress = existingOrder.user.addresses.find(
        //     (add) => add.id === existingOrder.addressId
        // );
        // if (!existingAddress) {
        //     throw new Error("Address not found for order");
        // }

        const emailData = {
            brand: {
                name: brand.name,
            },
            order: {
                id: existingOrder.id,
                date: format(new Date(), "MMMM d, yyyy"),
                customerName: brand.customerName,
                shippingAddress: {
                    street: brand.street,
                    city: brand.city,
                    state: brand.state,
                    zip: brand.zip,
                    country: "India",
                },
            items: existingOrder.items.map((item) => ({
                    title: item.product.title,
                    slug: item.product.slug,
                    quantity: item.quantity,
                    price: item.variant?.price || item.product.price || 0,
                })),
            },
        };
        console.log(`Email data for brand ${brand.name} for order ${orderId}:`, emailData);

        console.log(`Sending email from: ${env.RESEND_EMAIL_FROM}`);
        console.log(`Sending email to: ${brand.email}`);
        await resend.emails.send({
            from: env.RESEND_EMAIL_FROM,
            to: brand.email,
            subject: `New Order Received: ${orderId}`,
            react: BrandOrderNotification(emailData),
        });

        return { success: true, message: "Brand order notification email sent successfully" };
    } catch (error) {
        console.error(`Failed to send brand order notification email for order ${orderId}:`, error);
        throw new Error(error instanceof Error ? error.message : "Failed to send email");
    }
}