import { Footer, NavbarHome, NavbarMob } from "@/components/globals/layouts";
import { siteConfig } from "@/config/site";
import { Metadata } from "next";
import { MobileBottomNav } from "@/components/globals/layouts/shop/MobileBottomNav"; // 1. Import the component

export const metadata: Metadata = {
    title: {
        default: "Events",
        template: "%s | " + siteConfig.name,
    },
};

export default function Layout({ children }: LayoutProps) {
    return (
        <div className="relative flex min-h-screen flex-col">
            <NavbarHome />
            <main className="flex flex-1 flex-col">{children}</main>
            <Footer />
            <NavbarMob />
         <MobileBottomNav />

        </div>
    );
}
