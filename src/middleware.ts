import { clerkMiddleware } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { cFetch } from "./lib/utils";
import { ResponseData } from "./lib/validations";

export default clerkMiddleware(async (auth, req) => {
    const url = new URL(req.url);
    const res = NextResponse.next();

    if (url.pathname === "/api/webhooks/clerk") return NextResponse.next();

    if (url.pathname === "/support")
        return NextResponse.redirect(new URL("https://dsc.gg/drvgo"), {
            status: 301,
        });

    if (url.pathname === "/auth")
        return NextResponse.redirect(new URL("/auth/signin", url));

    const isAuth = await auth();

    if (isAuth.sessionId) {
        if (url.pathname.startsWith("/auth"))
            return NextResponse.redirect(new URL("/", url));

        const searchParams = new URLSearchParams({
            uId: isAuth.userId,
            path: url.pathname,
        });

        const res = await cFetch<ResponseData>(
            new URL(
                `/api/permission?${searchParams.toString()}`,
                url
            ).toString()
        );
        if (res.error) return NextResponse.redirect(new URL("/", url));
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
