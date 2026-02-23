import { Footer, NavbarHome, NavbarMob } from "@/components/globals/layouts";
import { siteConfig } from "@/config/site";
import { getAbsoluteURL } from "@/lib/utils";
import { Metadata } from "next";

export const metadata: Metadata = {
    title: {
        default: siteConfig.name + " | Sustainable Fashion Marketplace",
        template: "%s | " + siteConfig.name,
    },
    alternates: {
        canonical: getAbsoluteURL("/"),
    },
};

export default function Layout({ children }: LayoutProps) {
    return (
        <div className="relative flex min-h-screen flex-col">
            <NavbarHome />
            <main className="flex flex-1 flex-col">{children}</main>
            <Footer />
            <NavbarMob />
        </div>
    );
}
