
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

        return_replace_admin: {
          contentSid: "HX25bb65cc2fcac32492586d10c86bd5d6",
          parameterCount: 4, // type, orderId, userName, reason
        },
    };

    // Validate template existence
    // @ts-ignore
    if (!templates[templateName]) {
        throw new Error(`Template ${templateName} not found`);
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
    } catch (err:any) {
        console.error("Error sending WhatsApp message:", err);
        throw new Error(err.message || "Failed to send WhatsApp message");
    }
}

export async function sendPromoOfferMessage({
  recipientPhoneNumber,
  templateName = "consciuos_click",
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
    consciuos_click: {
      contentSid: "HXccde2ac426a9787bc2a8a04900bb7bd7",
      parameterCount: 1,
    },
  };
    // @ts-ignore
  if (!templates[templateName]) {
    throw new Error(`Template ${templateName} not found`);
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

  console.log("Promo Offer Payload to be sent:", JSON.stringify(payload, null, 2));

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
      if (["delivered", "failed", "undelivered"].includes(messageStatus)) {
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
    throw new Error(err.message || "Failed to send WhatsApp promo offer message");
  }
}