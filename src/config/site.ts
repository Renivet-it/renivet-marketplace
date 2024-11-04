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
    developer: {
        name: "DRVGO",
        url: "https://itsdrvgo.me/",
    },
    og: {
        url: "/og.webp",
        width: 1200,
        height: 630,
    },
    links: {
        Facebook: "#",
        Twitter: "#",
        Instagram: "#",
        Linkedin: "#",
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
                        name: "Privacy Policy",
                        href: "/privacy",
                    },
                ],
            },
            {
                name: "Services",
                items: [
                    {
                        name: "Web Design",
                        href: "/services/web-design",
                    },
                    {
                        name: "Web Development",
                        href: "/services/web-development",
                    },
                    {
                        name: "Mobile Design",
                        href: "/services/mobile-design",
                    },
                    {
                        name: "UI/UX Design",
                        href: "/services/ui-ux-design",
                    },
                    {
                        name: "Branding Design",
                        href: "/services/branding-design",
                    },
                ],
            },
            {
                name: "Portfolio",
                items: [
                    {
                        name: "Corporate Websites",
                        href: "/portfolio/corporate-websites",
                    },
                    {
                        name: "E-Commerce",
                        href: "/portfolio/e-commerce",
                    },
                    {
                        name: "Mobile Apps",
                        href: "/portfolio/mobile-apps",
                    },
                    {
                        name: "Landing Pages",
                        href: "/portfolio/landing-pages",
                    },
                    {
                        name: "UI/UX Projects",
                        href: "/portfolio/ui-ux-projects",
                    },
                ],
            },
        ],
    },
};
