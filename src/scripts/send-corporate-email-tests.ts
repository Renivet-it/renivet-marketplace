import "dotenv/config";

import { getAbsoluteURL } from "@/lib/utils";
import { resend } from "@/lib/resend";
import { env } from "@/../env";
import CorporateOrderBalanceReminderEmail from "@/lib/resend/emails/corporate-order-balance-reminder";
import CorporateOrderCustomerReadyForDispatchEmail from "@/lib/resend/emails/corporate-order-customer-ready-for-dispatch";
import CorporateOrderInternalNotificationEmail from "@/lib/resend/emails/corporate-order-internal-notification";
import CorporateOrderReadyForDispatchEmail from "@/lib/resend/emails/corporate-order-ready-for-dispatch";
import CorporateOrderReceivedEmail from "@/lib/resend/emails/corporate-order-received";
import CorporateOrderDeliveredEmail from "@/lib/resend/emails/corporate-order-delivered";

type EmailVariant = {
    key: string;
    subject: string;
    react: ReturnType<typeof CorporateOrderReceivedEmail>;
};

function parseArgs(argv: string[]) {
    let to = "ayanganguly333@gmail.com";

    for (const arg of argv) {
        if (arg.startsWith("--to=")) {
            to = arg.slice("--to=".length).trim() || to;
        }
    }

    return { to };
}

function buildVariants(): EmailVariant[] {
    const order = {
        id: "test-corporate-order-id",
        publicOrderId: "REN-CORP-TEST-001",
        companyName: "Renivet Test Company",
        contactPersonName: "Ayan Ganguly",
        emailAddress: "ayanganguly333@gmail.com",
        quantity: 120,
        totalPaise: 149900,
        advancePaidPaise: 50000,
        balanceDuePaise: 99900,
        status: "inquiry_received",
        paymentReference: "TEST-PAY-001",
        artworkFile: {
            url: "https://renivet.com/test-assets/corporate-artwork.pdf",
        },
        employeeSheetFile: {
            url: "https://renivet.com/test-assets/employee-size-sheet.xlsx",
        },
    };

    const confirmationHref = getAbsoluteURL(
        "/corporate-orders/confirmation/test-corporate-order-id"
    );
    const pdfHref = getAbsoluteURL(
        "/api/corporate-orders/test-corporate-order-id/summary"
    );
    const adminHref = getAbsoluteURL(
        "/dashboard/general/corporate-orders/test-corporate-order-id"
    );
    const paymentHref = getAbsoluteURL(
        "/corporate-orders/confirmation/test-corporate-order-id"
    );

    return [
        {
            key: "customer-order-confirmed",
            subject: `[Test] Corporate Order Received: ${order.publicOrderId}`,
            react: CorporateOrderReceivedEmail({
                order,
                confirmationHref,
                pdfHref,
                expectedTimelineText:
                    "10-15 business days from approval and artwork confirmation.",
            }),
        },
        {
            key: "internal-new-order",
            subject: `[Test] New Corporate Order: ${order.publicOrderId}`,
            react: CorporateOrderInternalNotificationEmail({
                order,
                adminHref,
            }),
        },
        {
            key: "customer-ready-for-dispatch",
            subject: `[Test] Your order is ready for dispatch: ${order.publicOrderId}`,
            react: CorporateOrderCustomerReadyForDispatchEmail({
                order: {
                    publicOrderId: order.publicOrderId,
                    companyName: order.companyName,
                    totalPaise: order.totalPaise,
                    advancePaidPaise: order.advancePaidPaise,
                    balanceDuePaise: order.balanceDuePaise,
                    quantity: order.quantity,
                },
                confirmationHref,
                pdfHref,
            }),
        },
        {
            key: "admin-ready-for-dispatch",
            subject: `[Test] Dispatch ready: ${order.publicOrderId}`,
            react: CorporateOrderReadyForDispatchEmail({
                order: {
                    publicOrderId: order.publicOrderId,
                    companyName: order.companyName,
                    quantity: order.quantity,
                    totalPaise: order.totalPaise,
                    advancePaidPaise: order.advancePaidPaise,
                    balanceDuePaise: order.balanceDuePaise,
                    status: "ready_for_dispatch",
                    quoteNumber: "QUO-TEST-001",
                    brandName: "Renivet Test Brand",
                },
                adminHref,
            }),
        },
        {
            key: "customer-balance-reminder",
            subject: `[Test] Balance payment reminder: ${order.publicOrderId}`,
            react: CorporateOrderBalanceReminderEmail({
                order,
                paymentHref,
            }),
        },
        {
            key: "customer-order-delivered",
            subject: `[Test] Corporate Order Delivered: ${order.publicOrderId}`,
            react: CorporateOrderDeliveredEmail({
                order,
                confirmationHref,
                pdfHref,
            }),
        },
    ];
}

async function main() {
    const { to } = parseArgs(process.argv.slice(2));
    const variants = buildVariants();

    console.log(`Sending ${variants.length} corporate email test(s) to ${to}...`);

    for (const variant of variants) {
        console.log(`- Sending ${variant.key}`);
        const result = await resend.emails.send({
            from: env.RESEND_EMAIL_FROM,
            to,
            subject: variant.subject,
            react: variant.react,
        });

        if ((result as { error?: unknown }).error) {
            throw new Error(
                `Failed while sending ${variant.key}: ${JSON.stringify((result as { error: unknown }).error)}`
            );
        }
    }

    console.log("All corporate email tests sent successfully.");
}

main().catch((error) => {
    console.error("Corporate email test send failed:", error);
    process.exit(1);
});
