import { createOrder } from "@/lib/delhivery/orders";
import { NextResponse } from "next/server";
import { z } from "zod";

const forwardOrderSchema = z.object({
    pickup_location: z.object({
        name: z.string().min(1),
    }),
    shipments: z
        .array(
            z.object({
                name: z.string().min(1),
                add: z.string().min(1),
                pin: z.string().min(1),
                city: z.string().optional(),
                country: z.string().optional(),
                phone: z.string().min(1),
                order: z.string().min(1),
                payment_mode: z.enum(["Prepaid", "COD"]),
                shipping_mode: z.enum(["Surface", "Express"]).optional(),
                quantity: z.string().optional(),
                total_amount: z.number().optional(),
                products_desc: z.string().optional(),
            })
        )
        .min(1),
});

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const parsed = forwardOrderSchema.parse(body);
        const result = await createOrder({
            format: "json",
            ...parsed,
        });

        if (!result.success) {
            return NextResponse.json(
                {
                    success: false,
                    message:
                        typeof result.error === "string"
                            ? result.error
                            : "Failed to create Delhivery forward order",
                },
                { status: 400 }
            );
        }

        return NextResponse.json({
            success: true,
            data: result.data,
        });
    } catch (error) {
        const message =
            error instanceof Error
                ? error.message
                : "Delhivery forward order failed";

        return NextResponse.json(
            {
                success: false,
                message,
            },
            { status: 500 }
        );
    }
}
