import { NavbarHome, NavbarMob } from "@/components/globals/layouts";
import { FooterWithLegal } from "@/components/globals/layouts/footer/footer-with-legal";
import { siteConfig } from "@/config/site";
import { Metadata } from "next";

export const metadata: Metadata = {
    title: {
        default: "Events",
        template: "%s | " + siteConfig.name,
    },
};

export default function Layout({ children }: LayoutProps) {
    return (
        <div className="relative flex min-h-screen bg-white flex-col">
            <NavbarHome />
            <main className="flex flex-1 flex-col">{children}</main>
            <FooterWithLegal />
            <NavbarMob />
        </div>
    );
}
