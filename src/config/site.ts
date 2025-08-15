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
                        name: "Community",
                        href: "/blogs",
                    },
                    {
                        name: "Shop",
                        href: "/shop",
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
                        name: "Become a Seller",
                        href: "/become-a-seller",
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
                title: "Advertisements",
                url: "/dashboard/general/advertisements",
                permissions: BitFieldSitePermission.MANAGE_CONTENT,
            },
            {
                title: "Brand Products",
                url: "/dashboard/general/brand-products",
                permissions: BitFieldSitePermission.MANAGE_CONTENT,
            },
            {
                title: "Shop by Category",
                url: "/dashboard/general/shop-by-category",
                permissions: BitFieldSitePermission.MANAGE_CONTENT,
            },
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
                title: "Brands Info",
                url: "/dashboard/general/brands/verifications",
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
            {
                title: "Orders",
                url: "/dashboard/general/orders",
                permissions: BitFieldSitePermission.MANAGE_BRANDS,
            },
            {
                title: "Orders Intent Table",
                url: "/dashboard/general/order-intent",
                permissions: BitFieldSitePermission.MANAGE_BRANDS,
            },
        ],
    },
{
    title: "Marketing Management",
    url: "#",
    icon: "Megaphone",
    items: [
        {
            title: "Bulk Email Campaigns",
            url: "/dashboard/general/email-campaigns",
            permissions: BitFieldSitePermission.MANAGE_CATEGORIES,
        },
        {
            title: "Bulk WhatsApp Messaging",
            url: "/dashboard/general/whatsapp-messaging",
            permissions: BitFieldSitePermission.MANAGE_CATEGORIES | BitFieldSitePermission.MANAGE_BRANDS,
        }
    ]
},
{
    title: "Women Home Page Section",
    url: "#",
    icon: "Megaphone",
    hidden: true,
    items: [
        {
            title: "Women Banners Section",
            url: "/dashboard/general/women-section/women-banner",
            permissions: BitFieldSitePermission.MANAGE_CATEGORIES,
        },
        {
            title: "Explore Categories Section",
            url: "/dashboard/general/women-section/explore-category",
            permissions: BitFieldSitePermission.MANAGE_CATEGORIES | BitFieldSitePermission.MANAGE_BRANDS,
        },
        {
            title: "Elavate Your Looks Section",
            url: "/dashboard/general/women-section/elavate-looks",
            permissions: BitFieldSitePermission.MANAGE_CATEGORIES | BitFieldSitePermission.MANAGE_BRANDS,
        },
        {
            title: "Outfit Varients",
            url: "/dashboard/general/women-section/outfit-varients",
            permissions: BitFieldSitePermission.MANAGE_CATEGORIES | BitFieldSitePermission.MANAGE_BRANDS,
        },
        {
            title: "Style Directory Section",
            url: "/dashboard/general/women-section/style-directory",
            permissions: BitFieldSitePermission.MANAGE_CATEGORIES | BitFieldSitePermission.MANAGE_BRANDS,
        },
        {
            title: "New Collection Section",
            url: "/dashboard/general/women-section/new-collection",
            permissions: BitFieldSitePermission.MANAGE_CATEGORIES | BitFieldSitePermission.MANAGE_BRANDS,
        },
        {
            title: "Discount Offer Section ",
            url: "/dashboard/general/women-section/discount-offer",
            permissions: BitFieldSitePermission.MANAGE_CATEGORIES | BitFieldSitePermission.MANAGE_BRANDS,
        },
        {
            title: "Mood Board Section ",
            url: "/dashboard/general/women-section/mood-board",
            permissions: BitFieldSitePermission.MANAGE_CATEGORIES | BitFieldSitePermission.MANAGE_BRANDS,
        },
         {
            title: "Top Collection Section ",
            url: "/dashboard/general/women-section/top-collection",
            permissions: BitFieldSitePermission.MANAGE_CATEGORIES | BitFieldSitePermission.MANAGE_BRANDS,
        },
        {
            title: "Seasonal Sale Section ",
            url: "/dashboard/general/women-section/seasonal-sale",
            permissions: BitFieldSitePermission.MANAGE_CATEGORIES | BitFieldSitePermission.MANAGE_BRANDS,
        },
                {
            title: "Find Your Style Section ",
            url: "/dashboard/general/women-section/find-your-style",
            permissions: BitFieldSitePermission.MANAGE_CATEGORIES | BitFieldSitePermission.MANAGE_BRANDS,
        },
                {
            title: "Suggested Look Section ",
            url: "/dashboard/general/women-section/suggested-looks",
            permissions: BitFieldSitePermission.MANAGE_CATEGORIES | BitFieldSitePermission.MANAGE_BRANDS,
        },
        {
            title: "Brand Story Telling Section ",
            url: "/dashboard/general/women-section/brand-story-telling",
            permissions: BitFieldSitePermission.MANAGE_CATEGORIES | BitFieldSitePermission.MANAGE_BRANDS,
        },
        {
            title: "Skincare Section ",
            url: "/dashboard/general/women-section/skincare-section",
            permissions: BitFieldSitePermission.MANAGE_CATEGORIES | BitFieldSitePermission.MANAGE_BRANDS,
        },
                       {
            title: "Get Ready Section",
            url: "/dashboard/general/women-section/get-ready",
            permissions: BitFieldSitePermission.MANAGE_CATEGORIES | BitFieldSitePermission.MANAGE_BRANDS,
        },
                {
            title: "Skincare Section",
            url: "/dashboard/general/women-section/new-discount-collection",
            permissions: BitFieldSitePermission.MANAGE_CATEGORIES | BitFieldSitePermission.MANAGE_BRANDS,
        },

    ]
},
{
    title: "Men Home Page Section",
    url: "#",
    icon: "Megaphone",
    hidden: true,
    items: [
        {
            title: "Mens Banners Section",
            url: "/dashboard/general/men-section/men-banner",
            permissions: BitFieldSitePermission.MANAGE_CATEGORIES,
        },
        {
            title: "Explore Categories Section",
            url: "/dashboard/general/men-section/explore-category",
            permissions: BitFieldSitePermission.MANAGE_CATEGORIES | BitFieldSitePermission.MANAGE_BRANDS,
        },
        {
            title: "Elavate Your Looks Section",
            url: "/dashboard/general/men-section/elavate-looks",
            permissions: BitFieldSitePermission.MANAGE_CATEGORIES | BitFieldSitePermission.MANAGE_BRANDS,
        },
        {
            title: "Outfit Varients",
            url: "/dashboard/general/men-section/outfit-varients",
            permissions: BitFieldSitePermission.MANAGE_CATEGORIES | BitFieldSitePermission.MANAGE_BRANDS,
        },
        {
            title: "Style Directory Section",
            url: "/dashboard/general/men-section/style-directory",
            permissions: BitFieldSitePermission.MANAGE_CATEGORIES | BitFieldSitePermission.MANAGE_BRANDS,
        },
         {
            title: "Top Collection Section ",
            url: "/dashboard/general/men-section/top-collection",
            permissions: BitFieldSitePermission.MANAGE_CATEGORIES | BitFieldSitePermission.MANAGE_BRANDS,
        },
        {
            title: "Discount Offer Section ",
            url: "/dashboard/general/men-section/discount-offer",
            permissions: BitFieldSitePermission.MANAGE_CATEGORIES | BitFieldSitePermission.MANAGE_BRANDS,
        },
        {
            title: "Seasonal Sale Section ",
            url: "/dashboard/general/men-section/seasonal-sale",
            permissions: BitFieldSitePermission.MANAGE_CATEGORIES | BitFieldSitePermission.MANAGE_BRANDS,
        },

        {
            title: "Suggested Look Section ",
            url: "/dashboard/general/men-section/suggested-looks",
            permissions: BitFieldSitePermission.MANAGE_CATEGORIES | BitFieldSitePermission.MANAGE_BRANDS,
        },
       {
            title: "New Collection Section",
            url: "/dashboard/general/men-section/new-collection",
            permissions: BitFieldSitePermission.MANAGE_CATEGORIES | BitFieldSitePermission.MANAGE_BRANDS,
        },
        {
            title: "Top Collection Banner Section",
            url: "/dashboard/general/men-section/top-collection-banner",
            permissions: BitFieldSitePermission.MANAGE_CATEGORIES | BitFieldSitePermission.MANAGE_BRANDS,
        },
                {
            title: "MoodBoard Section",
            url: "/dashboard/general/men-section/mood-board",
            permissions: BitFieldSitePermission.MANAGE_CATEGORIES | BitFieldSitePermission.MANAGE_BRANDS,
        },

                {
            title: "Fresh Ink Section",
            url: "/dashboard/general/men-section/fresh-ink-collection",
            permissions: BitFieldSitePermission.MANAGE_CATEGORIES | BitFieldSitePermission.MANAGE_BRANDS,
        },



    ]
},


