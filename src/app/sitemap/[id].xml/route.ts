import { loadSitemapShard, renderSitemapXml } from "@/lib/seo/sitemap";
import { SITEMAP_BASE_URL, sitemapDataSource } from "@/lib/seo/sitemap-data";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(
    _request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params;

    if (!/^\d+$/.test(id)) {
        return new NextResponse("Not Found", { status: 404 });
    }

    const pageId = Number(id);
    if (!Number.isSafeInteger(pageId)) {
        return new NextResponse("Not Found", { status: 404 });
    }

    const entries = await loadSitemapShard({
        baseUrl: SITEMAP_BASE_URL,
        pageId,
        source: sitemapDataSource,
    });

    return new NextResponse(renderSitemapXml(entries), {
        headers: {
            "Content-Type": "application/xml; charset=utf-8",
        },
    });
}
