"use client";

import { Icons } from "@/components/icons";
import {
    Sidebar as ShadSidebar,
    SidebarContent,
    SidebarFooter,
    SidebarHeader,
    SidebarRail,
} from "@/components/ui/sidebar";
import {
    BitFieldBrandPermission,
    BitFieldSitePermission,
} from "@/config/permissions";
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
            permissions?: number;
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
            permissions: number;
        }[];
    }[];
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
    navMain: [
        {
            title: "Dashboard",
            url: "#",
            icon: "LayoutDashboard",
            items: [
                {
                    title: "Analytics",
                    url: "/dashboard/general/analytics",
                    permissions:
                        BitFieldSitePermission.VIEW_ANALYTICS |
                        BitFieldSitePermission.MANAGE_SETTINGS,
                },
                {
                    title: "Reports",
                    url: "/dashboard/general/reports",
                    permissions:
                        BitFieldSitePermission.VIEW_ANALYTICS |
                        BitFieldSitePermission.MANAGE_SETTINGS,
                },
                {
                    title: "Metrics",
                    url: "/dashboard/general/metrics",
                    permissions:
                        BitFieldSitePermission.VIEW_ANALYTICS |
                        BitFieldSitePermission.MANAGE_SETTINGS,
                },
                {
                    title: "Logs",
                    url: "/dashboard/general/logs",
                    permissions:
                        BitFieldSitePermission.VIEW_ANALYTICS |
                        BitFieldSitePermission.MANAGE_SETTINGS,
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
                    permissions: BitFieldSitePermission.MANAGE_CONTENT,
                },
                {
                    title: "About",
                    url: "/dashboard/general/about",
                    permissions: BitFieldSitePermission.MANAGE_CONTENT,
                },
                {
                    title: "Blogs",
                    url: "/dashboard/general/blogs",
                    permissions: BitFieldSitePermission.MANAGE_BLOGS,
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
                    permissions:
                        BitFieldSitePermission.VIEW_USERS |
                        BitFieldSitePermission.MANAGE_USERS,
                },
                {
                    title: "Brands",
                    url: "/dashboard/general/brands",
                    permissions:
                        BitFieldSitePermission.MANAGE_BRANDS |
                        BitFieldSitePermission.VIEW_BRANDS,
                },
                {
                    title: "Roles",
                    url: "/dashboard/general/roles",
                    permissions:
                        BitFieldSitePermission.MANAGE_ROLES |
                        BitFieldSitePermission.VIEW_ROLES,
                },
                {
                    title: "Tags",
                    url: "/dashboard/general/tags",
                    permissions: BitFieldSitePermission.MANAGE_BLOG_TAGS,
                },
                {
                    title: "Tickets",
                    url: "/dashboard/general/tickets",
                    permissions:
                        BitFieldSitePermission.MANAGE_FEEDBACK |
                        BitFieldSitePermission.VIEW_FEEDBACK,
                },
                {
                    title: "Subscribers",
                    url: "/dashboard/general/newsletter",
                    permissions:
                        BitFieldSitePermission.MANAGE_SETTINGS |
                        BitFieldSitePermission.VIEW_SETTINGS,
                },
                {
                    title: "Waitlist",
                    url: "/dashboard/general/brand-waitlist",
                    permissions:
                        BitFieldSitePermission.MANAGE_SETTINGS |
                        BitFieldSitePermission.VIEW_SETTINGS,
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
                    permissions: BitFieldSitePermission.MANAGE_CATEGORIES,
                },
                {
                    title: "Sub Categories",
                    url: "/dashboard/general/sub-categories",
                    permissions: BitFieldSitePermission.MANAGE_CATEGORIES,
                },
                {
                    title: "Product Types",
                    url: "/dashboard/general/product-types",
                    permissions: BitFieldSitePermission.MANAGE_CATEGORIES,
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
                    permissions: BitFieldBrandPermission.VIEW_ANALYTICS,
                },
                {
                    title: "Reports",
                    url: "/dashboard/brand/reports",
                    permissions: BitFieldBrandPermission.VIEW_ANALYTICS,
                },
                {
                    title: "Metrics",
                    url: "/dashboard/brand/metrics",
                    permissions: BitFieldBrandPermission.VIEW_ANALYTICS,
                },
                {
                    title: "Logs",
                    url: "/dashboard/brand/logs",
                    permissions: BitFieldBrandPermission.VIEW_ANALYTICS,
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
                    permissions: BitFieldBrandPermission.MANAGE_BRANDING,
                },
                {
                    title: "Products",
                    url: "/dashboard/brand/products",
                    permissions: BitFieldBrandPermission.MANAGE_PRODUCTS,
                },
                {
                    title: "Orders",
                    url: "/dashboard/brand/orders",
                    permissions: BitFieldBrandPermission.VIEW_ORDERS,
                },
                {
                    title: "Coupons",
                    url: "/dashboard/brand/coupons",
                    permissions: BitFieldBrandPermission.MANAGE_DISCOUNTS,
                },
            ],
        },
    ],
    legal: [
        {
            name: "Privacy Policy",
            url: "/dashboard/general/privacy",
            icon: "Scale",
            permissions: BitFieldSitePermission.MANAGE_SETTINGS,
        },
        {
            name: "Terms of Services",
            url: "/dashboard/general/terms",
            icon: "ScrollText",
            permissions: BitFieldSitePermission.MANAGE_SETTINGS,
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
                    userPermissions={userPermissions}
                    className={cn({
                        hidden: !isGeneral,
                    })}
                />

                <NavBrand
                    items={data.navBrand}
                    userPermissions={userPermissions}
                    className={cn({
                        hidden: !isBrand,
                    })}
                />

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