{
    title: "Kids Home Page Section",
    url: "#",
    icon: "Megaphone",
    hidden: true,
    items: [
        {
            title: "Kids Banners Section",
            url: "/dashboard/general/kids/kids-banner",
            permissions: BitFieldSitePermission.MANAGE_CATEGORIES,
        },
        {
            title: "Explore Categories Section",
            url: "/dashboard/general/kids/explore-category",
            permissions: BitFieldSitePermission.MANAGE_CATEGORIES | BitFieldSitePermission.MANAGE_BRANDS,
        },
        {
            title: "Kids Special Care Section",
            url: "/dashboard/general/kids/special-care",
            permissions: BitFieldSitePermission.MANAGE_CATEGORIES | BitFieldSitePermission.MANAGE_BRANDS,
        },
        {
            title: "Doll Banner Section",
            url: "/dashboard/general/kids/doll-banner-section",
            permissions: BitFieldSitePermission.MANAGE_CATEGORIES | BitFieldSitePermission.MANAGE_BRANDS,
        },
        {
            title: "Discount Section",
            url: "/dashboard/general/kids/discount-banner",
            permissions: BitFieldSitePermission.MANAGE_CATEGORIES | BitFieldSitePermission.MANAGE_BRANDS,
        },
        {
            title: "Twining Mom Section ",
            url: "/dashboard/general/kids/twining-section",
            permissions: BitFieldSitePermission.MANAGE_CATEGORIES | BitFieldSitePermission.MANAGE_BRANDS,
        },
                {
            title: "Kids Gentle Care Section ",
            url: "/dashboard/general/kids/gentle-care",
            permissions: BitFieldSitePermission.MANAGE_CATEGORIES | BitFieldSitePermission.MANAGE_BRANDS,
        },
         {
            title: "Frosty Formal Shirt Section ",
            url: "/dashboard/general/kids/frosty-formal",
            permissions: BitFieldSitePermission.MANAGE_CATEGORIES | BitFieldSitePermission.MANAGE_BRANDS,
        },
    ]
},

