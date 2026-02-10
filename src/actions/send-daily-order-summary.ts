// File: /actions/send-daily-order-summary.ts
"use server";

import { env } from "@/../env";
// DISABLED: WhatsApp temporarily disabled
// import { sendDailyOrderSummaryWhatsApp } from "@/actions/whatsapp/send-daily-summary-whatsapp";
import { orderQueries } from "@/lib/db/queries";
import { resend } from "@/lib/resend";
import { DailyOrderSummary } from "@/lib/resend/emails";

export async function sendDailyOrderSummary() {
    try {
        console.log("📧 Starting daily order summary email generation...");

        // Calculate the date range for the past 24 hours
        const endDate = new Date();
        const startDate = new Date(endDate.getTime() - 24 * 60 * 60 * 1000);

        console.log(
            `📅 Date Range: ${startDate.toISOString()} to ${endDate.toISOString()}`
        );

        // Fetch order status counts
        const statistics = await orderQueries.getOrderStatusCounts({
            startDate: startDate.toISOString(),
            endDate: endDate.toISOString(),
        });
        console.log("📊 Statistics fetched:", statistics);

        // Fetch all orders from the past 24 hours
        const ordersResponse = await orderQueries.getOrders({
            limit: 1000, // High limit to get all orders
            page: 1,
            startDate: startDate.toISOString(),
            endDate: endDate.toISOString(),
        });

        console.log(`📦 Total orders found: ${ordersResponse.count}`);

        // Format orders for email template with shipment data
        const formattedOrders = ordersResponse.data.map((order) => {
            const shipment = order.shipments?.[0];
            return {
                id: order.id,
                user: order.user
                    ? {
                          firstName: order.user.firstName,
                          lastName: order.user.lastName,
                      }
                    : undefined,
                status: order.status,
                shipmentStatus: shipment?.status,
                isPickupScheduled: shipment?.isPickupScheduled,
                totalAmount: order.totalAmount,
                createdAt: order.createdAt,
            };
        });

        // Prepare email data
        const emailData = {
            dateRange: {
                start: startDate,
                end: endDate,
            },
            statistics,
            orders: formattedOrders,
        };

        // Send email to configured recipients
        const recipients = [
            "akshay@renivet.com",
            "kriti@renivet.com",
            "ayanganguly333@gmail.com",
        ];

        console.log(`📨 Sending emails to: ${recipients.join(", ")}`);

        // Send email to all recipients
        const emailPromises = recipients.map((recipient) =>
            resend.emails.send({
                from: env.RESEND_EMAIL_FROM,
                to: recipient,
                subject: `Daily Order Summary - ${endDate.toLocaleDateString(
                    "en-IN",
                    {
                        year: "numeric",
                        month: "short",
                        day: "numeric",
                    }
                )}`,
                react: DailyOrderSummary(emailData),
            })
        );

        await Promise.all(emailPromises);

        console.log("✅ Daily order summary emails sent successfully!");

        // DISABLED: WhatsApp summaries temporarily disabled
        // TODO: Uncomment when WhatsApp template is working correctly
        // const whatsappRecipients = ["+917001047092"];
        // const whatsappData = {
        //     statistics: {
        //         total: statistics.all,
        //         ready_to_pickup: statistics.ready_to_pickup,
        //         pickup_scheduled: statistics.pickup_scheduled,
        //         shipped: statistics.shipped,
        //         delivered: statistics.delivered,
        //         cancelled: statistics.cancelled,
        //         rto: statistics.rto,
        //     },
        //     orderCount: ordersResponse.count,
        //     dateRange: {
        //         start: startDate,
        //         end: endDate,
        //     },
        //     orders: formattedOrders,
        // };
        // console.log(
        //     `📱 Sending WhatsApp summaries to: ${whatsappRecipients.join(", ")}`
        // );
        // try {
        //     const whatsappPromises = whatsappRecipients.map((phoneNumber) =>
        //         sendDailyOrderSummaryWhatsApp({
        //             phoneNumber,
        //             data: whatsappData,
        //         })
        //     );
        //     await Promise.all(whatsappPromises);
        //     console.log("✅ WhatsApp summaries sent successfully!");
        // } catch (whatsappError) {
        //     console.error(
        //         "⚠️ WhatsApp sending failed (continuing anyway):",
        //         whatsappError
        //     );
        // }

        return {
            success: true,
            message: `Daily order summary sent to ${recipients.length} email recipients`,
            count: ordersResponse.count,
            recipients: recipients.length,
        };
    } catch (error) {
        console.error("❌ Failed to send daily order summary:", error);
        return {
            success: false,
            error:
                error instanceof Error ? error.message : "Failed to send email",
        };
    }
}
