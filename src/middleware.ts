import { clerkMiddleware } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { generalSidebarConfig, generateBrandSideNav } from "./config/site";
import { cFetch, getUserPermissions, hasPermission } from "./lib/utils";
import { CachedUser, ResponseData } from "./lib/validations";

export default clerkMiddleware(async (auth, req) => {
    const url = new URL(req.url);
    const res = NextResponse.next();

    // ✅ 1. Allow public pages without auth
    const publicRoutes = [
        "/", // homepage
        "/shop",
        "/about",
        "/contact",
        "/privacy-policy",
        "/terms",
        "/shipping-policy",
        "/refund-policy",
        "/api/webhooks/clerk",
    ];

    // If the path is public, skip auth checks
    if (publicRoutes.some((route) => url.pathname === route || url.pathname.startsWith(route)))
        return NextResponse.next();

    // ✅ 2. Redirect rules
    if (url.pathname === "/support")
        return NextResponse.redirect(new URL("https://dsc.gg/drvgo"), { status: 301 });

    if (url.pathname === "/auth")
        return NextResponse.redirect(new URL("/auth/signin", url));

    if (url.pathname === "/products")
        return NextResponse.redirect(new URL("/shop", url));

    // ✅ 3. Authenticated routes
    const isAuth = await auth();

    if (isAuth.sessionId) {
        if (url.pathname.startsWith("/auth"))
            return NextResponse.redirect(new URL("/", url));

        const searchParams = new URLSearchParams({
            uId: isAuth.userId,
            path: url.pathname,
        });

        const res = await cFetch<ResponseData<CachedUser>>(
            new URL(`/api/permission?${searchParams.toString()}`, url).toString()
        );

        if (res.error) return NextResponse.redirect(new URL("/", url));

        if (url.pathname.startsWith("/dashboard")) {
            const existingUser = res.data!.data!;
            const { brandPermissions, sitePermissions } = getUserPermissions(existingUser.roles);

            if (url.pathname === "/dashboard") {
                if (existingUser.brand)
                    return NextResponse.redirect(
                        new URL(`/dashboard/brands/${existingUser.brand.id}/analytics`, url)
                    );
                else
                    return NextResponse.redirect(new URL("/dashboard/general/banners", url));
            }

            if (url.pathname.startsWith("/dashboard/general")) {
                if (existingUser.brand)
                    return NextResponse.redirect(new URL("/dashboard", url));

                const routes = generalSidebarConfig.flatMap((item) => item.items);
                if (url.pathname !== "/dashboard/general") {
                    if (
                        [
                            "/dashboard/general/terms",
                            "/dashboard/general/privacy",
                            "/dashboard/general/shipping-policy",
                            "/dashboard/general/refund-policy",
                        ].includes(url.pathname)
                    )
                        return NextResponse.next();

                    const accessedRoute = routes.find((route) =>
                        url.pathname.startsWith(route.url)
                    );
                    if (!accessedRoute)
                        return NextResponse.redirect(new URL("/dashboard", url));

                    const isAuthorized = hasPermission(sitePermissions, [accessedRoute.permissions]);
                    if (!isAuthorized)
                        return NextResponse.redirect(new URL("/dashboard", url));
                }
            }

            if (url.pathname.startsWith("/dashboard/brands")) {
                if (!existingUser.brand)
                    return NextResponse.redirect(new URL("/dashboard", url));

                if (url.pathname === "/dashboard/brands")
                    return NextResponse.redirect(
                        new URL(`/dashboard/brands/${existingUser.brand.id}`, url)
                    );

                const routes = generateBrandSideNav(existingUser.brand.id)
                    .flatMap((item) => item.items);

                if (url.pathname !== `/dashboard/brands/${existingUser.brand.id}`) {
                    const accessedRoute = routes.find((route) =>
                        url.pathname.startsWith(route.url)
                    );
                    if (!accessedRoute)
                        return NextResponse.redirect(
                            new URL(`/dashboard/brands/${existingUser.brand.id}`, url)
                        );

                    const isAuthorized = hasPermission(brandPermissions, [
                        accessedRoute.permissions,
                    ]);
                    if (!isAuthorized)
                        return NextResponse.redirect(
                            new URL(`/dashboard/brands/${existingUser.brand.id}`, url)
                        );
                }
            }
        }
    }

    // ✅ 4. If not signed in, protect private routes
    if (!isAuth.sessionId)
        if (
            url.pathname.startsWith("/dashboard") ||
            url.pathname.startsWith("/profile") ||
            url.pathname.startsWith("/become-a-seller")
        )
            return NextResponse.redirect(new URL("/auth/signin", url));

    return res;
});

export const config = {
    matcher: [
        "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|mp4|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
        "/(api(?!/webhooks/clerk)|trpc)(.*)",
        "/",
        "/dashboard/:path*",
        "/profile/:path*",
        "/auth/:path*",
        "/become-a-seller",
    ],
};
