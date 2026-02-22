import { ClientProvider, ServerProvider } from "@/components/providers";
import { Toaster } from "@/components/ui/sonner";
import { siteConfig } from "@/config/site";
import { cn, getAbsoluteURL } from "@/lib/utils";
import type { Metadata, Viewport } from "next";
import { dmsans, josefin, playfair, rubik, worksans } from "./fonts";
import "./globals.css";
import { env } from "@/../env";
import { FB_PIXEL_ID } from "@/lib/fbpixel";
import { GoogleAnalytics } from "@next/third-parties/google";
import Script from "next/script";
import { MergeGuestCart } from "../components/globals/layouts/guest/merge-guest-cart";
import { MergeGuestWishlist } from "../components/globals/layouts/guest/merge-guest-wishlist";
import FacebookPixel from "./facebook-pixel";

export const viewport: Viewport = {
    themeColor: [
        { media: "(prefers-color-scheme: light)", color: "white" },
        { media: "(prefers-color-scheme: dark)", color: "black" },
    ],
    colorScheme: "light",
    width: "device-width",
    initialScale: 1,
    maximumScale: 1,
};

export const metadata: Metadata = {
    title: {
        default: `${siteConfig.name} | Sustainable Marketplace for Quality Products`,
        template: "%s | " + siteConfig.name,
    },
    description:
        "Renivet is a sustainable online marketplace connecting conscious consumers with high-quality, eco-friendly brands. Discover verified sellers, transparent pricing, and responsibly sourced products — because better choices build a better world.",
    keywords: [
        "Renivet",
        "sustainable marketplace",
        "eco friendly shopping",
        "ethical brands",
        "green products",
        "responsible sourcing",
        "online shopping India",
        "sustainable lifestyle",
        "shop eco brands",
    ],
    authors: [
        {
            name: `${siteConfig.name} Team`,
            url: getAbsoluteURL("/about#team"),
        },
    ],
    publisher: `${siteConfig.name} Team`,
    formatDetection: {
        email: false,
        address: false,
        telephone: false,
    },
    referrer: "origin-when-cross-origin",
    category: "Sustainable Shopping & Lifestyle",
    appleWebApp: {
        capable: true,
        statusBarStyle: "black-translucent",
        title: siteConfig.name,
    },
    creator: siteConfig.name,
    openGraph: {
        title: "Renivet | Sustainable Marketplace for a Better Future",
        description:
            "Shop responsibly with Renivet — your trusted sustainable marketplace featuring eco-conscious brands, verified sellers, and ethically sourced products.",
        url: getAbsoluteURL(),
        siteName: siteConfig.name,
        images: [
            {
                ...siteConfig.og,
                alt: "Renivet - Sustainable Marketplace",
            },
        ],
        locale: "en_US",
        type: "website",
    },
    twitter: {
        card: "summary_large_image",
        title: "Renivet | Sustainable Marketplace for a Better Future",
        description:
            "Discover eco-friendly, ethically made products from verified brands on Renivet. Shop consciously and make a difference.",
        images: [siteConfig.og.url],
        creator: "@itsdrvgo",
    },
    icons: {
        icon: [
            {
                url: "/favicon.ico",
                sizes: "32x32",
                type: "image/x-icon",
            },
            {
                url: "/favicon-96x96.png",
                sizes: "96x96",
                type: "image/png",
            },
        ],
        apple: "/apple-touch-icon.png",
    },
    manifest: "/site.webmanifest",
    metadataBase: new URL(getAbsoluteURL()),
};

export default function RootLayout({ children }: LayoutProps) {
    return (
        <html
            lang="en"
            suppressHydrationWarning
            className={cn(
                josefin.variable,
                dmsans.variable,
                rubik.variable,
                playfair.variable,
                worksans.variable
            )}
        >
            <head>
                <link
                    rel="preconnect"
                    href="https://fonts.gstatic.com"
                    crossOrigin="anonymous"
                />
                {/* Preconnect to UploadThing CDN for faster image loads */}
                <link
                    rel="preconnect"
                    href="https://4o4vm2cu6g.ufs.sh"
                    crossOrigin="anonymous"
                />
                <link rel="dns-prefetch" href="https://4o4vm2cu6g.ufs.sh" />
                {/* Preload the mobile banner LCP image to eliminate resource load delay.
                    Without this, the browser waits for the Suspense boundary to resolve
                    before discovering the image (~2.5s delay). */}
                <link
                    rel="preload"
                    as="image"
                    imageSrcSet={`/_next/image?url=${encodeURIComponent("https://4o4vm2cu6g.ufs.sh/f/HtysHtJpctzNXwwJqU3We049OUSYNxCLnRIka3FhcqBZlbsP")}&w=640&q=75 640w, /_next/image?url=${encodeURIComponent("https://4o4vm2cu6g.ufs.sh/f/HtysHtJpctzNXwwJqU3We049OUSYNxCLnRIka3FhcqBZlbsP")}&w=750&q=75 750w, /_next/image?url=${encodeURIComponent("https://4o4vm2cu6g.ufs.sh/f/HtysHtJpctzNXwwJqU3We049OUSYNxCLnRIka3FhcqBZlbsP")}&w=828&q=75 828w`}
                    imageSizes="100vw"
                    fetchPriority="high"
                />
                {FB_PIXEL_ID && (
                    <>
                        {/* Meta Pixel Script — init without user data for fast TTFB,
                            user data enrichment happens client-side in FacebookPixel component */}
                        <Script id="fb-pixel" strategy="lazyOnload">
                            {`
                                !function(f,b,e,v,n,t,s){
                                  if(f.fbq)return;
                                  n=f.fbq=function(){n.callMethod?
                                  n.callMethod.apply(n,arguments):n.queue.push(arguments)};
                                  if(!f._fbq)f._fbq=n;
                                  n.push=n;n.loaded=!0;n.version='2.0';
                                  n.queue=[];t=b.createElement(e);t.async=!0;
                                  t.src='https://connect.facebook.net/en_US/fbevents.js';
                                  s=b.getElementsByTagName(e)[0];
                                  s.parentNode.insertBefore(t,s)
                                }(window,document,'script');
                                fbq('init', '${FB_PIXEL_ID}');
                                fbq('track', 'PageView');
                            `}
                        </Script>

                        {/* NoScript Fallback */}
                        <noscript>
                            <img
                                height="1"
                                width="1"
                                style={{ display: "none" }}
                                src={`https://www.facebook.com/tr?id=${FB_PIXEL_ID}&ev=PageView&noscript=1`}
                                alt=""
                            />
                        </noscript>
                    </>
                )}
            </head>
            <ServerProvider>
                <body
                    className={cn("min-h-screen overflow-x-hidden antialiased")}
                >
                    <ClientProvider>
                        <MergeGuestCart />
                        <MergeGuestWishlist />
                        {children}
                        <Toaster />
                        {/* Track page changes + enrich pixel with user data client-side */}
                        <FacebookPixel />
                    </ClientProvider>
                </body>
            </ServerProvider>
            <GoogleAnalytics gaId={env.GOOGLE_ANALYTICS_ID} />
        </html>
    );
}
