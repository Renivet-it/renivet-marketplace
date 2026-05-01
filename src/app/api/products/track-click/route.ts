import { productQueries } from "@/lib/db/queries";
import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
    try {
        const { productId, brandId } = await req.json();

        if (!productId || !brandId) {
            return NextResponse.json(
                { success: false, error: "Missing productId or brandId" },
                { status: 400 }
            );
        }

        const { userId } = await auth();

        await productQueries.trackProductClick(
            productId,
            brandId,
            userId ?? undefined
        );

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Error tracking product click:", error);
        return NextResponse.json(
            { success: false, error: "Failed to track click" },
            { status: 500 }
        );
    }
}
