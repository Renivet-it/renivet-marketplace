import { courierService } from "@/actions/shiprocket/couriers";
import { requireLogisticsStaff } from "@/lib/auth/logistics-access";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
    const denied = await requireLogisticsStaff();
    if (denied) return denied;
    const body = await req.json();
    try {
        const result = await courierService.returnShipment(body);
        return NextResponse.json(result);
    } catch (e) {
        console.error("Error processing return shipment:", e);
        return NextResponse.json(
            { status: false, message: "Server error" },
            { status: 500 }
        );
    }
}
