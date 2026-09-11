import { NavbarHome, NavbarMob } from "@/components/globals/layouts";
import { FooterWithLegal } from "@/components/globals/layouts/footer/footer-with-legal";
import { siteConfig } from "@/config/site";
import { getAbsoluteURL } from "@/lib/utils";
import { Metadata } from "next";

export const metadata: Metadata = {
    title: {
        default: "Shop Sustainable Fashion & Eco Products",
        template: "%s | " + siteConfig.name,
    },
    description:
        "Shop sustainable fashion and eco products from verified brands on Renivet. Discover conscious clothing, accessories, home goods, and lifestyle essentials.",
    alternates: { canonical: getAbsoluteURL("/shop") },
};

export default function Layout({ children }: LayoutProps) {
    return (
        <div className="relative flex min-h-screen flex-col bg-white">
            <NavbarHome />
            <main className="flex flex-1 flex-col">{children}</main>
            <FooterWithLegal />
            <NavbarMob />
        </div>
    );
}
