import {
    Footer,
    GeneralShell,
    NavbarHome,
    NavbarMob,
} from "@/components/globals/layouts";
import { ProfileNav } from "@/components/profile";
import { siteConfig } from "@/config/site";
import { Metadata } from "next";

export const metadata: Metadata = {
    title: {
        default: "Profile",
        template: "%s | " + siteConfig.name,
    },
};

export default function Layout({ children }: LayoutProps) {
    return (
        <div className="relative flex min-h-screen flex-col bg-[#f8f7f4]">
            <NavbarHome />
            <main className="flex flex-1 flex-col">
                <GeneralShell>
                    <div className="flex flex-col gap-6 md:flex-row">
                        <ProfileNav className="h-min shrink-0" />
                        {children}
                    </div>
                </GeneralShell>
            </main>
            <Footer />
            <NavbarMob />
        </div>
    );
}
