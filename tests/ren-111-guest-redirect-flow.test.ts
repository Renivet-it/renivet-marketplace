import { describe, expect, test } from "bun:test";

const source = (path: string) =>
    Bun.file(new URL(`../${path}`, import.meta.url)).text();

describe("REN-111 guest redirect flow", () => {
    test("keeps the requested destination through sign-in completion and sign-up switching", async () => {
        const signIn = await source("src/components/auth/phone-first-sign-in.tsx");

        expect(signIn).toContain('getSafeRedirectUrl(searchParams.get("redirect_url"))');
        expect(signIn).toContain("window.location.assign(destination)");
        expect(signIn).toContain("redirectUrlComplete: destination");
        expect(signIn).toContain(
            "href={`/auth/signup?redirect_url=${encodeURIComponent(destination)}`}"
        );
    });

    test("keeps the requested destination through sign-up and Google completion", async () => {
        const signUp = await source("src/components/auth/phone-first-sign-up.tsx");

        expect(signUp).toContain('getSafeRedirectUrl(searchParams.get("redirect_url"))');
        expect(signUp).toContain("router.push(destination)");
        expect(signUp).toContain("redirectUrlComplete: destination");
        expect(signUp).toContain(
            "href={`/auth/signin?redirect_url=${encodeURIComponent(destination)}`}"
        );
    });

    test("retains destination state after refresh and does not let account-sync failure block completion", async () => {
        const signIn = await source("src/components/auth/phone-first-sign-in.tsx");

        expect(signIn).toContain("useSearchParams()");
        expect(signIn).toContain(
            'await fetch("/api/account/sync", { method: "POST" }).catch('
        );
        expect(signIn).toContain("window.location.assign(destination)");
    });

    test("preserves guest cart redirects and uses destination-bearing guards for Corporate Orders and Seller", async () => {
        const [guestCart, middleware, seller] = await Promise.all([
            source("src/app/(protected)/mycart/Component/guest-cart-page.tsx"),
            source("src/middleware.ts"),
            source("src/app/(home)/become-a-seller/page.tsx"),
        ]);

        expect(guestCart).toContain('"/auth/signin?redirect_url=/mycart"');
        expect(middleware).toContain(
            "buildAuthRedirectUrl(`${url.pathname}${url.search}`)"
        );
        expect(seller).toContain(
            'redirect(buildAuthRedirectUrl("/become-a-seller"))'
        );
    });
});
