import { ClientProvider, ServerProvider } from "@/components/providers";
import { Toaster } from "@/components/ui/sonner";
import { siteConfig } from "@/config/site";
import { cn, getAbsoluteURL } from "@/lib/utils";
import type { Metadata } from "next";
import "./globals.css";
import { garamond, poppins } from "./fonts";

export const metadata: Metadata = {
    title: {
        default: siteConfig.name,
        template: "%s | " + siteConfig.name,
    },
    description: siteConfig.description,
    keywords: siteConfig.keywords,
    authors: [
        {
            name: siteConfig.name,
            url: getAbsoluteURL(),
        },
    ],
    formatDetection: {
        telephone: false,
    },
    appleWebApp: {
        capable: true,
        statusBarStyle: "default",
        title: siteConfig.name,
    },
    creator: siteConfig.name,
    openGraph: {
        type: "website",
        locale: "en_US",
        url: getAbsoluteURL(),
        title: siteConfig.name,
        description: siteConfig.description,
        siteName: siteConfig.name,
        images: [
            {
                ...siteConfig.og,
                alt: siteConfig.name,
            },
        ],
    },
    twitter: {
        card: "summary_large_image",
        title: siteConfig.name,
        description: siteConfig.description,
        images: [siteConfig.og.url],
        creator: "@itsdrvgo",
    },
    icons: {
        icon: "/favicon.ico",
        shortcut: "/favicon-16x16.png",
        apple: "/apple-touch-icon.png",
    },
    manifest: "/site.webmanifest",
    metadataBase: new URL(getAbsoluteURL()),
};

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <ServerProvider>
            <html
                lang="en"
                suppressHydrationWarning
                className={cn(poppins.variable, garamond.variable)}
            >
                <body
                    className={cn("min-h-screen overflow-x-hidden antialiased")}
                >
                    <ClientProvider>
                        {children}
                        <Toaster />
                    </ClientProvider>
                </body>
            </html>
        </ServerProvider>
    );
}
