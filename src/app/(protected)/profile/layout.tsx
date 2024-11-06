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
        <div className="relative flex min-h-screen flex-col">
            <NavbarHome />
            <main className="flex flex-1 flex-col">
                <GeneralShell>
                    <div className="space-y-1">
                        <h2 className="text-xl font-semibold md:text-3xl">
                            Account Settings
                        </h2>
                        <p className="text-sm text-muted-foreground">
                            Manage your account settings
                        </p>
                    </div>

                    <div className="flex flex-col gap-6 md:flex-row">
                        <ProfileNav className="h-min md:basis-1/4" />
                        {children}
                    </div>
                </GeneralShell>
            </main>
            <Footer />
            <NavbarMob />
        </div>
    );
}
