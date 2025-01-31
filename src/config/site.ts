import { getAbsoluteURL } from "@/lib/utils";
import { BitFieldBrandPermission, BitFieldSitePermission } from "./permissions";

export const siteConfig: SiteConfig = {
    name: "Renivet",
    description:
        "A marketplace bridging conscious consumers and responsible brands, setting a new standard for transparency and circularity in fashion. Sustainability isn't an option - it's the standard!",
    longDescription:
        "Renivet is a marketplace bridging conscious consumers and responsible brands, setting a new standard for transparency and circularity in fashion. Renivet transforms shopping into a step toward a circular fashion economy. Sustainability isn't an option - it's the standard!",
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
                        name: "Contact Us",
                        href: "/contact",
                    },
                    {
                        name: "FAQs",
                        href: "/about#faqs",
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
                        name: "Shipping Policy",
                        href: "/shipping-policy",
                    },
                    {
                        name: "Refund Policy",
                        href: "/refund-policy",
                    },
                ],
            },
        ],
    },
};

export const generalSidebarConfig: GeneralSidebarConfig[] = [
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
                title: "Marketing Strip",
                url: "/dashboard/general/marketing-strip",
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
            {
                title: "Plans",
                url: "/dashboard/general/plans",
                permissions: BitFieldSitePermission.MANAGE_SETTINGS,
            },
            {
                title: "Coupons",
                url: "/dashboard/general/coupons",
                permissions: BitFieldSitePermission.MANAGE_SETTINGS,
            },
        ],
    },
    {
        title: "Products",
        url: "#",
        icon: "Package",
        items: [
            {
                title: "Category Requests",
                url: "/dashboard/general/category-requests",
                permissions: BitFieldSitePermission.MANAGE_CATEGORIES,
            },
            {
                title: "Categories",
                url: "/dashboard/general/categories",
                permissions:
                    BitFieldSitePermission.MANAGE_CATEGORIES |
                    BitFieldSitePermission.MANAGE_BRANDS,
            },
            {
                title: "Sub Categories",
                url: "/dashboard/general/sub-categories",
                permissions:
                    BitFieldSitePermission.MANAGE_CATEGORIES |
                    BitFieldSitePermission.MANAGE_BRANDS,
            },
            {
                title: "Product Types",
                url: "/dashboard/general/product-types",
                permissions:
                    BitFieldSitePermission.MANAGE_CATEGORIES |
                    BitFieldSitePermission.MANAGE_BRANDS,
            },
            {
                title: "Products",
                url: "/dashboard/general/products",
                permissions: BitFieldSitePermission.MANAGE_BRANDS,
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
                    title: "Verification",
                    url: `/dashboard/brands/${brandId}/verification`,
                    permissions: BitFieldBrandPermission.ADMINISTRATOR,
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
                {
                    title: "Media",
                    url: `/dashboard/brands/${brandId}/media`,
                    permissions:
                        BitFieldBrandPermission.MANAGE_BRANDING |
                        BitFieldBrandPermission.MANAGE_PRODUCTS,
                },
                {
                    title: "Memberships",
                    url: `/dashboard/brands/${brandId}/memberships`,
                    permissions: BitFieldBrandPermission.ADMINISTRATOR,
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
            ],
        },
    ];
}
