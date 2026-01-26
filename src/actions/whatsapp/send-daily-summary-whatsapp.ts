"use server";

import { sendPlainWhatsAppMessage } from "@/lib/whatsapp/index";

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

export async function sendDailyOrderSummaryWhatsApp({
    phoneNumber,
    data,
}: {
    phoneNumber: string;
    data: OrderSummaryData;
}) {
    try {
        const { statistics, orderCount, dateRange } = data;

        // Format dates
        const formatDate = (date: Date) => {
            return date.toLocaleDateString("en-IN", {
                month: "short",
                day: "numeric",
                year: "numeric",
                hour: "2-digit",
                minute: "2-digit",
            });
        };

        // Create the WhatsApp message with nice formatting
        const message = `📊 *DAILY ORDER SUMMARY*

📅 *Report Period*
${formatDate(dateRange.start)} - ${formatDate(dateRange.end)}

━━━━━━━━━━━━━━━━━━━━

📦 *ORDER STATISTICS*

📌 Total Orders: *${statistics.total}*
🔸 Ready to Pickup: ${statistics.ready_to_pickup}
🔸 Pickup Scheduled: ${statistics.pickup_scheduled}
🔸 Shipped: ${statistics.shipped}
✅ Delivered: ${statistics.delivered}
❌ Cancelled: ${statistics.cancelled}
🔄 RTO: ${statistics.rto}

━━━━━━━━━━━━━━━━━━━━

📈 *Orders in Last 24 Hours: ${orderCount}*

🔗 View detailed report in dashboard
${process.env.NEXT_PUBLIC_APP_URL || "https://renivet.com"}/dashboard/general/orders

---
🤖 This is an automated daily summary from Renivet`;

        console.log(`📱 Sending WhatsApp summary to: ${phoneNumber}`);

        const result = await sendPlainWhatsAppMessage({
            recipientPhoneNumber: phoneNumber,
            message,
        });

        console.log("✅ WhatsApp message sent successfully!");
        return result;
    } catch (error) {
        console.error("❌ Failed to send WhatsApp summary:", error);
        throw error;
    }
}
