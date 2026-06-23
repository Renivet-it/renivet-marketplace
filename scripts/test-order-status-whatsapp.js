const fs = require("fs");
const path = require("path");
const postgres = require("postgres");
const twilio = require("twilio");
require("dotenv").config({ path: path.join(process.cwd(), ".env.local") });

const VALID_STATUSES = ["in_transit", "out_for_delivery", "delivered"];

function normalizeDbUrl(raw) {
    let url = (raw || "").trim();
    if (
        (url.startsWith('"') && url.endsWith('"')) ||
        (url.startsWith("'") && url.endsWith("'"))
    ) {
        url = url.slice(1, -1);
    }

    const match = url.match(
        /^(postgres(?:ql)?:\/\/)([^:]+):(.+)@([^@/]+(?:\/.*)?)$/
    );
    if (!match) return url;

    const [, prefix, user, password, rest] = match;
    return `${prefix}${user}:${encodeURIComponent(password)}@${rest}`;
}

function formatIndianWhatsAppNumber(phone) {
    const cleaned = String(phone || "").replace(/\D/g, "");

    if (cleaned.startsWith("91") && cleaned.length === 12) {
        return `+${cleaned}`;
    }

    if (cleaned.length === 10) {
        return `+91${cleaned}`;
    }

    throw new Error(`Invalid phone number: ${phone}`);
}

function getTrackingUrl(orderId) {
    const configuredUrl =
        process.env.NEXT_PUBLIC_APP_URL?.trim() ||
        process.env.VERCEL_PROJECT_PRODUCTION_URL?.trim() ||
        process.env.VERCEL_URL?.trim();

    const baseUrl = configuredUrl
        ? configuredUrl.startsWith("http")
            ? configuredUrl
            : `https://${configuredUrl}`
        : "http://localhost:3000";

    return `${baseUrl.replace(/\/$/, "")}/orders/${orderId}/tracking`;
}

function buildTemplatePayload({
    customerName,
    orderId,
    shipmentStatus,
    awbNumber,
}) {
    const firstName = customerName.trim().split(/\s+/)[0] || "there";
    const trackingUrl = getTrackingUrl(orderId);

    switch (shipmentStatus) {
        case "in_transit":
            return {
                contentSid: "HX31498bcca08b9189e980acacfc111612",
                parameters: [
                    firstName,
                    orderId,
                    awbNumber || "N/A",
                    trackingUrl || "",
                ],
            };
        case "out_for_delivery":
            return {
                contentSid: "HXe6dbd76be555e01b7a7e528e90f58d81",
                parameters: [
                    firstName,
                    orderId,
                    awbNumber || "N/A",
                    trackingUrl || "",
                ],
            };
        case "delivered":
            return {
                contentSid: "HXd3cff6d4a7ad10bd19572685d840a04e",
                parameters: [firstName, orderId],
            };
        default:
            throw new Error(`Unsupported shipment status: ${shipmentStatus}`);
    }
}

async function sendTemplateWhatsAppMessage({
    recipientPhoneNumber,
    contentSid,
    parameters,
}) {
    if (
        !process.env.TWILIO_ACCOUNT_SID ||
        !process.env.TWILIO_AUTH_TOKEN ||
        !process.env.TWILIO_WHATSAPP_NUMBER
    ) {
        throw new Error("Twilio configuration missing");
    }

    const client = twilio(
        process.env.TWILIO_ACCOUNT_SID,
        process.env.TWILIO_AUTH_TOKEN
    );

    const contentVariables = {};
    parameters.forEach((param, index) => {
        contentVariables[index + 1] = param;
    });

    const payload = {
        from: process.env.TWILIO_WHATSAPP_NUMBER,
        to: `whatsapp:${recipientPhoneNumber}`,
        contentSid,
        contentVariables: JSON.stringify(contentVariables),
    };

    console.log("Sending WhatsApp payload:");
    console.log(JSON.stringify(payload, null, 2));

    return client.messages.create(payload);
}

async function main() {
    const [, , orderId, shipmentStatus, ...flags] = process.argv;

    if (!orderId || !shipmentStatus) {
        console.error(
            "Usage: node scripts/test-order-status-whatsapp.js <orderId> <in_transit|out_for_delivery|delivered> [--force]"
        );
        process.exit(1);
    }

    if (!VALID_STATUSES.includes(shipmentStatus)) {
        console.error(
            `Invalid status "${shipmentStatus}". Use one of: ${VALID_STATUSES.join(", ")}`
        );
        process.exit(1);
    }

    const force = flags.includes("--force");
    const dbUrl = normalizeDbUrl(process.env.DATABASE_URL || "");
    const sql = postgres(dbUrl, { max: 1 });

    try {
        const rows = await sql`
            select
              o.id,
              u.first_name,
              u.last_name,
              u.phone as user_phone,
              a.phone as address_phone,
              a.full_name as address_full_name,
              s.awb_number
            from orders o
            left join users u on u.id = o.user_id
            left join addresses a on a.id = o.address_id
            left join order_shipments s on s.order_id = o.id
            where o.id = ${orderId}
            limit 1
        `;

        const order = rows[0];
        if (!order) {
            throw new Error(`Order not found: ${orderId}`);
        }

        const rawPhone = order.user_phone || order.address_phone;
        const recipientPhoneNumber = formatIndianWhatsAppNumber(rawPhone);
        const customerName =
            [order.first_name, order.last_name].filter(Boolean).join(" ") ||
            order.address_full_name ||
            "Customer";

        const templateKey = "order_shipment_status";
        const templateName = `order_${shipmentStatus}_${orderId}`;

        const existingLogs = await sql`
            select id, success, sent_at
            from whatsapp_message_logs
            where phone_number = ${recipientPhoneNumber}
              and template_key = ${templateKey}
              and template_name = ${templateName}
            order by sent_at desc
            limit 1
        `;

        const existingLog = existingLogs[0];
        if (existingLog?.success && !force) {
            console.log(
                `Skipped: WhatsApp already sent for ${templateName} at ${existingLog.sent_at}. Use --force to send again.`
            );
            return;
        }

        const templatePayload = buildTemplatePayload({
            customerName,
            orderId,
            shipmentStatus,
            awbNumber: order.awb_number,
        });

        const result = await sendTemplateWhatsAppMessage({
            recipientPhoneNumber,
            contentSid: templatePayload.contentSid,
            parameters: templatePayload.parameters,
        });

        await sql`
            insert into whatsapp_message_logs (
              full_name,
              phone_number,
              template_key,
              template_name,
              status,
              success,
              sid,
              error,
              attempts,
              sent_at,
              created_at,
              updated_at
            ) values (
              ${customerName},
              ${recipientPhoneNumber},
              ${templateKey},
              ${templateName},
              ${"sent"},
              ${true},
              ${result.sid},
              ${null},
              ${1},
              ${new Date()},
              ${new Date()},
              ${new Date()}
            )
        `;

        console.log(
            `Success: sent ${shipmentStatus} WhatsApp for ${orderId} to ${recipientPhoneNumber}`
        );
        console.log(`Twilio SID: ${result.sid}`);
    } catch (error) {
        console.error("Test WhatsApp failed:", error);
        process.exitCode = 1;
    } finally {
        await sql.end();
    }
}

main();
