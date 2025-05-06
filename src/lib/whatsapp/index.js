// export async function sendWhatsAppMessage({
//     recipientPhoneNumber,
//     templateName,
//     languageCode,
//     parameters = [],
//   }) {
//     if (!process.env.WHATSAPP_PHONE_NUMBER_ID || !process.env.WHATSAPP_TOKEN) {
//       throw new Error("WhatsApp configuration missing");
//     }

//     const templateParameterCount = {
//       order_confirmation: 2, // Update as per actual template
//       hello_world: 0,
//     };

//     if (
//       parameters.length &&
//       templateParameterCount[templateName] !== parameters.length
//     ) {
//       throw new Error(
//         `Template ${templateName} expects ${templateParameterCount[templateName]} parameters, but ${parameters.length} provided`
//       );
//     }

//     const url = `https://graph.facebook.com/v22.0/${process.env.WHATSAPP_PHONE_NUMBER_ID}/messages`;
//     const body = {
//       messaging_product: "whatsapp",
//       to: recipientPhoneNumber,
//       type: "template",
//       template: {
//         name: templateName,
//         language: { code: languageCode },
//         components: parameters.length
//           ? [
//               {
//                 type: "body",
//                 parameters: parameters.map((param) => ({
//                   type: "text",
//                   text: param,
//                 })),
//               },
//             ]
//           : [],
//       },
//     };

//     console.log("Payload to be sent:", JSON.stringify(body, null, 2));

//     try {
//       const response = await fetch(url, {
//         method: "POST",
//         headers: {
//           "Content-Type": "application/json",
//           Authorization: `Bearer ${process.env.WHATSAPP_TOKEN}`,
//         },
//         body: JSON.stringify(body),
//       });

//       const data = await response.json();

//       if (!response.ok) {
//         console.error("Error response from WhatsApp API:", data);
//         throw new Error(data.error?.message || "Unknown error");
//       }

//       console.log("WhatsApp API Response:", data);
//       return { success: true, data };
//     } catch (err) {
//       console.error("Error sending WhatsApp message:", err);
//       throw err;
//     }
//   }

import twilio from "twilio";

// const client = twilio(
//   process.env.TWILIO_ACCOUNT_SID,
//   process.env.TWILIO_AUTH_TOKEN
// );

// export async function sendWhatsAppMessage({
//   recipientPhoneNumber,
//   templateName,
//   languageCode,
//   parameters = [],
// }) {
//   if (!process.env.TWILIO_ACCOUNT_SID || !process.env.TWILIO_AUTH_TOKEN || !process.env.TWILIO_WHATSAPP_NUMBER) {
//     throw new Error("Twilio configuration missing");
//   }

//   // Define templates and their expected parameter counts
//   const templates = {
//     order_confirmation: {
//       message: "Hello {0}, your order {1} has been confirmed!",
//       parameterCount: 2,
//     },
//     hello_world: {
//       message: "Hello, world!",
//       parameterCount: 0,
//     },
//   };

//   // Validate template existence
//   if (!templates[templateName]) {
//     throw new Error(`Template ${templateName} not found`);
//   }

//   // Validate parameter count
//   if (templates[templateName].parameterCount !== parameters.length) {
//     throw new Error(
//       `Template ${templateName} expects ${templates[templateName].parameterCount} parameters, but ${parameters.length} provided`
//     );
//   }

//   // Replace placeholders in the message (e.g., {0}, {1})
//   let messageBody = templates[templateName].message;
//   parameters.forEach((param, index) => {
//     messageBody = messageBody.replace(`{${index}}`, param);
//   });
// console.log(recipientPhoneNumber,"recipientPhoneNumber");
//   try {
//     const message = await client.messages.create({
//       from: process.env.TWILIO_WHATSAPP_NUMBER, // e.g., whatsapp:+14155238886
//       to: `whatsapp:${recipientPhoneNumber}`,
//       body: messageBody,
//     });

//     console.log("WhatsApp message sent:", message.sid);
//     return { success: true, data: { sid: message.sid } };
//   } catch (err) {
//     console.error("Error sending WhatsApp message:", err);
//     throw new Error(err.message || "Failed to send WhatsApp message");
//   }
// }

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
