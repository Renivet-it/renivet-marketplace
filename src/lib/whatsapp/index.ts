import twilio from "twilio";

const client = twilio(
    process.env.TWILIO_ACCOUNT_SID,
    process.env.TWILIO_AUTH_TOKEN
);

export async function sendWhatsAppMessage({
    recipientPhoneNumber,
    templateName,
    languageCode,
    parameters = [],
}: {
    recipientPhoneNumber: any;
    templateName?: any;
    languageCode?: any;
    parameters?: any[];
}) {
    if (
        !process.env.TWILIO_ACCOUNT_SID ||
        !process.env.TWILIO_AUTH_TOKEN ||
        !process.env.TWILIO_WHATSAPP_NUMBER
    ) {
        throw new Error("Twilio configuration missing");
    }

    // Define template SIDs and their expected parameter counts
    const templates = {
        order_confirmation: {
            contentSid: "HX5bef691475ce74319b614ad2129eb432", // Replace with actual template SID from Twilio
            parameterCount: 2, // Body: {{1}} (name), {{2}} (order ID); Button URL: {{1}} (order ID)
        },
        return_initiated_user: {
            contentSid: "HX7925a3c635766f42f372ed1cb76d9453",
            parameterCount: 2, // name, orderId
        },
        replace_initiated_user: {
            contentSid: "HXaf68cfd30d177fe5090b89ef1dfc0f48",
            parameterCount: 2, // name, orderId
        },
        order_shipped_renivet: {
            contentSid: "HX31498bcca08b9189e980acacfc111612",
            parameterCount: 4, // name, orderId, awb, trackingUrl
        },
        order_out_for_delivery_renivet: {
            contentSid: "HXe6dbd76be555e01b7a7e528e90f58d81",
            parameterCount: 4, // name, orderId, awb, trackingUrl
        },
        order_delivered_renivet: {
            contentSid: "HXd3cff6d4a7ad10bd19572685d840a04e",
            parameterCount: 2, // name, orderId
        },

        return_replace_admin: {
            contentSid: "HX25bb65cc2fcac32492586d10c86bd5d6",
            parameterCount: 4, // type, orderId, userName, reason
        },
        return_replace_approved_user: {
            contentSid: "HX7f048ddcb266cc64d2ca5505fd36fccc",
            parameterCount: 3,
        },

        return_replace_rejected_user: {
            contentSid: "HX05a499044fb1c0ccb0900e662e39f638",
            parameterCount: 4,
        },

        daily_order_summary_2: {
            contentSid: "HX6446237c526fb08d9b1be5be7df538be",
            parameterCount: 10,
        },
        support_alert: {
            contentSid: "HX4b8a035fdc5ef83ff4c70f9ae14c4f98",
            parameterCount: 4,
        },
        sla_alert: {
            contentSid: "HX0bbffb19e0880e32834e3ed4c94c69c9",
            parameterCount: 4,
        },
    };

    // Validate template existence
    // @ts-ignore
    if (!templates[templateName]) {
        throw new Error(`Template ${templateName} not found`);
    }

    // @ts-ignore
    if (!templates[templateName].contentSid) {
        throw new Error(`Content SID missing for template ${templateName}`);
    }

    // Validate parameter count
    // @ts-ignore
    if (templates[templateName].parameterCount !== parameters.length) {
        throw new Error(
            // @ts-ignore
            `Template ${templateName} expects ${templates[templateName].parameterCount} parameters, but ${parameters.length} provided`
        );
    }

    // Construct contentVariables for Twilio
    const contentVariables = {};
    parameters.forEach((param, index) => {
        // @ts-ignore
        contentVariables[index + 1] = param; // Twilio expects 1-based indexing ({{1}}, {{2}})
    });

    // Construct the payload
    const payload = {
        from: process.env.TWILIO_WHATSAPP_NUMBER,
        to: `whatsapp:${recipientPhoneNumber}`,
        // @ts-ignore
        contentSid: templates[templateName].contentSid,
        contentVariables: JSON.stringify(contentVariables),
    };

    // Log the payload
    console.log("Payload to be sent:", JSON.stringify(payload, null, 2));

    try {
        const message = await client.messages.create(payload);

        // Log the response
        console.log(
            "Twilio WhatsApp API Response:",
            JSON.stringify(message, null, 2)
        );
        return { success: true, data: { sid: message.sid } };
    } catch (err: any) {
        console.error("Error sending WhatsApp message:", err);
        throw new Error(err.message || "Failed to send WhatsApp message");
    }
}

