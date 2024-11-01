"use client";

import { Icons } from "@/components/icons";
import {
    SidebarGroup,
    SidebarGroupLabel,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
} from "@/components/ui/sidebar";
import { cn } from "@/lib/utils";
import Link from "next/link";

interface Props extends GenericProps {
    legal: {
        name: string;
        url: string;
        icon: keyof typeof Icons;
    }[];
}

export function NavLegal({ className, legal, ...props }: Props) {
    return (
        <SidebarGroup
            className={cn("group-data-[collapsible=icon]:hidden", className)}
            {...props}
        >
            <SidebarGroupLabel>Legal</SidebarGroupLabel>
            <SidebarMenu>
                {legal.map((item) => {
                    const Icon = Icons[item.icon];

                    return (
                        <SidebarMenuItem key={item.name}>
                            <SidebarMenuButton asChild>
                                <Link href={item.url}>
                                    <Icon />
                                    <span>{item.name}</span>
                                </Link>
                            </SidebarMenuButton>
                        </SidebarMenuItem>
                    );
                })}
            </SidebarMenu>
        </SidebarGroup>
    );
}
