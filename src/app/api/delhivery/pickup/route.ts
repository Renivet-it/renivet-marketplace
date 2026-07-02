import { NextResponse } from "next/server";
import { schedulePickup } from "@/lib/delhivery/pickup";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    console.log("📨 /api/delhivery/pickup payload:", body);

    const result = await schedulePickup(body);
    console.log("✅ Delhivery schedulePickup result:", result);
    const normalizedSuccess =
      result?.status === true ||
      result?.success === true ||
      result?.pr_exist === true;

    return NextResponse.json({
      success: normalizedSuccess,
      data: result,
      pickupAlreadyExists: result?.pr_exist === true,
    });
  } catch (err: any) {
    console.error("❌ Delhivery pickup API error:", err);

    const delhiveryError =
      err?.response?.data ||
      { message: err?.message || "Delhivery pickup failed" };

    return NextResponse.json(
      {
        success: false,
        message:
          delhiveryError?.message ||
          delhiveryError?.error ||
          JSON.stringify(delhiveryError),
        fullError: delhiveryError,
      },
      { status: 400 }
    );
  }
}
