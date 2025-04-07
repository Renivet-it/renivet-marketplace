import { Sidebar, SidebarInset } from "@/components/globals/layouts";
import { Separator } from "@/components/ui/separator";
import {
    SidebarInset as ShadSidebarInset,
    SidebarProvider,
    SidebarTrigger,
} from "@/components/ui/sidebar";
import { Metadata } from "next";

export const metadata: Metadata = {
    title: {
        default: "Dashboard",
        template: "%s | Dashboard",
    },
    description: "Dashboard for the platform",
};

export default function Layout({ children }: LayoutProps) {
    return (
        <SidebarProvider>
            <Sidebar />

            <ShadSidebarInset className="max-w-full">
                <header className="flex h-16 shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-[[data-collapsible=icon]]/sidebar-wrapper:h-12">
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
    );
}
