import { requireCronSecret } from "@/lib/auth/cron-access";
import {
    EMBEDDING_SYNC_BATCH_SIZE,
    syncProductEmbeddings,
} from "@/lib/search/embedding-sync";
import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
    const denied = requireCronSecret(request);
    if (denied) return denied;

    try {
        const result = await syncProductEmbeddings();
        return NextResponse.json(
            {
                ok: true,
                batchSize: EMBEDDING_SYNC_BATCH_SIZE,
                ...result,
            },
            { headers: { "Cache-Control": "no-store" } }
        );
    } catch {
        return NextResponse.json(
            { ok: false, error: "Embedding sync failed" },
            {
                status: 500,
                headers: { "Cache-Control": "no-store" },
            }
        );
    }
}
