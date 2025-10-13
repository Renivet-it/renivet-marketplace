import { clerkMiddleware } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { generalSidebarConfig, generateBrandSideNav } from "./config/site";
import { cFetch, getUserPermissions, hasPermission } from "./lib/utils";
import { CachedUser, ResponseData } from "./lib/validations";

export default clerkMiddleware(async (auth, req) => {
  const url = new URL(req.url);
  const res = NextResponse.next();

  // ✅ Define public routes (no auth)
  const publicRoutes = [
    "/",
    "/shop",
    "/about",
    "/contact",
    "/privacy-policy",
    "/terms",
    "/shipping-policy",
    "/refund-policy",
    "/api/webhooks/clerk",
  ];

  // ✅ Skip Clerk auth for public routes
  if (publicRoutes.some((route) => url.pathname === route || url.pathname.startsWith(route))) {
    return NextResponse.next();
  }

  // --- Redirect rules ---
  if (url.pathname === "/support") {
    return NextResponse.redirect("https://dsc.gg/drvgo");
  }

  if (url.pathname === "/auth") {
    return NextResponse.redirect(new URL("/auth/signin", url));
  }

  if (url.pathname === "/products") {
    return NextResponse.redirect(new URL("/shop", url));
  }

  // --- Signed-in user handling ---
  const isAuth = await auth();

  if (isAuth.userId && isAuth.sessionId) {
    if (url.pathname.startsWith("/auth")) {
      return NextResponse.redirect(new URL("/", url));
    }

    const searchParams = new URLSearchParams({
      uId: isAuth.userId,
      path: url.pathname,
    });

    const result = await cFetch<ResponseData<CachedUser>>(
      new URL(`/api/permission?${searchParams.toString()}`, url).toString()
    );

    if (result.error) return NextResponse.redirect(new URL("/", url));

    const existingUser = result.data!.data!;
    const { brandPermissions, sitePermissions } = getUserPermissions(existingUser.roles);

    // --- Dashboard routing ---
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

        if (!accessedRoute)
          return NextResponse.redirect(new URL("/dashboard", url));

        const isAuthorized = hasPermission(sitePermissions, [accessedRoute.permissions]);
        if (!isAuthorized)
          return NextResponse.redirect(new URL("/dashboard", url));
      }

      // Brand routes
      if (url.pathname.startsWith("/dashboard/brands")) {
        if (!existingUser.brand)
          return NextResponse.redirect(new URL("/dashboard", url));

        const routes = generateBrandSideNav(existingUser.brand.id).flatMap((i) => i.items);
        const accessedRoute = routes.find((route) =>
          url.pathname.startsWith(route.url)
        );

        if (!accessedRoute)
          return NextResponse.redirect(
            new URL(`/dashboard/brands/${existingUser.brand.id}`, url)
          );

        const isAuthorized = hasPermission(brandPermissions, [accessedRoute.permissions]);
        if (!isAuthorized)
          return NextResponse.redirect(
            new URL(`/dashboard/brands/${existingUser.brand.id}`, url)
          );
      }
    }
  }

  // --- Signed-out protection for private routes ---
  const isAuthSignedOut = await auth();
  if (!isAuthSignedOut.sessionId) {
    if (
      url.pathname.startsWith("/dashboard") ||
      url.pathname.startsWith("/profile") ||
      url.pathname.startsWith("/become-a-seller")
    ) {
      return NextResponse.redirect(new URL("/auth/signin", url));
    }
  }

  return res;
});

// ✅ Matcher remains the same
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
