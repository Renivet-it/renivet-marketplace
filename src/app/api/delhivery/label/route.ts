// app/api/delhivery/label/route.ts
import { NextResponse } from "next/server";
import { downloadDelhiveryLabel } from "@/lib/delhivery/pickup";

export async function POST(req: Request) {
  try {
    const { wbn } = await req.json();
    console.log("🎯 API Route - Received WBN:", wbn);
    if (!wbn) {
      return NextResponse.json({ success: false, message: "WBN is required" }, { status: 400 });
    }

    const { labelBase64, fileName } = await downloadDelhiveryLabel(wbn);
    console.log("🎯 API Route - Label Base64 Length:", labelBase64.length);
    console.log("🎯 API Route - File Name:", fileName);
    const buffer = Buffer.from(labelBase64, "base64");
    console.log("🎯 API Route - Buffer Length:", buffer.length);
    console.log("🎯 API Route - First 20 bytes:", buffer.slice(0, 20));
    // Check if it's a valid PDF (should start with %PDF)
    const pdfHeader = buffer.toString('utf8', 0, 4);
    console.log("🎯 API Route - PDF Header:", pdfHeader, "(should be %PDF)");
    if (pdfHeader !== '%PDF') {
      console.error("❌ Invalid PDF - Header check failed");
      console.error("❌ Buffer as text (first 200 chars):", buffer.toString('utf8', 0, 200));
    }

    const headers = new Headers();
    headers.set("Content-Type", "application/pdf");
    headers.set("Content-Disposition", `attachment; filename="${fileName}"`);
    headers.set("Content-Length", buffer.length.toString());

    return new NextResponse(buffer, { status: 200, headers });
  } catch (err: any) {
    console.error("❌ API Route Error:", err);
    return NextResponse.json(
      { success: false, message: err?.message || "Failed to download Delhivery label" },
      { status: 500 }
    );
  }
}