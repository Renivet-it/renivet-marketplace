import { Sidebar, SidebarInset } from "@/components/globals/layouts";
import { Separator } from "@/components/ui/separator";
import {
    SidebarInset as ShadSidebarInset,
    SidebarProvider,
    SidebarTrigger,
} from "@/components/ui/sidebar";
import { Metadata } from "next";

import "./dashboard.css";

export const metadata: Metadata = {
    title: {
        default: "Dashboard",
        template: "%s | Dashboard",
    },
    description: "Dashboard for the platform",
};

export default function Layout({ children }: LayoutProps) {
    return (
        <div className="dashboard-theme min-h-screen bg-background font-inter text-foreground">
            <SidebarProvider>
                <Sidebar />

                <ShadSidebarInset className="bg-background min-w-0 max-w-full overflow-x-hidden">
                    <header className="sticky top-0 z-30 flex h-16 shrink-0 items-center gap-2 border-b border-border bg-card/80 backdrop-blur-md transition-[width,height] ease-linear group-has-[[data-collapsible=icon]]/sidebar-wrapper:h-12">
                        <div className="product-breadcrum flex items-center gap-2 px-4">
                            <SidebarTrigger className="-ml-1 hover:bg-transparent hover:text-foreground" />

                            <Separator
                                orientation="vertical"
                                className="mr-2 h-4"
                            />

                            <SidebarInset />
                        </div>
                    </header>

                    {children}
                </ShadSidebarInset>
            </SidebarProvider>
        </div>
    );
}
