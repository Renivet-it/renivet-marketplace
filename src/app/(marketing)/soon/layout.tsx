import { siteConfig } from "@/config/site";
import { Metadata } from "next";

export const metadata: Metadata = {
    title: {
        default: "Coming Soon",
        template: "%s | " + siteConfig.name,
    },
    description: "We are working on something awesome!",
};

export default function Layout({ children }: LayoutProps) {
    return (
        <div className="relative flex min-h-screen flex-col bg-muted">
            <main className="flex flex-1 flex-col">{children}</main>
        </div>
    );
}
