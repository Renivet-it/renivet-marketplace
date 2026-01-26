// "use server";

// import { convertPaiseToRupees, formatPriceTag } from "@/lib/utils";
// import {
//     sendPlainWhatsAppMessage,
//     sendWhatsAppMessage,
// } from "@/lib/whatsapp/index";

// interface OrderSummaryData {
//     statistics: {
//         total: number;
//         ready_to_pickup: number;
//         pickup_scheduled: number;
//         shipped: number;
//         delivered: number;
//         cancelled: number;
//         rto: number;
//     };
//     orderCount: number;
//     dateRange: {
//         start: Date;
//         end: Date;
//     };
//     orders: Array<{
//         id: string;
//         user?: {
//             firstName: string;
//             lastName?: string | null;
//         };
//         status: string;
//         shipmentStatus?: string;
//         isPickupScheduled?: boolean;
//         totalAmount: number;
//         createdAt: Date;
//     }>;
// }

// // Function to determine detailed status
// const getDetailedStatus = (order: any): string => {
//     if (order.status === "delivered") return "Delivered";
//     if (order.status === "cancelled") return "Cancelled";

//     if (order.status === "pending") {
//         if (order.isPickupScheduled && order.shipmentStatus === "pending") {
//             return "Pickup Scheduled";
//         }
//         return "Ready to Pickup";
//     }

//     if (order.status === "processing") {
//         if (order.shipmentStatus === "pending") {
//             if (order.isPickupScheduled) {
//                 return "Pickup Scheduled";
//             }
//             return "Ready to Pickup";
//         }

//         if (
//             order.shipmentStatus === "in_transit" ||
//             order.shipmentStatus === "out_for_delivery"
//         ) {
//             return "Shipped";
//         }

//         if (order.shipmentStatus && order.shipmentStatus !== "pending") {
//             return "Shipped";
//         }

//         return "Ready to Pickup";
//     }

//     return order.status.charAt(0).toUpperCase() + order.status.slice(1);
// };

// export async function sendDailyOrderSummaryWhatsApp({
//     phoneNumber,
//     data,
// }: {
//     phoneNumber: string;
//     data: OrderSummaryData;
// }) {
//     try {
//         const { statistics, orderCount, dateRange, orders } = data;

//         // Format dates
//         const formatDate = (date: Date) => {
//             return date.toLocaleDateString("en-IN", {
//                 month: "short",
//                 day: "numeric",
//                 year: "numeric",
//                 hour: "2-digit",
//                 minute: "2-digit",
//             });
//         };

//         // MESSAGE 1: Statistics Summary (Using Approved Template)
//         console.log(
//             `📱 Sending WhatsApp summary (Part 1/2 - Template) to: ${phoneNumber}`
//         );

//         await sendWhatsAppMessage({
//             recipientPhoneNumber: phoneNumber,
//             templateName: "daily_order_summary",
//             languageCode: "en",
//             parameters: [
//                 formatDate(dateRange.start),
//                 formatDate(dateRange.end),
//                 statistics.total.toString(),
//                 statistics.ready_to_pickup.toString(),
//                 statistics.pickup_scheduled.toString(),
//                 statistics.shipped.toString(),
//                 statistics.delivered.toString(),
//                 statistics.cancelled.toString(),
//                 statistics.rto.toString(),
//                 orderCount.toString(),
//             ],
//         });

//         console.log("✅ Part 1 sent - Statistics summary (Template)");

//         // IMPORTANT: Returning here to prevent Message 2 from being sent
//         // WhatsApp requires plain text messages to be within 24-hour window of user's last message
//         // Only approved templates can be sent outside that window
//         console.log("✅ WhatsApp template sent successfully!");

//         // The code below is disabled due to WhatsApp 24-hour messaging window restriction
//         // eslint-disable-next-line no-unreachable

