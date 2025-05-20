// action.ts
"use server";

import { shiprocket } from "@/lib/shiprocket";

// Function to estimate delivery date using Shiprocket API
export async function getEstimatedDelivery({
  pickupPostcode,
  deliveryPostcode,
}: {
  pickupPostcode: number;
  deliveryPostcode: number;
}) {
  try {
    const sr = await shiprocket();

    // Ensure pincodes are integers
    if (!Number.isInteger(pickupPostcode) || !Number.isInteger(deliveryPostcode)) {
      return { success: false, message: "Pincodes must be integers.", data: null };
    }

    // Call Shiprocket API with required parameters
    const response = await sr.getCouriersForDeliveryLocation({
      pickup_postcode: pickupPostcode,
      delivery_postcode: deliveryPostcode,
      weight: 1, // Default weight: 1 kg
      cod: 0, // Default: Non-COD shipment
    });
console.log("Shiprocket API response:", JSON.stringify(response, null, 2));
    // Return the entire response
    return {
      success: response.status,
      message: response.message,
      data: response.data,
    };
  } catch (error: any) {
    console.error("Error in getEstimatedDelivery:", error);
    return { success: false, message: error.message || "Failed to fetch delivery estimate.", data: null };
  }
}