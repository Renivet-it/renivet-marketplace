import { NavbarHome, NavbarMob } from "@/components/globals/layouts";
import { FooterWithLegal } from "@/components/globals/layouts/footer/footer-with-legal";
import { MobileBottomNav } from "@/components/globals/layouts/shop/MobileBottomNav";
import { siteConfig } from "@/config/site";
import { Metadata } from "next";

export const metadata: Metadata = {
    title: {
        default: "Brands",
        template: "%s | " + siteConfig.name,
    },
};

export default function Layout({ children }: LayoutProps) {
    return (
        <div className="relative flex min-h-screen flex-col">
            <NavbarHome />
            <main className="flex flex-1 flex-col pb-[calc(74px+env(safe-area-inset-bottom))] md:pb-0">
                {children}
            </main>
            <div className="hidden md:block">
                <FooterWithLegal />
            </div>
            <NavbarMob />
            <MobileBottomNav />
        </div>
    );
}
