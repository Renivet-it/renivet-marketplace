import { generateGstExport } from "@/lib/finance/gst";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
    const monthKey = req.nextUrl.searchParams.get("month") ?? new Date().toISOString().slice(0, 7);
    const { csv, preview } = await generateGstExport(monthKey, "api");

    return new NextResponse(csv, {
        headers: {
            "Content-Type": "text/csv; charset=utf-8",
            "X-Renivet-GST-Validation-Errors": String(preview.validationErrors.length),
            "Content-Disposition": `attachment; filename="RENIVET_GST_TCS_${monthKey.replace("-", "")}.csv"`,
        },
    });
}
