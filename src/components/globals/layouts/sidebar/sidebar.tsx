"use client";

import { Icons } from "@/components/icons";
import {
    Sidebar as ShadSidebar,
    SidebarContent,
    SidebarFooter,
    SidebarHeader,
    SidebarRail,
} from "@/components/ui/sidebar";
import { BitFieldSitePermission } from "@/config/permissions";
import { generalSidebarConfig, generateBrandSideNav } from "@/config/site";
import { trpc } from "@/lib/trpc/client";
import { cn, getUserPermissions, hasPermission } from "@/lib/utils";
import { useMemo } from "react";
import { GenericHeader } from "./generic-header";
import { NavBrand } from "./nav-brand";
import { NavLegal } from "./nav-legal";
import { NavMain } from "./nav-main";
import { NavUser } from "./nav-user";

interface Sidebar {
    user: {
        name: string;
        email: string;
        avatar: string;
    };
    navMain: GeneralSidebarConfig[];
    legal: {
        name: string;
        url: string;
        icon: keyof typeof Icons;
        permissions: number;
    }[];
}

const data: Sidebar = {
    user: {
        name: "shadcn",
        email: "m@example.com",
        avatar: "/avatars/shadcn.jpg",
    },
    navMain: generalSidebarConfig.filter((section) => !section.hidden), // <-- filter hidden sections
    legal: [
        {
            name: "Terms of Services",
            url: "/dashboard/general/terms",
            icon: "ScrollText",
            permissions: BitFieldSitePermission.MANAGE_SETTINGS,
        },
        {
            name: "Privacy Policy",
            url: "/dashboard/general/privacy",
            icon: "Scale",
            permissions: BitFieldSitePermission.MANAGE_SETTINGS,
        },
        {
            name: "Shipping Policy",
            url: "/dashboard/general/shipping-policy",
            icon: "Truck",
            permissions: BitFieldSitePermission.MANAGE_SETTINGS,
        },
        {
            name: "Refund Policy",
            url: "/dashboard/general/refund-policy",
            icon: "RefreshCcw",
            permissions: BitFieldSitePermission.MANAGE_SETTINGS,
        },
    ],
};

export function Sidebar() {
    const { data: user } = trpc.general.users.currentUser.useQuery();

    const userPermissions = useMemo(() => {
        if (!user)
            return {
                sitePermissions: 0,
                brandPermissions: 0,
            };
        return getUserPermissions(user.roles);
    }, [user]);

    const isGeneral = useMemo(
        () =>
            hasPermission(userPermissions.sitePermissions, [
                BitFieldSitePermission.VIEW_PROTECTED_PAGES,
            ]) && userPermissions.brandPermissions === 0,
        [userPermissions.brandPermissions, userPermissions.sitePermissions]
    );

    const isBrand = useMemo(
        () => userPermissions.brandPermissions > 0,
        [userPermissions.brandPermissions]
    );

    return (
        <ShadSidebar collapsible="icon">
            <SidebarHeader>
                <GenericHeader />
            </SidebarHeader>

            <SidebarContent style={{ scrollbarWidth: "none" }}>
                <NavMain
                    items={data.navMain}
                    userPermissions={userPermissions}
                    className={cn({
                        hidden: !isGeneral,
                    })}
                />

                {user?.brand && (
                    <NavBrand
                        items={generateBrandSideNav(user.brand.id)}
                        userPermissions={userPermissions}
                        className={cn({
                            hidden: !isBrand,
                        })}
                    />
                )}

                <NavLegal
                    legal={data.legal}
                    userPermissions={userPermissions}
                    className={cn({
                        hidden: !isGeneral,
                    })}
                />
            </SidebarContent>

            <SidebarFooter>
                <NavUser />
            </SidebarFooter>

            <SidebarRail />
        </ShadSidebar>
    );
}
