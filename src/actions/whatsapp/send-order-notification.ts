// "use server";

// import { sendWhatsAppMessage } from "@/lib/whatsapp/index";

// export async function sendWhatsAppNotification({
//   phone,
//   template,
//   lang = "en_US",
//   parameters = [],
// }) {


//   try {
//     const result = await sendWhatsAppMessage({
//       recipientPhoneNumber: phone,
//       templateName: template,
//       languageCode: lang,
//       parameters,
//     });
//     return result;
//   } catch (err:any) {
//     console.error("WhatsApp notification error:", err);
//     throw new Error(err.message || "Failed to send WhatsApp message");
//   }
// }


"use server";

import { sendWhatsAppMessage } from "@/lib/whatsapp/index";

export async function sendWhatsAppNotification({
  phone,
  template,
  lang = "en_US",
  parameters = [],
}: {
  phone: any;
  template: any;
  lang?: string;
  parameters?: any;
}) {
  try {
    const result = await sendWhatsAppMessage({
      recipientPhoneNumber: phone,
      templateName: template,
      languageCode: lang,
      parameters,
    });
    return result;
  } catch (err:any) {
    console.error("WhatsApp notification error:", err);
    throw new Error(err.message || "Failed to send WhatsApp message");
  }
}