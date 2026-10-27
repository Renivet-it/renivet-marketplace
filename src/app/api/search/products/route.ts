import { NextResponse } from "next/server";
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

    // Use the same search, eligibility, pricing and image mapping as the catalog.
    return NextResponse.json(await getDatabaseProductPreviews(query), {
        headers: { "Cache-Control": "private, no-store" },
    });
}
