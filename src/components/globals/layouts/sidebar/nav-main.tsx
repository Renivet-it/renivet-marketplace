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
import Link from "next/link";
import { usePathname } from "next/navigation";

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
    const pathname = usePathname();

    return (
        <SidebarGroup className={cn("px-1.5 py-0", className)} {...props}>
            <SidebarGroupLabel className="px-3 text-[10px] font-semibold uppercase tracking-[0.14em] text-sidebar-foreground/55">
                Platform
            </SidebarGroupLabel>

            <SidebarMenu className="gap-1.5">
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

                    const isSubItemActive = (url: string) =>
                        pathname === url || pathname.startsWith(`${url}/`);
                    const isItemActive =
                        !!item.url &&
                        (pathname === item.url ||
                            pathname.startsWith(`${item.url}/`));
                    const hasActiveChild =
                        filteredItems?.some((subItem) =>
                            isSubItemActive(subItem.url)
                        ) ?? false;

                    if (!filteredItems?.length) return null;

                    return (
                        <Collapsible
                            key={item.title}
                            asChild
                            defaultOpen={isItemActive || hasActiveChild}
                            className="group/collapsible"
                        >
                            <SidebarMenuItem>
                                <CollapsibleTrigger asChild>
                                    <SidebarMenuButton
                                        tooltip={item.title}
                                        isActive={isItemActive || hasActiveChild}
                                        className="h-10 rounded-xl px-3 text-sm font-medium text-sidebar-foreground/90 hover:bg-sidebar-accent/80 hover:text-sidebar-foreground data-[active=true]:bg-sidebar-primary data-[active=true]:text-sidebar-primary-foreground data-[active=true]:shadow-sm"
                                    >
                                        {Icon && <Icon />}
                                        <span>{item.title}</span>
                                        <Icons.ChevronRight className="ml-auto size-4 rounded-full bg-sidebar-accent/60 p-0.5 text-sidebar-foreground/70 transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90 group-data-[state=open]/collapsible:bg-sidebar-primary/20 group-data-[state=open]/collapsible:text-sidebar-foreground" />
                                    </SidebarMenuButton>
                                </CollapsibleTrigger>

                                <CollapsibleContent>
                                    <SidebarMenuSub className="mx-2.5 mt-1 gap-1 border-l-0 p-0">
                                        {filteredItems?.map((subItem) => (
                                            <SidebarMenuSubItem
                                                key={subItem.title}
                                            >
                                                <SidebarMenuSubButton
                                                    asChild
                                                    isActive={isSubItemActive(
                                                        subItem.url
                                                    )}
                                                    className="h-8 rounded-lg px-3 pl-9 text-sm text-sidebar-foreground/75 hover:bg-sidebar-accent/70 hover:text-sidebar-foreground data-[active=true]:bg-sidebar-accent data-[active=true]:font-medium data-[active=true]:text-sidebar-foreground"
                                                >
                                                    <Link
                                                        href={subItem.url}
                                                        prefetch
                                                    >
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
