import { NavbarHome, NavbarMob } from "@/components/globals/layouts";
import { FooterWithLegal } from "@/components/globals/layouts/footer/footer-with-legal";
import { HomeRouteClickLoader } from "@/components/globals/layouts/home-route-click-loader";
import { MobileBottomNav } from "@/components/globals/layouts/shop/MobileBottomNav";
import { siteConfig } from "@/config/site";
import { Metadata } from "next";

export const metadata: Metadata = {
    title: {
        default: siteConfig.name + " | Sustainable Marketplace",
        template: "%s | " + siteConfig.name,
    },
};

export default function Layout({ children }: LayoutProps) {
    return (
        <div className="relative flex min-h-screen flex-col">
            <HomeRouteClickLoader />
            <NavbarHome />
            <main className="flex flex-1 flex-col">{children}</main>
            <FooterWithLegal />
            <NavbarMob />
            <MobileBottomNav />
        </div>
    );
}
