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
                    className="hover:bg-transparent data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
                    asChild
                >
                    <Link href="/">
                        <div className="flex aspect-square size-8 items-center justify-center rounded-lg">
                            <Renivet className="size-7" stroke="black" />
                        </div>

                        <div className="grid flex-1 text-left text-sm leading-tight">
                            <span className="truncate font-semibold">
                                Renivet
                            </span>
                            <span className="truncate text-xs">
                                {getAbsoluteURL().split("://")[1].slice(0, -1)}
                            </span>
                        </div>
                    </Link>
                </SidebarMenuButton>
            </SidebarMenuItem>
        </SidebarMenu>
    );
}
