import { corporatePaymentRequestService } from "@/lib/services/corporate-payment-request";
import { NextResponse } from "next/server";
import { z } from "zod";

const confirmationSchema = z.object({
    razorpayOrderId: z.string().min(1),
    razorpayPaymentId: z.string().min(1),
    razorpaySignature: z.string().min(1),
});

export async function GET(_request: Request, { params }: { params: Promise<{ token: string }> }) {
    try {
        const { token } = await params;
        return NextResponse.json(await corporatePaymentRequestService.getPublic(token));
    } catch (error) {
        return NextResponse.json({ message: error instanceof Error ? error.message : "Payment request unavailable" }, { status: 404 });
    }
}

export async function POST(request: Request, { params }: { params: Promise<{ token: string }> }) {
    try {
        const { token } = await params;
        const body = await request.json();
        if (body.action === "checkout") return NextResponse.json(await corporatePaymentRequestService.createCheckout(token));
        if (body.action === "confirm") return NextResponse.json(await corporatePaymentRequestService.confirm(token, confirmationSchema.parse(body)));
        return NextResponse.json({ message: "Unsupported action" }, { status: 400 });
    } catch (error) {
        return NextResponse.json({ message: error instanceof Error ? error.message : "Payment request failed" }, { status: 400 });
    }
}
