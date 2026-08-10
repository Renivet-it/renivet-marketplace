import {
    GeneralShell,
    NavbarHome,
    NavbarMob,
} from "@/components/globals/layouts";
import { FooterWithLegal } from "@/components/globals/layouts/footer/footer-with-legal";
import { ProfileNav } from "@/components/profile";
import { siteConfig } from "@/config/site";
import { Metadata } from "next";
import { ProfileLayoutShell } from "./profile-layout-shell";

export const metadata: Metadata = {
    title: {
        default: "Profile",
        template: "%s | " + siteConfig.name,
    },
};

export default function Layout({ children }: LayoutProps) {
    return (
        <ProfileLayoutShell
            navbar={<NavbarHome />}
            footer={<FooterWithLegal />}
            mobileNav={<NavbarMob />}
        >
            <GeneralShell>
                <div className="flex w-full flex-col gap-6 md:flex-row">
                    <ProfileNav className="h-min shrink-0" />
                    <div className="min-w-0 flex-1">{children}</div>
                </div>
            </GeneralShell>
        </ProfileLayoutShell>
    );
}
