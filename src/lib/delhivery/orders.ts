// src/lib/delhivery/orders.ts
import qs from "qs";
import { delhiveryClient } from "./client";

/**
 * Complete type for Delhivery shipment creation payload.
 * Mirrors the documented /api/cmu/create.json fields.
 */
export interface DelhiveryShipment {
  /** ✅ REQUIRED — Name of the consignee */
  name: string;

  /** ✅ REQUIRED — Address of the consignee */
  add: string;

  /** ✅ REQUIRED — Pincode of the consignee */
  pin: string;

  /** 🟡 Optional — City of the consignee */
  city?: string;

  /** 🟡 Optional — State of the consignee (recommended) */
  state?: string;

  /** 🟡 Optional — Country (mandatory only for Bangladesh = "BD") */
  country?: string;

  /** ✅ REQUIRED — Consignee phone number */
  phone: string;

  /** ✅ REQUIRED — Order ID */
  order: string;

  /** ✅ REQUIRED — Payment mode ("Prepaid" or "COD") */
  payment_mode: "Prepaid" | "COD";

  /** 🟡 Optional — Address type (Home/Office) */
  address_type?: "Home" | "Office";

  /** 🟡 Optional — E-waybill number (for shipment ≥ ₹50,000) */
  ewbn?: string;

  /** 🟡 Optional — HSN code (mandatory if e-waybill required) */
  hsn_code?: string;

  /** 🟡 Optional — Shipping mode ("Surface" | "Express") */
  shipping_mode?: "Surface" | "Express";

  /** 🟡 Optional — Seller invoice number */
  seller_inv?: string;

  /** 🟡 Optional — Weight of shipment (grams) */
  weight?: number;

  /** 🟡 Optional — Return name */
  return_name?: string;

  /** 🟡 Optional — Return address */
  return_add?: string;

  /** 🟡 Optional — Return city */
  return_city?: string;

  /** 🟡 Optional — Return phone number */
  return_phone?: string;

  /** 🟡 Optional — Return state */
  return_state?: string;

  /** 🟡 Optional — Return country */
  return_country?: string;

  /** 🟡 Optional — Return pincode */
  return_pin?: string;

  /** 🟡 Optional — Seller name */
  seller_name?: string;

  /** 🟡 Optional — Marks fragile shipment (true/false) */
  fragile_shipment?: boolean;

  /** 🟡 Optional — Shipment height (cm) */
  shipment_height?: number;

  /** 🟡 Optional — Shipment width (cm) */
  shipment_width?: number;

  /** 🟡 Optional — Shipment length (cm) */
  shipment_length?: number;

  /** 🟡 Optional — COD amount (only if payment_mode = COD) */
  cod_amount?: number;

  /** 🟡 Optional — Product description (recommended) */
  products_desc?: string;

  /** 🟡 Optional — Dangerous goods flag (true/false) */
  dangerous_good?: boolean;

  /** 🟡 Optional — Waybill number (prefetched for MPS shipments) */
  waybill?: string;

  /** 🟡 Optional — Total amount */
  total_amount?: number;

  /** 🟡 Optional — Seller address */
  seller_add?: string;

  /** 🟡 Optional — Plastic packaging flag (true/false) */
  plastic_packaging?: boolean;

  /** 🟡 Optional — Quantity (recommended) */
  quantity?: string;
}

export interface DelhiveryPickupLocation {
  name: string; // must match registered warehouse name exactly
}

/**
 * Standard createOrder payload
 */
export interface DelhiveryOrderPayload {
  format?: "json"; // 🆕 added
  shipments: DelhiveryShipment[];
  pickup_location: DelhiveryPickupLocation;
}

/**
 * Create shipment(s)
 * Supports both single & MPS (multi-package) consignments.
 */
export const createOrder = async (payload: DelhiveryOrderPayload) => {
  try {
    // Convert to form-urlencoded structure as required by Delhivery
    const formBody = qs.stringify({
      format: "json",
      data: JSON.stringify(payload),
    });

    const res = await delhiveryClient.post("/api/cmu/create.json", formBody, {
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
    });

    return { success: true, data: res.data };
  } catch (err: any) {
    console.error(
      "Delhivery createOrder error:",
      err.response?.data || err.message
    );
    return {
      success: false,
      error: err.response?.data || err.message,
    };
  }
};

/**
 * Cancel shipment
 */
export const cancelOrder = async (waybill: string) => {
  const body = { waybill, action: "cancel" };
  const res = await delhiveryClient.post("/api/p/edit", body, {
  });
  return res.data;
};

/**
 * Create a Return (RTO)
 */
export const createReturn = async (waybill: string, reason: string) => {
  const body = { waybill, action: "rto", reason };
  const res = await delhiveryClient.post("/api/p/edit", body, {
  });
  return res.data;
};

/**
 * Create Exchange shipment
 * - RTO the original
 * - Create new shipment
 */
export const createExchange = async (
  originalAwb: string,
  newOrder: DelhiveryOrderPayload
) => {
  await createReturn(originalAwb, "Exchange Requested");
  return await createOrder(newOrder);
};