export async function sendPromoOfferMessage({
    recipientPhoneNumber,
    templateName = "renivet_story_1",
    languageCode = "en",
    parameters = [],
}: {
    recipientPhoneNumber: string;
    templateName?: string;
    languageCode?: string;
    parameters?: string[];
}) {
    if (
        !process.env.TWILIO_ACCOUNT_SID ||
        !process.env.TWILIO_AUTH_TOKEN ||
        !process.env.TWILIO_WHATSAPP_NUMBER
    ) {
        throw new Error("Twilio configuration missing");
    }

    const templates = {
        renivet_story_1: {
            contentSid: "HXe40ca3d6f4f1cc52d73476b91d4caba2",
            parameterCount: 0,
        },
        renivet_story_2: {
            contentSid: "HXf4b138a5fe202b3d3d4af3254529e412",
            parameterCount: 0,
        },
        renivet_story_3: {
            contentSid: "HX5d3d2d92db040ea3f1cfb8081107f3ad",
            parameterCount: 0,
        },
        renivet_story_4: {
            contentSid: "HXc2120149c6eeefa9629196d2c12ccd1f",
            parameterCount: 0,
        },
        renivet_story_5: {
            contentSid: "HX55ca53a893846e377241e83441ad9ead",
            parameterCount: 0,
        },
        renivet_story_6: {
            contentSid: "HXcdaf2ca15d1d6f8df443d02f1a98f041",
            parameterCount: 0,
        },
        renivet_story_7: {
            contentSid: "HXc5f3c11815f78e5afe2b12356bfd51f8",
            parameterCount: 0,
        },
    };
    // @ts-ignore
    if (!templates[templateName]) {
        throw new Error(`Template ${templateName} not found`);
    }
    // @ts-ignore
    if (!templates[templateName].contentSid) {
        throw new Error(`Content SID missing for template ${templateName}`);
    }
    // @ts-ignore
    if (templates[templateName].parameterCount !== parameters.length) {
        throw new Error(
            // @ts-ignore
            `Template ${templateName} expects ${templates[templateName].parameterCount} parameters, but ${parameters.length} provided`
        );
    }

    const contentVariables = {};
    parameters.forEach((param, index) => {
        // @ts-ignore
        contentVariables[index + 1] = param;
    });

    const payload = {
        from: process.env.TWILIO_WHATSAPP_NUMBER,
        to: `whatsapp:${recipientPhoneNumber}`,
        // @ts-ignore
        contentSid: templates[templateName].contentSid,
        contentVariables: JSON.stringify(contentVariables),
    };

    console.log(
        "Promo Offer Payload to be sent:",
        JSON.stringify(payload, null, 2)
    );

    try {
        const message = await client.messages.create(payload);
        console.log(
            "Twilio WhatsApp Promo Offer API Response:",
            JSON.stringify(message, null, 2)
        );

        // Poll for updated status
        let messageStatus = "unknown";
        const maxAttempts = 5;
        const delayMs = 2000; // 2 seconds delay between attempts

        for (let attempt = 1; attempt <= maxAttempts; attempt++) {
            const updatedMessage = await client.messages(message.sid).fetch();
            messageStatus = updatedMessage.status;
            console.log(
                `Attempt ${attempt}: Message SID ${message.sid} status: ${messageStatus}`
            );

            // Check if status indicates final state
            if (
                ["delivered", "failed", "undelivered"].includes(messageStatus)
            ) {
                break;
            }

            // Wait before the next attempt
            await new Promise((resolve) => setTimeout(resolve, delayMs));
        }

        const success = ["sent", "delivered"].includes(messageStatus);
        console.log(
            `Final status for Message SID ${message.sid}: ${messageStatus}, Success: ${success}`
        );

        return {
            success,
            data: { sid: message.sid, status: messageStatus },
        };
    } catch (err: any) {
        console.error("Error sending WhatsApp promo offer message:", err);
        throw new Error(
            err.message || "Failed to send WhatsApp promo offer message"
        );
    }
}

/**
 * Send a plain text WhatsApp message (for messages that don't fit template format)
 * Useful for dynamic content like daily summaries
 */
export async function sendPlainWhatsAppMessage({
    recipientPhoneNumber,
    message,
}: {
    recipientPhoneNumber: string;
    message: string;
}) {
    if (
        !process.env.TWILIO_ACCOUNT_SID ||
        !process.env.TWILIO_AUTH_TOKEN ||
        !process.env.TWILIO_WHATSAPP_NUMBER
    ) {
        throw new Error("Twilio configuration missing");
    }

    const payload = {
        from: process.env.TWILIO_WHATSAPP_NUMBER,
        to: `whatsapp:${recipientPhoneNumber}`,
        body: message,
    };

    console.log(
        "Plain WhatsApp Message Payload:",
        JSON.stringify(payload, null, 2)
    );

    try {
        const sentMessage = await client.messages.create(payload);
        console.log(
            "Twilio Plain WhatsApp API Response:",
            JSON.stringify(sentMessage, null, 2)
        );
        return { success: true, data: { sid: sentMessage.sid } };
    } catch (err: any) {
        console.error("Error sending plain WhatsApp message:", err);
        throw new Error(err.message || "Failed to send WhatsApp message");
    }
}
