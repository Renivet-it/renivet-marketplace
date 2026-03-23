"use client";

import { Icons } from "@/components/icons";
import {
    SidebarGroup,
    SidebarGroupLabel,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
} from "@/components/ui/sidebar";
import { cn, hasPermission } from "@/lib/utils";
import Link from "next/link";
import { usePathname } from "next/navigation";

interface Props extends GenericProps {
    legal: {
        name: string;
        url: string;
        icon: keyof typeof Icons;
        permissions: number;
    }[];
    userPermissions: {
        sitePermissions: number;
        brandPermissions: number;
    };
}

export function NavLegal({
    className,
    legal,
    userPermissions,
    ...props
}: Props) {
    const pathname = usePathname();

    const filteredItems = legal.filter((item) => {
        return hasPermission(
            userPermissions.sitePermissions,
            [item.permissions],
            "any"
        );
    });
    if (!filteredItems?.length) return null;

    return (
        <SidebarGroup
            className={cn(
                "px-1.5 py-0 group-data-[collapsible=icon]:hidden",
                className
            )}
            {...props}
        >
            <SidebarGroupLabel className="px-3 text-[10px] font-semibold uppercase tracking-[0.14em] text-sidebar-foreground/55">
                Legal
            </SidebarGroupLabel>
            <SidebarMenu className="gap-1.5">
                {filteredItems.map((item) => {
                    const Icon = Icons[item.icon];
                    const isActive =
                        pathname === item.url ||
                        pathname.startsWith(`${item.url}/`);

                    return (
                        <SidebarMenuItem key={item.name}>
                            <SidebarMenuButton
                                asChild
                                isActive={isActive}
                                className="h-9 rounded-xl px-3 text-sm font-medium text-sidebar-foreground/80 hover:bg-sidebar-accent/80 hover:text-sidebar-foreground data-[active=true]:bg-sidebar-accent data-[active=true]:text-sidebar-foreground"
                            >
                                <Link href={item.url} prefetch>
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
