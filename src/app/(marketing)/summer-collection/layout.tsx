import { Footer, NavbarHome, NavbarMob } from "@/components/globals/layouts";
import { MobileBottomNav } from "@/components/globals/layouts/shop/MobileBottomNav";
import { siteConfig } from "@/config/site";
import { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
    title: {
        default: "Summer Collection",
        template: "%s | " + siteConfig.name,
    },
};

export default function Layout({ children }: LayoutProps) {
    return (
        <div className="relative flex min-h-screen flex-col bg-white">
            <NavbarHome />
            <main className="flex flex-1 flex-col">{children}</main>
            <Footer />
            <NavbarMob />
            <MobileBottomNav />
        </div>
    );
}
