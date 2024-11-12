import { getAbsoluteURL } from "@/lib/utils";

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
