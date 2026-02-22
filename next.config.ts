import "./env";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
    images: {
        remotePatterns: [
            {
                protocol: "https",
                hostname: "utfs.io",
                pathname: "/a/758cbqh2wo/**",
            },
            {
                protocol: "https",
                hostname: "utfs.io",
                pathname: "/a/4o4vm2cu6g/**",
            },
            {
                protocol: "https",
                hostname: "utfs.io",
                pathname: "/a/7ldskuwkqm/**",
            },
            {
                protocol: "https",
                hostname: "utfs.io",
                pathname: "/a/0hldi3nd8j/**",
            },
            {
                hostname: "picsum.photos",
            },
            {
                protocol: "https",
                hostname: "utfs.io",
                pathname: "/f/**",
            },
            {
                hostname: "img.clerk.com",
            },
            {
                protocol: "https",
                hostname: "placehold.co",
                pathname: "**",
            },
            {
                protocol: "https",
                hostname: "4o4vm2cu6g.ufs.sh",
                pathname: "**",
            },
        ],
        // Optimize image loading (reduces build time)
        formats: ["image/avif", "image/webp"],
        minimumCacheTTL: 60,
    },
    compress: true,

    // ===== BUILD PERFORMANCE OPTIMIZATIONS =====
    staticPageGenerationTimeout: 180, // Increase from default 60

    // Enable experimental features for faster builds
    experimental: {
        optimizePackageImports: ["@clerk/nextjs"], // If using Clerk
        optimizeServerReact: true,
    },

    // Disable type checking during build (run it separately)
    typescript: {
        ignoreBuildErrors: true, // Optional: Only if you have separate type checking
    },

    // Disable ESLint during build
    eslint: {
        ignoreDuringBuilds: true,
    },

    // Enable HTTP/2 for faster static file serving
    httpAgentOptions: {
        keepAlive: true,
    },
};

export default nextConfig;
