import { NextResponse } from "next/server";
import { buildEmbeddingServiceUrl } from "@/lib/python/service-url";

function toSuggestionStrings(data: unknown): string[] {
    if (!Array.isArray(data)) return [];

    return data
        .map((item) => {
            if (typeof item === "string") return item;
            if (
                item &&
                typeof item === "object" &&
                "text" in item &&
                typeof (item as { text?: unknown }).text === "string"
            ) {
                return (item as { text: string }).text;
            }
            return "";
        })
        .filter(Boolean)
        .slice(0, 10);
}

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get("query")?.trim() || "";

    if (query.length < 2) {
        return NextResponse.json([]);
    }

    const upstreamUrl = buildEmbeddingServiceUrl("/suggestions/ai-suggestions");
    if (!upstreamUrl) return NextResponse.json([]);
    upstreamUrl.searchParams.set("query", query);

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

        return NextResponse.json(toSuggestionStrings(await response.json()), {
            headers: {
                "Cache-Control": "private, max-age=30",
            },
        });
    } catch {
        return NextResponse.json([], { status: 200 });
    }
}
