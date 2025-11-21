import { delhiveryClient } from "./client";

export interface PickupRequest {
  pickup_location: string;
  pickup_date: string; // YYYY-MM-DD
  pickup_time?: string; // Optional time slot
  expected_package_count: number;
}

/* ============================================================
   ⭐ schedulePickup — WITH FULL ERROR LOGGING
   ============================================================ */
export const schedulePickup = async (payload: PickupRequest) => {
  try {
    console.log("📨 Sending Delhivery Pickup Payload:", payload);

    const res = await delhiveryClient.post("/fm/request/new/", {
      pickup_date: payload.pickup_date,
      pickup_time: payload.pickup_time,
      pickup_location: payload.pickup_location,
      expected_package_count: payload.expected_package_count,
    });

    console.log("✅ Delhivery Pickup Success Response:", res.data);

    return res.data;
  } catch (err: any) {
    console.error("❌ Delhivery Pickup ERROR");

    // Axios Error (Backend returned an error)
    if (err.response) {
      console.error("🚨 Response Status:", err.response.status);
      console.error("🚨 Response Data:", err.response.data);
      console.error("🚨 Response Headers:", err.response.headers);
    }
    // Request was sent but no response received
    else if (err.request) {
      console.error("⚠ No response received from Delhivery API");
      console.error("⚠ Request Data:", err.request);
    }
    // Any other error
    else {
      console.error("⚠ Unexpected Error:", err.message);
    }

    throw new Error(
      err?.response?.data.prepaid || err?.response?.data?.message ||
        err?.message ||
        "Delhivery pickup request failed"
    );
  }
};

/* ============================================================
   ⭐ reschedulePickup — WITH FULL ERROR LOGGING
   ============================================================ */
export const reschedulePickup = async (
  pickup_id: string,
  new_date: string,
  new_slot?: string
) => {
  try {
    console.log("📨 Sending Delhivery Reschedule Payload:", {
      pickup_id,
      new_date,
      new_slot,
    });

    const res = await delhiveryClient.post("/api/pickup/edit.json", {
      pickup_id,
      new_date,
      new_slot,
    });

    console.log("✅ Delhivery Reschedule Success Response:", res.data);

    return res.data;
  } catch (err: any) {
    console.error("❌ Delhivery Reschedule ERROR");

    if (err.response) {
      console.error("🚨 Response Status:", err.response.status);
      console.error("🚨 Response Data:", err.response.data);
      console.error("🚨 Response Headers:", err.response.headers);
    } else if (err.request) {
      console.error("⚠ No response received from Delhivery");
      console.error("⚠ Request Data:", err.request);
    } else {
      console.error("⚠ Unexpected Error:", err.message);
    }

    throw new Error(
      err?.response?.data?.message ||
        err?.message ||
        "Delhivery reschedule failed"
    );
  }
};



// lib/delhivery/pickup.ts
export const downloadDelhiveryLabel = async (wbn: string) => {
  try {
    console.log("📨 Requesting Delhivery Label for WBN:", wbn);

    // Step 1: Get the PDF download link from Delhivery
    const res = await delhiveryClient.get("/api/p/packing_slip", {
      params: {
        wbns: wbn,
        pdf: "true",
        pdf_size: "A4",
      },
    });

    console.log("✅ Delhivery API Response Status:", res.status);
    console.log("📦 Response Data:", res.data);

    // Parse the JSON response
    const responseData = res.data;
    if (!responseData.packages || responseData.packages.length === 0) {
      throw new Error("No packages found in Delhivery response");
    }

    const pdfDownloadLink = responseData.packages[0].pdf_download_link;
    if (!pdfDownloadLink) {
      throw new Error("No PDF download link found in Delhivery response");
    }

    console.log("🔗 PDF Download Link:", pdfDownloadLink);

    // Step 2: Download the actual PDF from the S3 link
    const pdfResponse = await fetch(pdfDownloadLink);
    if (!pdfResponse.ok) {
      throw new Error(`Failed to download PDF from S3: ${pdfResponse.status}`);
    }

    const pdfBuffer = await pdfResponse.arrayBuffer();
    console.log("✅ Downloaded PDF from S3, size:", pdfBuffer.byteLength);

    const base64PDF = Buffer.from(pdfBuffer).toString("base64");
    console.log("🔄 Base64 Length:", base64PDF.length);
    console.log("🔄 First 100 chars of Base64:", base64PDF.substring(0, 100));

    // Verify PDF header
    const pdfHeader = Buffer.from(pdfBuffer).toString('utf8', 0, 4);
    console.log("✅ PDF Header Check:", pdfHeader);

    if (pdfHeader !== "%PDF") {
      throw new Error("Downloaded file is not a valid PDF");
    }

    return {
      success: true,
      labelBase64: base64PDF,
      fileName: `delhivery_label_${wbn}.pdf`,
    };
  } catch (err: any) {
    console.error("❌ Delhivery Label ERROR - Full Error:", err);
    console.error("❌ Error Response Data:", err?.response?.data);
    console.error("❌ Error Response Status:", err?.response?.status);

    const errorMessage = err?.response?.data?.toString() || err?.message || "Failed to fetch Delhivery label";
    throw new Error(errorMessage);
  }
};
