import { NextResponse } from "next/server";
import { buildEmbeddingServiceUrl } from "@/lib/python/service-url";


export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get("query")?.trim() || "";

    if (query.length < 2) {
        return NextResponse.json([]);
    }

    const upstreamUrl = buildEmbeddingServiceUrl("/search/advanced-rag");
    if (!upstreamUrl) return NextResponse.json([]);
    upstreamUrl.searchParams.set("query", query);
    upstreamUrl.searchParams.set("limit", "4");

    try {
        const response = await fetch(upstreamUrl, {
            signal: AbortSignal.any([request.signal, AbortSignal.timeout(5000)]),
            headers: {
                Accept: "application/json",
            },
            cache: "no-store",
            redirect: "error",
        });

        if (!response.ok) {
            return NextResponse.json([], { status: 200 });
        }

        const data = await response.json();
        return NextResponse.json(Array.isArray(data) ? data.slice(0, 4) : [], {
            headers: {
                "Cache-Control": "private, max-age=15",
            },
        });
    } catch {
        return NextResponse.json([], { status: 200 });
    }
}
