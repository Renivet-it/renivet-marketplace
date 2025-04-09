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
                hostname: "img.clerk.com",
            },
            {
                protocol: "https",
                hostname: "placehold.co",
                pathname: "**"
            },
            {
                protocol: "https",
                hostname: "4o4vm2cu6g.ufs.sh",
                pathname: "**"
            }
        ],
    },
    // reactStrictMode: false,
};

export default nextConfig;
