// src/app/api/delhivery/pickup/route.ts

import { NextResponse } from "next/server";
import { schedulePickup } from "@/lib/delhivery/pickup";

export async function POST(req: Request) {
    try {
        const body = await req.json();
        console.log("📦 /api/delhivery/pickup payload:", body);

        const result = await schedulePickup(body);
        console.log("📦 Delhivery schedulePickup result:", result);

        return NextResponse.json({
            success: true,
            data: result,
        });
    } catch (err: any) {
        console.error("❌ Delhivery pickup API error:", err);

        return NextResponse.json(
            {
                success: false,
                message: err?.response?.data?.message ?? err.message ?? "Delhivery pickup failed",
                error: err?.response?.data ?? err.toString(),
            },
            { status: 500 }
        );
    }
}
