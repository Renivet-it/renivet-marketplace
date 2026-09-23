import { NextResponse } from "next/server";
import { buildEmbeddingServiceUrl } from "@/lib/python/service-url";
import { productQueries } from "@/lib/db/queries";
import { toSearchPreviewProducts } from "@/lib/search/search-preview";

async function getDatabaseProductPreviews(query: string) {
    try {
        const result = await productQueries.getProducts({
            page: 1,
            limit: 4,
            search: query,
            isActive: true,
            isAvailable: true,
            isPublished: true,
            isDeleted: false,
            verificationStatus: "approved",
            requireMedia: true,
        });
        return toSearchPreviewProducts(result);
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

    const upstreamUrl = buildEmbeddingServiceUrl("/search/advanced-rag");
    if (!upstreamUrl) {
        return NextResponse.json(await getDatabaseProductPreviews(query));
    }
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
            return NextResponse.json(await getDatabaseProductPreviews(query));
        }

        const data = await response.json();
        const products = toSearchPreviewProducts(data);
        return NextResponse.json(
            products.length > 0
                ? products
                : await getDatabaseProductPreviews(query),
            {
                headers: {
                    "Cache-Control": "private, max-age=15",
                },
            }
        );
    } catch {
        return NextResponse.json(await getDatabaseProductPreviews(query));
    }
}
