import { Footer, NavbarHome, NavbarMob } from "@/components/globals/layouts";
import { HomeRouteClickLoader } from "@/components/globals/layouts/home-route-click-loader";
import { siteConfig } from "@/config/site";
import { Metadata } from "next";

export const metadata: Metadata = {
    title: {
        default: siteConfig.description + " | " + siteConfig.name,
        template: "%s | " + siteConfig.name,
    },
};

export default function Layout({ children }: LayoutProps) {
    return (
        <div className="relative flex min-h-screen flex-col">
            <HomeRouteClickLoader />
            <NavbarHome />
            <main className="flex flex-1 flex-col">{children}</main>
            <Footer />
            <NavbarMob />
        </div>
    );
}
