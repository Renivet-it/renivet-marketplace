import { courierService } from "@/actions/shiprocket/couriers";
import { AWB } from "@/lib/shiprocket/validations/request";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
    const body: AWB = await req.json();

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
        const result = await courierService.returnAwbGenerate(body);

        return NextResponse.json(result);
    } catch (e) {
        return NextResponse.json(
            { status: false, message: "Server error" },
            { status: 500 }
        );
    }
}
