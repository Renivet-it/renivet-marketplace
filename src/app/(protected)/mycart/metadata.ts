import { siteConfig } from "@/config/site";
import type { Metadata } from "next";

export const cartMetadata: Metadata = {
    title: {
        default: "Cart",
        template: "%s | " + siteConfig.name,
    },
};
