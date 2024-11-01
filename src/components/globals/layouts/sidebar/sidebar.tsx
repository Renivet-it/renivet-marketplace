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
    navMain: {
        title: string;
        url: string;
        icon: keyof typeof Icons;
        isActive?: boolean;
        items?: {
            title: string;
            url: string;
        }[];
    }[];
    navBrand: {
        title: string;
        url: string;
        icon: keyof typeof Icons;
        isActive?: boolean;
        items?: {
            title: string;
            url: string;
        }[];
    }[];
    legal: {
        name: string;
        url: string;
        icon: keyof typeof Icons;
    }[];
}

const data: Sidebar = {
    user: {
        name: "shadcn",
        email: "m@example.com",
        avatar: "/avatars/shadcn.jpg",
    },
    navMain: [
        {
            title: "Dashboard",
            url: "#",
            icon: "LayoutDashboard",
            items: [
                {
                    title: "Analytics",
                    url: "/dashboard/general/analytics",
                },
                {
                    title: "Reports",
                    url: "/dashboard/general/reports",
                },
                {
                    title: "Metrics",
                    url: "/dashboard/general/metrics",
                },
                {
                    title: "Logs",
                    url: "/dashboard/general/logs",
                },
            ],
        },
        {
            title: "Content",
            url: "#",
            icon: "BookOpen",
            items: [
                {
                    title: "Banners",
                    url: "/dashboard/general/banners",
                },
                {
                    title: "About",
                    url: "/dashboard/general/about",
                },
                {
                    title: "Blogs",
                    url: "/dashboard/general/blogs",
                },
            ],
        },
        {
            title: "Management",
            url: "#",
            icon: "Settings2",
            items: [
                {
                    title: "Users",
                    url: "/dashboard/general/users",
                },
                {
                    title: "Brands",
                    url: "/dashboard/general/brands",
                },
                {
                    title: "Roles",
                    url: "/dashboard/general/roles",
                },
                {
                    title: "Tags",
                    url: "/dashboard/general/tags",
                },
                {
                    title: "Tickets",
                    url: "/dashboard/general/tickets",
                },
                {
                    title: "Subscribers",
                    url: "/dashboard/general/newsletter",
                },
                {
                    title: "Waitlist",
                    url: "/dashboard/general/brand-waitlist",
                },
            ],
        },
        {
            title: "Products",
            url: "#",
            icon: "Package",
            items: [
                {
                    title: "Categories",
                    url: "/dashboard/general/categories",
                },
                {
                    title: "Sub Categories",
                    url: "/dashboard/general/sub-categories",
                },
                {
                    title: "Product Types",
                    url: "/dashboard/general/product-types",
                },
            ],
        },
    ],
    navBrand: [
        {
            title: "Dashboard",
            url: "#",
            icon: "LayoutDashboard",
            items: [
                {
                    title: "Analytics",
                    url: "/dashboard/brand/analytics",
                },
                {
                    title: "Reports",
                    url: "/dashboard/brand/reports",
                },
                {
                    title: "Metrics",
                    url: "/dashboard/brand/metrics",
                },
                {
                    title: "Logs",
                    url: "/dashboard/brand/logs",
                },
            ],
        },
        {
            title: "Store",
            url: "#",
            icon: "Store",
            items: [
                {
                    title: "Page",
                    url: "/dashboard/brand/page",
                },
                {
                    title: "Products",
                    url: "/dashboard/brand/products",
                },
                {
                    title: "Orders",
                    url: "/dashboard/brand/orders",
                },
                {
                    title: "Coupons",
                    url: "/dashboard/brand/coupons",
                },
            ],
        },
    ],
    legal: [
        {
            name: "Privacy Policy",
            url: "/dashboard/general/privacy",
            icon: "Scale",
        },
        {
            name: "Terms of Services",
            url: "/dashboard/general/terms",
            icon: "ScrollText",
        },
    ],
};

export function Sidebar() {
    const { data: user } = trpc.users.currentUser.useQuery();

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
                    className={cn({
                        hidden: !isGeneral,
                    })}
                />

                <NavBrand
                    items={data.navBrand}
                    className={cn({
                        hidden: !isBrand,
                    })}
                />

                <NavLegal
                    legal={data.legal}
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
