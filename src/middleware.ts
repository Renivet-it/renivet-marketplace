import { clerkMiddleware } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

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

        if (url.pathname === "/dashboard/guilds")
            return NextResponse.redirect(new URL("/dashboard", url));
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
