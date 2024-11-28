"use client";

import { Icons } from "@/components/icons";
import {
    Collapsible,
    CollapsibleContent,
    CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
    SidebarGroup,
    SidebarGroupLabel,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
    SidebarMenuSub,
    SidebarMenuSubButton,
    SidebarMenuSubItem,
} from "@/components/ui/sidebar";
import { BitFieldSitePermission } from "@/config/permissions";
import { cn, hasPermission } from "@/lib/utils";
import { ChevronRight } from "lucide-react";
import Link from "next/link";

interface Props extends GenericProps {
    items: {
        title: string;
        url: string;
        icon?: keyof typeof Icons;
        isActive?: boolean;
        items?: {
            title: string;
            url: string;
            permissions?: number;
        }[];
    }[];
    userPermissions: {
        sitePermissions: number;
        brandPermissions: number;
    };
}

export function NavMain({
    className,
    items,
    userPermissions,
    ...props
}: Props) {
    return (
        <SidebarGroup className={cn("", className)} {...props}>
            <SidebarGroupLabel>Platform</SidebarGroupLabel>

            <SidebarMenu>
                {items.map((item) => {
                    const Icon = item.icon && Icons[item.icon];

                    const filteredItems = item.items?.filter((subItem) =>
                        hasPermission(
                            userPermissions.sitePermissions,
                            [
                                subItem.permissions ||
                                    BitFieldSitePermission.VIEW_PROTECTED_PAGES,
                            ],
                            "any"
                        )
                    );
                    if (!filteredItems?.length) return null;

                    return (
                        <Collapsible
                            key={item.title}
                            asChild
                            defaultOpen
                            className="group/collapsible"
                        >
                            <SidebarMenuItem>
                                <CollapsibleTrigger asChild>
                                    <SidebarMenuButton tooltip={item.title}>
                                        {Icon && <Icon />}
                                        <span>{item.title}</span>
                                        <ChevronRight className="ml-auto transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
                                    </SidebarMenuButton>
                                </CollapsibleTrigger>

                                <CollapsibleContent>
                                    <SidebarMenuSub>
                                        {filteredItems?.map((subItem) => (
                                            <SidebarMenuSubItem
                                                key={subItem.title}
                                            >
                                                <SidebarMenuSubButton asChild>
                                                    <Link href={subItem.url}>
                                                        {subItem.title}
                                                    </Link>
                                                </SidebarMenuSubButton>
                                            </SidebarMenuSubItem>
                                        ))}
                                    </SidebarMenuSub>
                                </CollapsibleContent>
                            </SidebarMenuItem>
                        </Collapsible>
                    );
                })}
            </SidebarMenu>
        </SidebarGroup>
    );
}
