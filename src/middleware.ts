import { clerkMiddleware } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { generalSidebarConfig, generateBrandSideNav } from "./config/site";
import { cFetch, getUserPermissions, hasPermission } from "./lib/utils";
import { CachedUser, ResponseData } from "./lib/validations";

export default clerkMiddleware(async (auth, req) => {
    const url = new URL(req.url);
    const res = NextResponse.next();
    const supportQueue = url.searchParams.get("queue");

    if (url.pathname === "/api/webhooks/clerk") return NextResponse.next();

    if (url.pathname === "/support")
        return NextResponse.redirect(new URL("https://dsc.gg/drvgo"), {
            status: 301,
        });

    if (url.pathname === "/auth")
        return NextResponse.redirect(new URL("/auth/signin", url));

    if (url.pathname === "/products")
        return NextResponse.redirect(new URL("/shop", url));

    const isAuth = await auth();

    if (isAuth.sessionId) {
        if (url.pathname.startsWith("/auth"))
            return NextResponse.redirect(new URL("/", url));

        const searchParams = new URLSearchParams({
            uId: isAuth.userId,
            path: url.pathname,
        });

        const res = await cFetch<ResponseData<CachedUser>>(
            new URL(
                `/api/permission?${searchParams.toString()}`,
                url
            ).toString()
        );
        if (res.error) return NextResponse.redirect(new URL("/", url));

        if (url.pathname.startsWith("/dashboard")) {
            const existingUser = res.data!.data!;
            const { brandPermissions, sitePermissions } = getUserPermissions(
                existingUser.roles
            );

            if (url.pathname === "/dashboard") {
                if (existingUser.brand) {
                    return NextResponse.redirect(
                        new URL(
                            `/dashboard/brands/${existingUser.brand.id}/analytics`,
                            url
                        )
                    );
                } else {
                    // Find the first route the user has permission for
                    const allRoutes = generalSidebarConfig
                        .map((item) => item.items.map((subItem) => subItem))
                        .flat();

                    const monitoringRoute = allRoutes.find(
                        (route) =>
                            route.url === "/dashboard/general/monitoring-sla"
                    );
                    if (
                        monitoringRoute &&
                        hasPermission(
                            sitePermissions,
                            [monitoringRoute.permissions],
                            "any"
                        )
                    ) {
                        return NextResponse.redirect(
                            new URL(monitoringRoute.url, url)
                        );
                    }

                    // Prioritize Products page if user has access
                    const productsRoute = allRoutes.find(
                        (route) => route.url === "/dashboard/general/products"
                    );
                    if (
                        productsRoute &&
                        hasPermission(
                            sitePermissions,
                            [productsRoute.permissions],
                            "any"
                        )
                    ) {
                        return NextResponse.redirect(
                            new URL(productsRoute.url, url)
                        );
                    }

                    const firstAccessibleRoute = allRoutes.find((route) =>
                        hasPermission(
                            sitePermissions,
                            [route.permissions],
                            "any"
                        )
                    );

                    if (firstAccessibleRoute) {
                        return NextResponse.redirect(
                            new URL(firstAccessibleRoute.url, url)
                        );
                    }
                    // If no accessible route found, redirect to home
                    return NextResponse.redirect(new URL("/", url));
                }
            }

            if (url.pathname.startsWith("/dashboard/general")) {
                if (existingUser.brand)
                    return NextResponse.redirect(new URL("/dashboard", url));

                const routes = generalSidebarConfig
                    .map((item) => item.items.map((subItem) => subItem))
                    .flat();

                if (url.pathname !== "/dashboard/general") {
                    if (
                        url.pathname === "/dashboard/general/terms" ||
                        url.pathname === "/dashboard/general/privacy" ||
                        url.pathname === "/dashboard/general/shipping-policy" ||
                        url.pathname === "/dashboard/general/refund-policy"
                    )
                        return NextResponse.next();

                    const accessedRoute = routes.find((route) => {
                        if (
                            url.pathname === "/dashboard/general/support" &&
                            supportQueue
                        ) {
                            if (
                                supportQueue === "user" &&
                                route.url === "/dashboard/general/support/user"
                            )
                                return true;
                            if (
                                supportQueue === "brand" &&
                                route.url === "/dashboard/general/support/brand"
                            )
                                return true;
                            if (
                                supportQueue === "disputes" &&
                                route.url ===
                                    "/dashboard/general/support/disputes"
                            )
                                return true;
                        }

                        return url.pathname.startsWith(route.url);
                    });
                    if (!accessedRoute)
                        return NextResponse.redirect(
                            new URL("/dashboard", url)
                        );

                    const isAuthorized = hasPermission(
                        sitePermissions,
                        [accessedRoute.permissions],
                        "any"
                    );
                    if (!isAuthorized)
                        return NextResponse.redirect(
                            new URL("/dashboard", url)
                        );
                }
            }

            if (url.pathname.startsWith("/dashboard/brands")) {
                if (!existingUser.brand)
                    return NextResponse.redirect(new URL("/dashboard", url));
                const userBrand = existingUser.brand;

                if (url.pathname === "/dashboard/brands")
                    return NextResponse.redirect(
                        new URL(
                            `/dashboard/brands/${userBrand.id}`,
                            url
                        )
                    );

                const routes = generateBrandSideNav(userBrand.id)
                    .map((item) => item.items.map((subItem) => subItem))
                    .flat();

                if (
                    url.pathname !==
                    `/dashboard/brands/${userBrand.id}`
                ) {
                    const accessedRoute = routes.find((route) => {
                        if (
                            url.pathname ===
                                `/dashboard/brands/${userBrand.id}/support` &&
                            (supportQueue === "support" ||
                                supportQueue === "disputes")
                        ) {
                            if (
                                supportQueue === "support" &&
                                route.url ===
                                    `/dashboard/brands/${userBrand.id}/support?queue=support`
                            )
                                return true;
                            if (
                                supportQueue === "disputes" &&
                                route.url ===
                                    `/dashboard/brands/${userBrand.id}/support/disputes`
                            )
                                return true;
                        }

                        return url.pathname.startsWith(route.url);
                    });
                    if (!accessedRoute)
                        return NextResponse.redirect(
                            new URL(
                                `/dashboard/brands/${userBrand.id}`,
                                url
                            )
                        );

                    const isAuthorized = hasPermission(
                        brandPermissions,
                        [accessedRoute.permissions],
                        "any"
                    );
                    if (!isAuthorized)
                        return NextResponse.redirect(
                            new URL(
                                `/dashboard/brands/${userBrand.id}`,
                                url
                            )
                        );
                }
            }
        }
    }

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
