import { renderSitemapIndexXml } from "@/lib/seo/sitemap";
import {
    getSitemapPageCountFromDatabase,
    SITEMAP_BASE_URL,
} from "@/lib/seo/sitemap-data";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET() {
    const pageCount = await getSitemapPageCountFromDatabase();

    return new NextResponse(
        renderSitemapIndexXml({
            baseUrl: SITEMAP_BASE_URL,
            pageCount,
        }),
        {
            headers: {
                "Content-Type": "application/xml; charset=utf-8",
            },
        }
    );
}