{
    title: "Home and Living  Page Section",
    url: "#",
    icon: "Megaphone",
    hidden: true,
    items: [
        {
            title: "Banners Section",
            url: "/dashboard/general/home-living/banners",
            permissions: BitFieldSitePermission.MANAGE_CATEGORIES,
        },
        {
            title: "Explore Categories Section",
            url: "/dashboard/general/home-living/explore-category",
            permissions: BitFieldSitePermission.MANAGE_CATEGORIES | BitFieldSitePermission.MANAGE_BRANDS,
        },
        {
            title: "New Collection Section",
            url: "/dashboard/general/home-living/new-collection",
            permissions: BitFieldSitePermission.MANAGE_CATEGORIES | BitFieldSitePermission.MANAGE_BRANDS,
        },
                {
            title: "Curate Concious Section",
            url: "/dashboard/general/home-living/curate-concious",
            permissions: BitFieldSitePermission.MANAGE_CATEGORIES | BitFieldSitePermission.MANAGE_BRANDS,
        },
        {
            title: "Middle Banner Section",
            url: "/dashboard/general/home-living/middle-banner",
            permissions: BitFieldSitePermission.MANAGE_CATEGORIES | BitFieldSitePermission.MANAGE_BRANDS,
        },
                {
            title: "Eco Banner Section",
            url: "/dashboard/general/home-living/eco-banner",
            permissions: BitFieldSitePermission.MANAGE_CATEGORIES | BitFieldSitePermission.MANAGE_BRANDS,
        },
        {
            title: "Brand Section Banner",
            url: "/dashboard/general/home-living/brand-section",
            permissions: BitFieldSitePermission.MANAGE_CATEGORIES | BitFieldSitePermission.MANAGE_BRANDS,
        },
    ]
},


