// pages/api/delhivery/pickup.ts
import type { NextApiRequest, NextApiResponse } from "next";
import { schedulePickup } from "@/lib/delhivery/pickup";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ success: false, message: "Method Not Allowed" });
  }

  try {
    console.log("📨 /api/delhivery/pickup payload:", req.body);

    const result = await schedulePickup(req.body);
    console.log("📦 Delhivery schedulePickup result:", result);

    // Normalize response for frontend
    return res.status(200).json({
      success: true,
      data: result,
    });
  } catch (err: any) {
    console.error("❌ Delhivery pickup API error:", err?.response?.data ?? err?.message ?? err);
    return res.status(500).json({
      success: false,
      message: err?.response?.data?.message ?? err?.message ?? "Delhivery pickup failed",
      error: err?.response?.data ?? err?.toString(),
    });
  }
}
