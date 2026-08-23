// pages/api/delhivery/pickup.ts
import { requireLogisticsStaff } from "@/lib/auth/logistics-access";
import { schedulePickup } from "@/lib/delhivery/pickup";
import type { NextApiRequest, NextApiResponse } from "next";

export default async function handler(
    req: NextApiRequest,
    res: NextApiResponse
) {
    if (req.method !== "POST") {
        return res
            .status(405)
            .json({ success: false, message: "Method Not Allowed" });
    }

    try {
        const denied = await requireLogisticsStaff();
        if (denied) {
            return res.status(denied.status).json(await denied.json());
        }

        console.log("📨 /api/delhivery/pickup payload:", req.body);

        const result = await schedulePickup(req.body);
        console.log("📦 Delhivery schedulePickup result:", result);

        // Normalize response for frontend
        return res.status(200).json({
            success: true,
            data: result,
        });
    } catch (err: any) {
        console.error(
            "❌ Delhivery pickup API error:",
            err?.response?.data ?? err?.message ?? err
        );
        return res.status(500).json({
            success: false,
            message:
                err?.response?.data?.message ??
                err?.message ??
                "Delhivery pickup failed",
            error: err?.response?.data ?? err?.toString(),
        });
    }
}