{
    title: "Beauty and Personal Page Section",
    url: "#",
    icon: "Megaphone",
    hidden: true,
    items: [
        {
            title: "Banners Section",
            url: "/dashboard/general/beauty-personal/banners",
            permissions: BitFieldSitePermission.MANAGE_CATEGORIES,
        },
        {
            title: "Explore Categories Section",
            url: "/dashboard/general/beauty-personal/explore-category",
            permissions: BitFieldSitePermission.MANAGE_CATEGORIES | BitFieldSitePermission.MANAGE_BRANDS,
        },
        {
            title: "Skincare Banner Section",
            url: "/dashboard/general/beauty-personal/skincare-banner",
            permissions: BitFieldSitePermission.MANAGE_CATEGORIES | BitFieldSitePermission.MANAGE_BRANDS,
        },
        {
            title: "Beauty care Routine Section",
            url: "/dashboard/general/beauty-personal/beauty-routine",
            permissions: BitFieldSitePermission.MANAGE_CATEGORIES | BitFieldSitePermission.MANAGE_BRANDS,
        },
        {
            title: "Nurture Section",
            url: "/dashboard/general/beauty-personal/nurture-banner",
            permissions: BitFieldSitePermission.MANAGE_CATEGORIES | BitFieldSitePermission.MANAGE_BRANDS,
        },
                {
            title: "Discount Banner Section",
            url: "/dashboard/general/beauty-personal/discount-banner",
            permissions: BitFieldSitePermission.MANAGE_CATEGORIES | BitFieldSitePermission.MANAGE_BRANDS,
        },
        {
            title: "Best Seller Banner",
            url: "/dashboard/general/beauty-personal/best-seller",
            permissions: BitFieldSitePermission.MANAGE_CATEGORIES | BitFieldSitePermission.MANAGE_BRANDS,
        },
        {
            title: "Mindful starter Banner",
            url: "/dashboard/general/beauty-personal/mindful-starter",
            permissions: BitFieldSitePermission.MANAGE_CATEGORIES | BitFieldSitePermission.MANAGE_BRANDS,
        },
        {
            title: "Skin quiz banner",
            url: "/dashboard/general/beauty-personal/skin-quiz",
            permissions: BitFieldSitePermission.MANAGE_CATEGORIES | BitFieldSitePermission.MANAGE_BRANDS,
        },
    ]
},




