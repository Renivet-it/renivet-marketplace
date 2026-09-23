import { NextResponse } from "next/server";
import { buildEmbeddingServiceUrl } from "@/lib/python/service-url";
import { getSuggestions } from "@/lib/search/search-engine";
import { toSuggestionStrings } from "@/lib/search/search-preview";

async function getDatabaseSuggestions(query: string) {
    try {
        return toSuggestionStrings(await getSuggestions(query, 6));
    } catch {
        return [];
    }
}

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get("query")?.trim() || "";

    if (query.length < 2) {
        return NextResponse.json([]);
    }

    const upstreamUrl = buildEmbeddingServiceUrl("/suggestions/ai-suggestions");
    if (!upstreamUrl) {
        return NextResponse.json(await getDatabaseSuggestions(query));
    }
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
            return NextResponse.json(await getDatabaseSuggestions(query));
        }

        const suggestions = toSuggestionStrings(await response.json());
        return NextResponse.json(
            suggestions.length > 0
                ? suggestions
                : await getDatabaseSuggestions(query),
            {
                headers: {
                    "Cache-Control": "private, max-age=30",
                },
            }
        );
    } catch {
        return NextResponse.json(await getDatabaseSuggestions(query));
    }
}
