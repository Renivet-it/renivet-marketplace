import { BitFieldSitePermission } from "@/config/permissions";
import { mediaCache, userCache } from "@/lib/redis/methods";
import { getUserPermissions, hasPermission } from "@/lib/utils";
import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

interface RouteProps {
    params: Promise<{ id: string }>;
}

export async function GET(_: Request, { params }: RouteProps) {
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
        const upstream = await fetch(media.url, {
            headers: { Accept: media.type || "image/*" },
            next: { revalidate: 300 },
        });
        if (!upstream.ok || !upstream.body) {
            return new NextResponse("Media unavailable", { status: 502 });
        }

        const headers = new Headers({
            "Cache-Control":
                "private, max-age=300, stale-while-revalidate=3600",
            "Content-Type": upstream.headers.get("content-type") ?? media.type,
        });
        const contentLength = upstream.headers.get("content-length");
        if (contentLength) headers.set("Content-Length", contentLength);

        return new NextResponse(upstream.body, { headers });
    } catch {
        return new NextResponse("Media unavailable", { status: 502 });
    }
}
