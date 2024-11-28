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
import { cn, hasPermission } from "@/lib/utils";
import { ChevronRight } from "lucide-react";
import Link from "next/link";

interface Props extends GenericProps {
    items: BrandSidebarConfig[];
    userPermissions: {
        sitePermissions: number;
        brandPermissions: number;
    };
}

export function NavBrand({
    className,
    items,
    userPermissions,
    ...props
}: Props) {
    return (
        <SidebarGroup className={cn("", className)} {...props}>
            <SidebarGroupLabel>Brand</SidebarGroupLabel>

            <SidebarMenu>
                {items.map((item) => {
                    const Icon = item.icon && Icons[item.icon];

                    const filteredItems = item.items?.filter((subItem) =>
                        hasPermission(
                            userPermissions.brandPermissions,
                            [subItem.permissions],
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
                                        {filteredItems.map((subItem) => (
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
