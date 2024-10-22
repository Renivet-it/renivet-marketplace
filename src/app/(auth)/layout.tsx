import { AuthShell } from "@/components/globals/layouts";
import { siteConfig } from "@/config/site";
import { Metadata } from "next";

export const metadata: Metadata = {
    title: {
        default: "Authentication",
        template: "%s | Authenticate your account to " + siteConfig.name,
    },
    description: "Authenticate with your account",
};

export default function Layout({ children }: LayoutProps) {
    return (
        <main className="flex flex-1 flex-col">
            <AuthShell>{children}</AuthShell>
        </main>
    );
}
