import { getAbsoluteURL } from "@/lib/utils";
import { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
    return {
        rules: {
            userAgent: "*",
            allow: "/",
            disallow: ["/dashboard/", "/profile/"],
        },
        sitemap: getAbsoluteURL("/sitemap.xml"),
        host: getAbsoluteURL("/"),
    };
}
