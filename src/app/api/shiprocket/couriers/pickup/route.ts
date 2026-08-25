import { courierService } from "@/actions/shiprocket/couriers";
import { requireLogisticsStaff } from "@/lib/auth/logistics-access";
import { PostShipmentPickupBody } from "@/lib/shiprocket/validations/request/couriers";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
    const denied = await requireLogisticsStaff();
    if (denied) return denied;
    const body: PostShipmentPickupBody = await req.json();
    try {
        if (!body.shipment_id || isNaN(body.shipment_id)) {
            return NextResponse.json(
                {
                    status: false,
                    message: "shipment_id is required and must be a number.",
                },
                { status: 400 }
            );
        }
        const result = await courierService.requestShipment(body);
        return NextResponse.json(result);
    } catch (e) {
        return NextResponse.json(
            { status: false, message: "Server error" },
            { status: 500 }
        );
    }
}
