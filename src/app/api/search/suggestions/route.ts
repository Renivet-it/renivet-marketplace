import { NextResponse } from "next/server";

// const PYTHON_SERVICE_URL =
//     process.env.EMBEDDING_SERVICE_URL || "http://localhost:8000";
// const PYTHON_SERVICE_URL =
//     process.env.EMBEDDING_SERVICE_URL || "http://64.227.137.174:8000";
const PYTHON_SERVICE_URL = "http://64.227.137.174:8000";

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

    const upstreamUrl = new URL("/suggestions/ai-suggestions", PYTHON_SERVICE_URL);
    upstreamUrl.searchParams.set("query", query);

    try {
        const response = await fetch(upstreamUrl, {
            signal: request.signal,
            headers: {
                Accept: "application/json",
            },
            cache: "no-store",
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
