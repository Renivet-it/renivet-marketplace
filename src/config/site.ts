import { getAbsoluteURL } from "@/lib/utils";
import { BitFieldBrandPermission, BitFieldSitePermission } from "./permissions";

export const siteConfig: SiteConfig = {
    name: "Renivet",
    description:
        "A marketplace for digital products, services, and more. Buy and sell items with ease.",
    longDescription:
        "Renivet is a marketplace for digital products, services, and more. Buy and sell items with ease. We offer a wide range of categories, including software, graphics, music, and more.",
    keywords: [
        "marketplace",
        "digital products",
        "services",
        "buy",
        "sell",
        "software",
        "graphics",
        "music",
    ],
    category: "Marketplace",
    developer: {
        name: "DRVGO",
        url: "https://itsdrvgo.me/",
    },
    og: {
        url: getAbsoluteURL("/og.webp"),
        width: 1200,
        height: 630,
    },
    links: {
        Facebook: "#",
        Twitter: "#",
        Instagram: "https://www.instagram.com/renivet__",
        Linkedin: "https://www.linkedin.com/company/renivet/",
        Youtube: "#",
    },
    contact: {
        officeHours: "Monday - Friday, 9:00 AM - 5:00 PM",
        email: "support@renivet.com",
        phone: "+1 (234) 567-8901",
        location: "1234 Main Street, New York, NY 10001",
    },
    menu: [
        {
            name: "About",
            description: "Learn more about us",
            href: "/about",
            icon: "User",
        },
        {
            name: "Shop",
            description: "Browse our products",
            href: "/shop",
            icon: "ShoppingBag",
            isDisabled: true,
        },
        {
            name: "Blogs",
            description: "Read our latest articles",
            href: "/blogs",
            icon: "BookOpen",
        },
        {
            name: "Contact",
            description: "Get in touch with us",
            href: "/contact",
            icon: "Headset",
        },
    ],
    footer: {
        menu: [
            {
                name: "About Us",
                items: [
                    {
                        name: "Mission",
                        href: "/about#mission",
                    },
                    {
                        name: "Our Team",
                        href: "/about#team",
                    },
                    {
                        name: "Awards",
                        href: "/about#awards",
                    },
                    {
                        name: "Testimonials",
                        href: "/about#testimonials",
                    },
                    {
                        name: "Join Community",
                        href: "/soon",
                    },
                ],
            },
            {
                name: "Socials",
                items: [
                    {
                        name: "Facebook",
                        href: "/soon",
                    },
                    {
                        name: "Twitter",
                        href: "/soon",
                    },
                    {
                        name: "Instagram",
                        href: "https://www.instagram.com/renivet__",
                    },
                    {
                        name: "Linkedin",
                        href: "https://www.linkedin.com/company/renivet/",
                    },
                    {
                        name: "Youtube",
                        href: "/soon",
                    },
                ],
            },
            {
                name: "Legal",
                items: [
                    {
                        name: "Terms and Conditions",
                        href: "/terms",
                    },
                    {
                        name: "Privacy Policy",
                        href: "/privacy",
                    },
                    {
                        name: "Cookie Policy",
                        href: "/cookies",
                    },
                    {
                        name: "Refund Policy",
                        href: "/refund",
                    },
                ],
            },
        ],
    },
};

export const generalSidebarConfig: GeneralSidebarConfig[] = [
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
                url: "/dashboard/general/subscribers",
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
];

export function generateBrandSideNav(brandId: string): BrandSidebarConfig[] {
    return [
        {
            title: "Dashboard",
            url: "#",
            icon: "LayoutDashboard",
            items: [
                {
                    title: "Analytics",
                    url: `/dashboard/brands/${brandId}/analytics`,
                    permissions: BitFieldBrandPermission.VIEW_ANALYTICS,
                },
                {
                    title: "Reports",
                    url: `/dashboard/brands/${brandId}/reports`,
                    permissions: BitFieldBrandPermission.VIEW_ANALYTICS,
                },
                {
                    title: "Metrics",
                    url: `/dashboard/brands/${brandId}/metrics`,
                    permissions: BitFieldBrandPermission.VIEW_ANALYTICS,
                },
                {
                    title: "Logs",
                    url: `/dashboard/brands/${brandId}/logs`,
                    permissions: BitFieldBrandPermission.VIEW_ANALYTICS,
                },
            ],
        },
        {
            title: "Management",
            url: "#",
            icon: "Settings2",
            items: [
                {
                    title: "Invites",
                    url: `/dashboard/brands/${brandId}/invites`,
                    permissions: BitFieldBrandPermission.MANAGE_INVITES,
                },
                {
                    title: "Roles",
                    url: `/dashboard/brands/${brandId}/roles`,
                    permissions: BitFieldBrandPermission.MANAGE_ROLES,
                },
                {
                    title: "Members",
                    url: `/dashboard/brands/${brandId}/members`,
                    permissions: BitFieldBrandPermission.MANAGE_TEAM,
                },
                {
                    title: "Bans",
                    url: `/dashboard/brands/${brandId}/bans`,
                    permissions: BitFieldBrandPermission.MANAGE_TEAM,
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
                    url: `/dashboard/brands/${brandId}/page`,
                    permissions: BitFieldBrandPermission.MANAGE_BRANDING,
                },
                {
                    title: "Products",
                    url: `/dashboard/brands/${brandId}/products`,
                    permissions: BitFieldBrandPermission.MANAGE_PRODUCTS,
                },
                {
                    title: "Orders",
                    url: `/dashboard/brands/${brandId}/orders`,
                    permissions: BitFieldBrandPermission.VIEW_ORDERS,
                },
                {
                    title: "Coupons",
                    url: `/dashboard/brands/${brandId}/coupons`,
                    permissions: BitFieldBrandPermission.MANAGE_DISCOUNTS,
                },
            ],
        },
    ];
}
