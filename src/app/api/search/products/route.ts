import { NextResponse } from "next/server";

// const PYTHON_SERVICE_URL =
//     process.env.EMBEDDING_SERVICE_URL || "http://localhost:8000";
const PYTHON_SERVICE_URL = "http://64.227.137.174:8000";

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get("query")?.trim() || "";

    if (query.length < 2) {
        return NextResponse.json([]);
    }

    const upstreamUrl = new URL("/search/advanced-rag", PYTHON_SERVICE_URL);
    upstreamUrl.searchParams.set("query", query);
    upstreamUrl.searchParams.set("limit", "4");

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