//         // MESSAGE 2: Order Details (Plain Text - Dynamic)
//         if (orders.length > 0) {
//             let orderDetailsMessage = "📋 *ORDER DETAILS (Last 24 Hours)*\n\n";

//             orders.forEach((order, index) => {
//                 const customerName = order.user
//                     ? `${order.user.firstName} ${order.user.lastName || ""}`.trim()
//                     : "N/A";
//                 const status = getDetailedStatus(order);
//                 const amount = formatPriceTag(
//                     +convertPaiseToRupees(order.totalAmount),
//                     true
//                 );

//                 orderDetailsMessage += `*${index + 1}. ${order.id}*\n`;
//                 orderDetailsMessage += `👤 ${customerName}\n`;
//                 orderDetailsMessage += `📦 ${status}\n`;
//                 orderDetailsMessage += `💰 ${amount}\n`;
//                 orderDetailsMessage += "\n";
//             });

//             orderDetailsMessage += "---\n🤖 Automated from Renivet";

//             console.log(
//                 `📱 Sending WhatsApp details (Part 2/2) to: ${phoneNumber}`
//             );

//             // Small delay to ensure messages arrive in order
//             await new Promise((resolve) => setTimeout(resolve, 1000));

//             await sendPlainWhatsAppMessage({
//                 recipientPhoneNumber: phoneNumber,
//                 message: orderDetailsMessage,
//             });

//             console.log("✅ Part 2 sent - Order details");
//         }

//         console.log("✅ WhatsApp hybrid messages sent successfully!");
//         return { success: true };
//     } catch (error) {
//         console.error("❌ Failed to send WhatsApp summary:", error);
//         throw error;
//     }
// }


"use server";

import { sendWhatsAppMessage } from "@/lib/whatsapp";

interface OrderSummaryData {
    statistics: {
        total: number;
        ready_to_pickup: number;
        pickup_scheduled: number;
        shipped: number;
        delivered: number;
        cancelled: number;
        rto: number;
    };
    orderCount: number;
    dateRange: {
        start: Date;
        end: Date;
    };
}

/**
 * Safe date formatter for WhatsApp template
 */
const formatDate = (date: Date) => {
    return date.toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
    });
};

export async function sendDailyOrderSummaryWhatsApp({
    phoneNumber,
    data,
}: {
    phoneNumber: string;
    data: OrderSummaryData;
}) {
    try {
        const { statistics, orderCount, dateRange } = data;

        console.log(
            `📱 Sending DAILY ORDER SUMMARY WhatsApp template to ${phoneNumber}`
        );

        /**
         * Template Parameters (STRICT ORDER)
         * {{1}} Start Date
         * {{2}} End Date
         * {{3}} Total Orders
         * {{4}} Ready to Pickup
         * {{5}} Pickup Scheduled
         * {{6}} Shipped
         * {{7}} Delivered
         * {{8}} Cancelled
         * {{9}} RTO
         * {{10}} New Orders (24h)
         */
        await sendWhatsAppMessage({
            recipientPhoneNumber: phoneNumber,
            templateName: "daily_order_summary_2",
            languageCode: "en",
            parameters: [
                formatDate(dateRange.start), // {{1}}
                formatDate(dateRange.end), // {{2}}
                statistics.total.toString(), // {{3}}
                statistics.ready_to_pickup.toString(), // {{4}}
                statistics.pickup_scheduled.toString(), // {{5}}
                statistics.shipped.toString(), // {{6}}
                statistics.delivered.toString(), // {{7}}
                statistics.cancelled.toString(), // {{8}}
                statistics.rto.toString(), // {{9}}
                orderCount.toString(), // {{10}}
            ],
        });

        console.log("✅ Daily order summary WhatsApp sent successfully");

        return {
            success: true,
            message: "Daily order summary WhatsApp sent",
        };
    } catch (error) {
        console.error("❌ WhatsApp daily summary failed:", error);
        throw error;
    }
}
