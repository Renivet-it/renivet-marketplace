import { env } from "@/../env";
import {
    syncAllActiveBrandUnicommerceInventory,
    syncBrandUnicommerceInventory,
} from "@/lib/unicommerce/sync";
import { NextRequest, NextResponse } from "next/server";

function isAuthorized(request: NextRequest) {
    const secret = env.UNICOMMERCE_CRON_SECRET;
    if (!secret) return true;

    const headerSecret = request.headers.get("x-cron-secret");
    return headerSecret === secret;
}

export async function GET(request: NextRequest) {
    if (!isAuthorized(request)) {
        return NextResponse.json(
            {
                ok: false,
                error: "Unauthorized",
            },
            { status: 401 }
        );
    }

    const { searchParams } = new URL(request.url);
    const brandId = searchParams.get("brandId");
    const updatedSince = Number(searchParams.get("updatedSince")) || 60;
    const skusParam = searchParams.get("skus");
    const skus = skusParam ? skusParam.split(",").map((s) => s.trim()) : [];

    try {
        if (brandId) {
            const data = await syncBrandUnicommerceInventory(brandId, {
                updatedSinceMinutes: updatedSince,
                skus,
            });

            return NextResponse.json({
                ok: true,
                message: "Brand Unicommerce inventory sync completed",
                data,
            });
        }

        const data = await syncAllActiveBrandUnicommerceInventory({
            updatedSinceMinutes: updatedSince,
            skus,
        });

        return NextResponse.json({
            ok: true,
            message: "All active brand Unicommerce inventory sync completed",
            data,
        });
    } catch (error) {
        return NextResponse.json(
            {
                ok: false,
                error: error instanceof Error ? error.message : "Unknown error",
            },
            { status: 500 }
        );
    }
}