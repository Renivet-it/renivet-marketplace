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
                hostname: "picsum.photos",
            },
            {
                hostname: "img.clerk.com",
            },
        ],
    },
};

export default nextConfig;
