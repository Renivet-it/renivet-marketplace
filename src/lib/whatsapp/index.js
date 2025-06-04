
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
    };

    // Validate template existence
    if (!templates[templateName]) {
        throw new Error(`Template ${templateName} not found`);
    }

    // Validate parameter count
    if (templates[templateName].parameterCount !== parameters.length) {
        throw new Error(
            `Template ${templateName} expects ${templates[templateName].parameterCount} parameters, but ${parameters.length} provided`
        );
    }

    // Construct contentVariables for Twilio
    const contentVariables = {};
    parameters.forEach((param, index) => {
        contentVariables[index + 1] = param; // Twilio expects 1-based indexing ({{1}}, {{2}})
    });

    // Construct the payload
    const payload = {
        from: process.env.TWILIO_WHATSAPP_NUMBER,
        to: `whatsapp:${recipientPhoneNumber}`,
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
    } catch (err) {
        console.error("Error sending WhatsApp message:", err);
        throw new Error(err.message || "Failed to send WhatsApp message");
    }
}


export async function sendPromoOfferMessage({
    recipientPhoneNumber,
    templateName = "promo_offer_2025",
    languageCode = "en",
    parameters = [],
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
        promo_offer_2025: {
            contentSid: "HX52281c1e1a2200a99396b76177fff81c", // Replace with actual template SID from Twilio
            parameterCount: 3, // Body: {{1}} (name), {{2}} (discount %), {{3}} (expiry date)
        },
    };

    // Validate template existence
    if (!templates[templateName]) {
        throw new Error(`Template ${templateName} not found`);
    }

    // Validate parameter count
    if (templates[templateName].parameterCount !== parameters.length) {
        throw new Error(
            `Template ${templateName} expects ${templates[templateName].parameterCount} parameters, but ${parameters.length} provided`
        );
    }

    // Construct contentVariables for Twilio
    const contentVariables = {};
    parameters.forEach((param, index) => {
        contentVariables[index + 1] = param; // Twilio expects 1-based indexing ({{1}}, {{2}}, {{3}})
    });

    // Construct the payload
    const payload = {
        from: process.env.TWILIO_WHATSAPP_NUMBER,
        to: `whatsapp:${recipientPhoneNumber}`,
        contentSid: templates[templateName].contentSid,
        contentVariables: JSON.stringify(contentVariables),
    };

    // Log the payload
    console.log("Promo Offer Payload to be sent:", JSON.stringify(payload, null, 2));

    try {
        const message = await client.messages.create(payload);

        // Log the response
        console.log(
            "Twilio WhatsApp Promo Offer API Response:",
            JSON.stringify(message, null, 2)
        );
        return { success: true, data: { sid: message.sid } };
    } catch (err) {
        console.error("Error sending WhatsApp promo offer message:", err);
        throw new Error(err.message || "Failed to send WhatsApp promo offer message");
    }
}
