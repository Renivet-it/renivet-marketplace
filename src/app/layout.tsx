import { ClientProvider, ServerProvider } from "@/components/providers";
import { Toaster } from "@/components/ui/sonner";
import { siteConfig } from "@/config/site";
import { cn, getAbsoluteURL } from "@/lib/utils";
import type { Metadata, Viewport } from "next";
import { dmsans, rubik } from "./fonts";
import "./globals.css";
import { env } from "@/../env";
import { GoogleAnalytics } from "@next/third-parties/google";
import Script from "next/script";
import FacebookPixel from "./facebook-pixel"; // ✅ add this

const FB_PIXEL_ID = "618442627790500"; // ✅

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
        default: siteConfig.name,
        template: "%s | " + siteConfig.name,
    },
    description: siteConfig.description,
    keywords: siteConfig.keywords,
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
    category: siteConfig.category,
    appleWebApp: {
        capable: true,
        statusBarStyle: "black-translucent",
        title: siteConfig.name,
    },
    creator: siteConfig.name,
    openGraph: {
        title: siteConfig.name,
        description: siteConfig.description,
        url: getAbsoluteURL(),
        siteName: siteConfig.name,
        images: [
            {
                ...siteConfig.og,
                alt: siteConfig.name,
            },
        ],
        locale: "en_US",
        type: "website",
    },
    twitter: {
        card: "summary_large_image",
        title: siteConfig.name,
        description: siteConfig.description,
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
            className={cn(dmsans.variable, rubik.variable)}
        >
            <head>
                {FB_PIXEL_ID && (
                    <>
                        {/* ✅ Meta Pixel Script */}
                        <Script id="fb-pixel" strategy="afterInteractive">
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

                        {/* ✅ NoScript Fallback */}
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
                        {children}
                        <Toaster />
                        {/* ✅ Track page changes */}
                        <FacebookPixel />
                    </ClientProvider>
                </body>
            </ServerProvider>
            <GoogleAnalytics gaId={env.GOOGLE_ANALYTICS_ID} />
        </html>
    );
}
