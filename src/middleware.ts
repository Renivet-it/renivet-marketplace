import { clerkMiddleware } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { BitFieldSitePermission } from "./config/permissions";
import { userCache } from "./lib/redis/methods";
import { getUserPermissions, hasPermission } from "./lib/utils";

export default clerkMiddleware(async (auth, req) => {
    const url = new URL(req.url);
    const res = NextResponse.next();

    if (url.pathname === "/support")
        return NextResponse.redirect(new URL("https://dsc.gg/drvgo"), {
            status: 301,
        });

    if (url.pathname === "/auth")
        return NextResponse.redirect(new URL("/auth/signin", url));

    const isAuth = await auth();

    if (isAuth.sessionId) {
        if (url.pathname === "/auth/signin")
            return NextResponse.redirect(new URL("/dashboard", url));

        const existingUser = await userCache.get(isAuth.userId);
        if (!existingUser)
            return NextResponse.redirect(new URL("/auth/signin", url));

        const { sitePermissions } = getUserPermissions(existingUser.roles);

        if (url.pathname.startsWith("/dashboard")) {
            const isAuthorized = hasPermission(sitePermissions, [
                BitFieldSitePermission.VIEW_PROTECTED_PAGES,
            ]);
            if (!isAuthorized) return NextResponse.redirect(new URL("/", url));
        }
    }

    if (!isAuth.sessionId)
        if (url.pathname.startsWith("/dashboard"))
            return NextResponse.redirect(new URL("/auth/signin", url));

    return res;
});

export const config = {
    matcher: [
        "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
        "/(api|trpc)(.*)",
        "/",
        "/dashboard/:path*",
        "/auth/:path*",
    ],
};
