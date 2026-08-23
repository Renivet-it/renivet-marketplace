import { courierService } from "@/actions/shiprocket/couriers";
import { requireLogisticsStaff } from "@/lib/auth/logistics-access";
import { parseCourierParams } from "@/lib/shiprocket/helper";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
    const denied = await requireLogisticsStaff();
    if (denied) return denied;
    const { searchParams } = new URL(req.url);
    const params = parseCourierParams(searchParams);
    try {
        if (isNaN(params.pickup_postcode) || isNaN(params.delivery_postcode)) {
            return NextResponse.json(
                {
                    status: false,
                    message:
                        "pickup_postcode and delivery_postcode are required and must be numbers.",
                },
                { status: 400 }
            );
        }

        const result =
            await courierService.getCouriersForDeliveryLocation(params);
        return NextResponse.json(result);
    } catch (e) {
        return NextResponse.json(
            { status: false, message: "Server error" },
            { status: 500 }
        );
    }
}
