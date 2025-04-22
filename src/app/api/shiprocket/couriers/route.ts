// app/api/couriers/route.ts (Next 13+ with App Router)
import { courierService } from "@/actions/shiprocket/couriers";
import { NextRequest, NextResponse } from "next/server";

const ALLOWED_TYPES = ["active", "inactive", "all"] as const;
type CourierType = (typeof ALLOWED_TYPES)[number];

function isValidType(value: string | null): value is CourierType {
    return ALLOWED_TYPES.includes(value as CourierType);
}
export async function GET(req: NextRequest) {
    const { searchParams } = new URL(req.url);
    const rawType = searchParams.get("type");
    const type: CourierType = isValidType(rawType) ? rawType : "active";
    try {
        const result = await courierService.getCouriers({ type });
        return NextResponse.json(result);
    } catch (e) {
        return NextResponse.json(
            { status: false, message: "Server error" },
            { status: 500 }
        );
    }
}