{
    title: "Updated Home Page Section",
    url: "#",
    icon: "Megaphone",
    hidden: true,
    items: [
        {
            title: "Trusted Curated Banner",
            url: "/dashboard/general/home-page/curated-banner",
            permissions: BitFieldSitePermission.MANAGE_CATEGORIES,
        },
        {
            title: "Brand Introduction Banner",
            url: "/dashboard/general/home-page/brand-introduction",
            permissions: BitFieldSitePermission.MANAGE_CATEGORIES | BitFieldSitePermission.MANAGE_BRANDS,
        },
        {
            title: "Home Matching Banner",
            url: "/dashboard/general/home-page/home-matching",
            permissions: BitFieldSitePermission.MANAGE_CATEGORIES | BitFieldSitePermission.MANAGE_BRANDS,
        },
        {
            title: "Make First Click Banner",
            url: "/dashboard/general/home-page/make-first-click",
            permissions: BitFieldSitePermission.MANAGE_CATEGORIES | BitFieldSitePermission.MANAGE_BRANDS,
        },
        {
            title: "Swap Space Banner",
            url: "/dashboard/general/home-page/swap-space",
            permissions: BitFieldSitePermission.MANAGE_CATEGORIES | BitFieldSitePermission.MANAGE_BRANDS,
        },
        {
            title: "New Artisan Section",
            url: "/dashboard/general/home-page/new-artisan-section",
            permissions: BitFieldSitePermission.MANAGE_CATEGORIES | BitFieldSitePermission.MANAGE_BRANDS,
        },
        {
            title: "New Insta Bannner",
            url: "/dashboard/general/home-page/new-insta-banner",
            permissions: BitFieldSitePermission.MANAGE_CATEGORIES | BitFieldSitePermission.MANAGE_BRANDS,
        },
                {
            title: "Elegance section Bannner",
            url: "/dashboard/general/home-page/effortless-elegance-section",
            permissions: BitFieldSitePermission.MANAGE_CATEGORIES | BitFieldSitePermission.MANAGE_BRANDS,
        },
    {
            title: "Event Banner One",
            url: "/dashboard/general/home-page/event-section-one",
            permissions: BitFieldSitePermission.MANAGE_CATEGORIES | BitFieldSitePermission.MANAGE_BRANDS,
        },
        {
            title: "Event Banner Two(Video)",
            url: "/dashboard/general/home-page/event-section-two",
            permissions: BitFieldSitePermission.MANAGE_CATEGORIES | BitFieldSitePermission.MANAGE_BRANDS,
        },

    ]
},


{
    title: "Ui / Ux Page Section",
    url: "#",
    icon: "Megaphone",
    items: [
    {
            title: "New home Main Page",
            url: "/dashboard/general/home-page/new-home-main-page",
            permissions: BitFieldSitePermission.MANAGE_CATEGORIES | BitFieldSitePermission.MANAGE_BRANDS,
        },
        {
            title: "Mens Section",
            url: "/dashboard/general/men-section/men-main-page",
            permissions: BitFieldSitePermission.MANAGE_CATEGORIES,
        },
        {
            title: "Womens Section",
            url: "/dashboard/general/women-section/women-main-page",
            permissions: BitFieldSitePermission.MANAGE_CATEGORIES | BitFieldSitePermission.MANAGE_BRANDS,
        },
        {
            title: "Kids Section",
            url: "/dashboard/general/kids/kids-main-page",
            permissions: BitFieldSitePermission.MANAGE_CATEGORIES | BitFieldSitePermission.MANAGE_BRANDS,
        },
        {
            title: "Home and Living Section",
            url: "/dashboard/general/home-living/home-living-main-page",
            permissions: BitFieldSitePermission.MANAGE_CATEGORIES | BitFieldSitePermission.MANAGE_BRANDS,
        },
        {
            title: "Beauty Products",
            url: "/dashboard/general/beauty-personal/beauty-products-main-page",
            permissions: BitFieldSitePermission.MANAGE_CATEGORIES | BitFieldSitePermission.MANAGE_BRANDS,
        },
    ]
}

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
                {
                    title: "Orders",
                    url: `/dashboard/brands/${brandId}/orders`,
                    permissions: BitFieldBrandPermission.MANAGE_PRODUCTS,
                },
            ],
        },
    ];
}
