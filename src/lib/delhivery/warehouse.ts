import { delhiveryClient } from "./client";

/**
 * Registers a new client warehouse (pickup location ) in Delhivery.
 * This must be done before you can create or ship orders from that location.
 *
 * Docs Reference: "Client Warehouse Creation API"
 * Base URL: https://track.delhivery.com/api/client_warehouse/create.json
 */
export async function createClientWarehouse(payload: {
  /** ✅ REQUIRED — Warehouse name (case-sensitive, used later in pickup_location.name ) */
  name: string;

  /** 🟡 OPTIONAL — Your registered company name */
  registered_name?: string;

  /** ✅ REQUIRED — Warehouse POC phone number */
  phone: string;

  /** 🟡 OPTIONAL — Email of the warehouse POC */
  email?: string;

  /** 🟡 OPTIONAL — Full pickup address */
  address?: string;

  /** 🟡 OPTIONAL — City of warehouse */
  city?: string;

  /** ✅ REQUIRED — Pincode of warehouse */
  pin: string;

  /** 🟡 OPTIONAL — Country name (defaults to India) */
  country?: string;

  /** ✅ REQUIRED — Return address (can be same as pickup) */
  return_address: string;

  /** 🟡 OPTIONAL — Return city */
  return_city?: string;

  /** 🟡 OPTIONAL — Return pincode */
  return_pin?: string;

  /** 🟡 OPTIONAL — Return state */
  return_state?: string;

  /** 🟡 OPTIONAL — Return country (defaults to India) */
  return_country?: string;
}) {
  try {
    const createUrl = "/api/backend/clientwarehouse/create/";
    const apiUrl = delhiveryClient.defaults.baseURL;

    // --- Logging the URLs ---
    console.log("Delhivery API Base URL:", apiUrl);
    console.log("Delhivery Create Warehouse URL:", createUrl);
    console.log("Full Request URL:", `${apiUrl}${createUrl}`);
    // -------------------------

    const res = await delhiveryClient.post(
      createUrl, // Using the variable here
      {
        name: payload.name,
        registered_name: payload.registered_name,
        phone: payload.phone,
        email: payload.email,
        address: payload.address,
        city: payload.city,
        pin: payload.pin,
        country:"India",
        return_address: payload.return_address,
        return_city: payload.return_city || payload.city,
        return_pin: payload.return_pin || payload.pin,
        return_state: payload.return_state,
        return_country: "India",
      },
    );

    return {
      success: true,
      data: res.data,
    };
  } catch (error: any) {
    console.error("❌ Delhivery client warehouse creation failed:", error.response?.data || error);
    return {
      success: false,
      error: error.response?.data || error.message,
    };
  }
}
