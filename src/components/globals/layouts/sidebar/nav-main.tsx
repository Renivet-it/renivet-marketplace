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
                                        className="relative h-10 rounded-xl px-3 text-sm font-medium text-sidebar-foreground/90 hover:bg-sidebar-accent/80 hover:text-sidebar-foreground data-[active=true]:bg-sidebar-primary data-[active=true]:font-semibold data-[active=true]:text-sidebar-primary-foreground data-[active=true]:shadow-sm data-[active=true]:before:absolute data-[active=true]:before:inset-y-2 data-[active=true]:before:left-1 data-[active=true]:before:w-1 data-[active=true]:before:rounded-full data-[active=true]:before:bg-sidebar-primary-foreground/90"
                                    >
                                        {Icon && <Icon />}
                                        <span>{item.title}</span>
                                        <Icons.ChevronRight className="ml-auto size-4 rounded-full bg-sidebar-accent/60 p-0.5 text-sidebar-foreground/70 transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90 group-data-[state=open]/collapsible:bg-sidebar-primary/20 group-data-[state=open]/collapsible:text-sidebar-foreground" />
                                    </SidebarMenuButton>
                                </CollapsibleTrigger>

                                <CollapsibleContent>
                                    <SidebarMenuSub className="mx-2 mt-1 gap-1 border-l border-sidebar-border/60 pl-2">
                                        {filteredItems?.map((subItem) => (
                                            <SidebarMenuSubItem
                                                key={subItem.title}
                                            >
                                                <SidebarMenuSubButton
                                                    asChild
                                                    isActive={isSubItemActive(
                                                        subItem.url
                                                    )}
                                                    className="relative h-8 rounded-lg px-3 pl-6 text-sm text-sidebar-foreground/75 hover:bg-sidebar-accent/70 hover:text-sidebar-foreground data-[active=true]:bg-sidebar-accent data-[active=true]:font-semibold data-[active=true]:text-sidebar-foreground data-[active=true]:before:absolute data-[active=true]:before:left-2.5 data-[active=true]:before:top-1/2 data-[active=true]:before:size-1.5 data-[active=true]:before:-translate-y-1/2 data-[active=true]:before:rounded-full data-[active=true]:before:bg-sidebar-primary"
                                                >
                                                    <Link
                                                        href={subItem.url}
                                                        prefetch
                                                        className="block w-full truncate"
                                                        title={subItem.title}
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
