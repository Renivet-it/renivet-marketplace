import { BitFieldSitePermission } from "@/config/permissions";
import {
    getAdminMediaTransform,
    resolveAdminMediaSourceUrl,
} from "@/lib/media/admin-media-transform";
import { mediaCache, userCache } from "@/lib/redis/methods";
import { getUserPermissions, hasPermission } from "@/lib/utils";
import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import sharp from "sharp";
import { UTApi } from "uploadthing/server";

interface RouteProps {
    params: Promise<{ id: string }>;
}

const utApi = new UTApi();

export async function GET(request: Request, { params }: RouteProps) {
    const { userId } = await auth();
    if (!userId) return new NextResponse("Unauthorized", { status: 401 });

    const user = await userCache.get(userId);
    if (!user) return new NextResponse("Unauthorized", { status: 401 });

    const { id } = await params;
    const media = (await mediaCache.getByIds([id])).data[0];
    if (!media) return new NextResponse("Media not found", { status: 404 });

    const sitePermissions = getUserPermissions(user.roles).sitePermissions;
    const canAccess =
        hasPermission(sitePermissions, [
            BitFieldSitePermission.ADMINISTRATOR,
        ]) ||
        hasPermission(sitePermissions, [
            BitFieldSitePermission.MANAGE_PRODUCTS,
        ]) ||
        user.brand?.id === media.brandId;
    if (!canAccess) return new NextResponse("Forbidden", { status: 403 });

    try {
        const sourceUrl = await resolveAdminMediaSourceUrl(
            media.url,
            async (key) => (await utApi.getSignedURL(key)).url
        );
        const upstream = await fetch(sourceUrl, {
            headers: { Accept: "image/*" },
            cache: "no-store",
        });
        const contentType = upstream.headers.get("content-type");
        if (!upstream.ok || !contentType?.startsWith("image/")) {
            return new NextResponse("Media unavailable", { status: 502 });
        }

        const { width, quality } = getAdminMediaTransform(new URL(request.url));
        const optimized = await sharp(await upstream.arrayBuffer())
            .rotate()
            .resize({
                width,
                height: width,
                fit: "inside",
                withoutEnlargement: true,
            })
            .webp({ quality })
            .toBuffer();

        const headers = new Headers({
            "Cache-Control":
                "private, max-age=3600, stale-while-revalidate=86400",
            "Content-Length": String(optimized.byteLength),
            "Content-Type": "image/webp",
        });

        return new NextResponse(optimized, { headers });
    } catch {
        return new NextResponse("Media unavailable", { status: 502 });
    }
}
