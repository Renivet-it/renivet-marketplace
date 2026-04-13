import { env } from "@/../env";
import { syncUnicommerceInventory } from "@/lib/unicommerce/sync";
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
    const updatedSince = Number(searchParams.get("updatedSince")) || 60;
    const skusParam = searchParams.get("skus");
    const skus = skusParam ? skusParam.split(",").map((s) => s.trim()) : [];

    try {
        const result = await syncUnicommerceInventory({
            updatedSinceMinutes: updatedSince,
            skus,
        });

        return NextResponse.json({
            ok: true,
            message: "Unicommerce inventory sync completed",
            data: result,
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