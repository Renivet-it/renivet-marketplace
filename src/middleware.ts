import { authMiddleware } from "@clerk/nextjs";
import { NextResponse } from "next/server";
import { generalSidebarConfig, generateBrandSideNav } from "./config/site";
import { cFetch, getUserPermissions, hasPermission } from "./lib/utils";
import { CachedUser, ResponseData } from "./lib/validations";

// ✅ 1. Use authMiddleware with publicRoutes
export default authMiddleware({
  publicRoutes: [
    "/", // homepage
    "/shop",
    "/about",
    "/contact",
    "/privacy-policy",
    "/terms",
    "/shipping-policy",
    "/refund-policy",
    "/api/webhooks/clerk",
  ],

  // ✅ 2. Custom afterAuth logic
  async afterAuth(auth, req) {
    const url = new URL(req.url);
    const res = NextResponse.next();

    // --- Redirect rules ---
    if (url.pathname === "/support")
      return NextResponse.redirect("https://dsc.gg/drvgo");

    if (url.pathname === "/auth")
      return NextResponse.redirect(new URL("/auth/signin", url));

    if (url.pathname === "/products")
      return NextResponse.redirect(new URL("/shop", url));

    // --- Authenticated routes ---
    if (auth.userId && auth.sessionId) {
      if (url.pathname.startsWith("/auth"))
        return NextResponse.redirect(new URL("/", url));

      const searchParams = new URLSearchParams({
        uId: auth.userId,
        path: url.pathname,
      });

      const result = await cFetch<ResponseData<CachedUser>>(
        new URL(`/api/permission?${searchParams.toString()}`, url).toString()
      );

      if (result.error) return NextResponse.redirect(new URL("/", url));

      const existingUser = result.data!.data!;
      const { brandPermissions, sitePermissions } = getUserPermissions(existingUser.roles);

      // --- Dashboard handling ---
      if (url.pathname.startsWith("/dashboard")) {
        if (url.pathname === "/dashboard") {
          if (existingUser.brand)
            return NextResponse.redirect(
              new URL(`/dashboard/brands/${existingUser.brand.id}/analytics`, url)
            );
          else
            return NextResponse.redirect(new URL("/dashboard/general/banners", url));
        }

        // General routes
        if (url.pathname.startsWith("/dashboard/general")) {
          if (existingUser.brand)
            return NextResponse.redirect(new URL("/dashboard", url));

          const routes = generalSidebarConfig.flatMap((item) => item.items);
          const accessedRoute = routes.find((route) =>
            url.pathname.startsWith(route.url)
          );

          if (accessedRoute) {
            const isAuthorized = hasPermission(sitePermissions, [accessedRoute.permissions]);
            if (!isAuthorized)
              return NextResponse.redirect(new URL("/dashboard", url));
          } else {
            return NextResponse.redirect(new URL("/dashboard", url));
          }
        }

        // Brand routes
        if (url.pathname.startsWith("/dashboard/brands")) {
          if (!existingUser.brand)
            return NextResponse.redirect(new URL("/dashboard", url));

          const routes = generateBrandSideNav(existingUser.brand.id)
            .flatMap((item) => item.items);

          const accessedRoute = routes.find((route) =>
            url.pathname.startsWith(route.url)
          );

          if (accessedRoute) {
            const isAuthorized = hasPermission(brandPermissions, [accessedRoute.permissions]);
            if (!isAuthorized)
              return NextResponse.redirect(new URL(`/dashboard/brands/${existingUser.brand.id}`, url));
          } else {
            return NextResponse.redirect(new URL(`/dashboard/brands/${existingUser.brand.id}`, url));
          }
        }
      }
    }

    // --- Unauthenticated private route protection ---
    if (!auth.sessionId) {
      if (
        url.pathname.startsWith("/dashboard") ||
        url.pathname.startsWith("/profile") ||
        url.pathname.startsWith("/become-a-seller")
      ) {
        return NextResponse.redirect(new URL("/auth/signin", url));
      }
    }

    return res;
  },
});

// ✅ 3. Keep the matcher
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
