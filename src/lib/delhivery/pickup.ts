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
