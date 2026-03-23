"use client";

import { Renivet } from "@/components/svgs";
import {
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
} from "@/components/ui/sidebar";
import { getAbsoluteURL } from "@/lib/utils";
import Link from "next/link";

export function GenericHeader() {
    return (
        <SidebarMenu>
            <SidebarMenuItem>
                <SidebarMenuButton
                    size="lg"
                    className="h-14 rounded-xl border border-sidebar-border/70 bg-background/60 px-2.5 shadow-sm transition-colors hover:bg-sidebar-accent/70 data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground group-data-[collapsible=icon]:size-10 group-data-[collapsible=icon]:border-0 group-data-[collapsible=icon]:bg-transparent group-data-[collapsible=icon]:shadow-none"
                    asChild
                >
                    <Link href="/">
                        <div className="flex aspect-square size-8 items-center justify-center rounded-xl border border-sidebar-border/60 bg-sidebar-accent/50">
                            <Renivet className="size-7" />
                        </div>

                        <div className="grid flex-1 text-left text-sm leading-tight">
                            <span className="truncate text-sm font-semibold text-sidebar-foreground">
                                Renivet
                            </span>
                            <span className="truncate text-xs text-sidebar-foreground/60">
                                {getAbsoluteURL().split("://")[1].slice(0, -1)}
                            </span>
                        </div>
                    </Link>
                </SidebarMenuButton>
            </SidebarMenuItem>
        </SidebarMenu>
    );
}
