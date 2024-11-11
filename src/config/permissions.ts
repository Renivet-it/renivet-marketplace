import { Permission } from "@/types";

export const sitePermissions: Permission[] = [
    {
        name: "VIEW_PROTECTED_PAGES",
        description: "Access protected areas of the platform",
        bit: 1 << 0,
    },
    {
        name: "VIEW_USERS",
        description: "View user profiles and basic information",
        bit: 1 << 1,
    },
    {
        name: "MANAGE_USERS",
        description: "Edit, suspend, or delete user accounts",
        bit: 1 << 2,
    },
    {
        name: "VIEW_ROLES",
        description: "View existing roles and permissions",
        bit: 1 << 3,
    },
    {
        name: "MANAGE_ROLES",
        description: "Create, edit, or delete roles and assign permissions",
        bit: 1 << 4,
    },
    {
        name: "VIEW_BRANDS",
        description: "Access brand profiles and information",
        bit: 1 << 5,
    },
    {
        name: "MANAGE_BRANDS",
        description: "Create, edit, or deactivate brands",
        bit: 1 << 6,
    },
    {
        name: "VIEW_ANALYTICS",
        description: "Access platform-wide analytics and reports",
        bit: 1 << 7,
    },
    {
        name: "MANAGE_CONTENT",
        description:
            "Edit or schedule platform-wide content such as banners, landing pages, etc.",
        bit: 1 << 8,
    },
    {
        name: "MANAGE_BLOG_TAGS",
        description: "Create, edit, or delete blog tags",
        bit: 1 << 9,
    },
    {
        name: "MANAGE_BLOGS",
        description: "Create, edit, or delete blog posts",
        bit: 1 << 10,
    },
    {
        name: "MANAGE_CATEGORIES",
        description:
            "Create, edit, or delete product categories and subcategories",
        bit: 1 << 11,
    },
    {
        name: "VIEW_SETTINGS",
        description:
            "Access platform configuration settings without edit permissions",
        bit: 1 << 12,
    },
    {
        name: "MANAGE_SETTINGS",
        description: "Edit and configure platform-wide settings",
        bit: 1 << 13,
    },
    {
        name: "VIEW_FEEDBACK",
        description: "Access user feedback and reviews across the platform",
        bit: 1 << 14,
    },
    {
        name: "MANAGE_FEEDBACK",
        description: "Approve, reject, or delete user feedback and reviews",
        bit: 1 << 15,
    },
    {
        name: "ADMINISTRATOR",
        description:
            "Access to all platform functions, including critical administrative tasks",
        bit: 1 << 16,
    },
];

export enum BitFieldSitePermission {
    VIEW_PROTECTED_PAGES = 1 << 0,
    VIEW_USERS = 1 << 1,
    MANAGE_USERS = 1 << 2,
    VIEW_ROLES = 1 << 3,
    MANAGE_ROLES = 1 << 4,
    VIEW_BRANDS = 1 << 5,
    MANAGE_BRANDS = 1 << 6,
    VIEW_ANALYTICS = 1 << 7,
    MANAGE_CONTENT = 1 << 8,
    MANAGE_BLOG_TAGS = 1 << 9,
    MANAGE_BLOGS = 1 << 10,
    MANAGE_CATEGORIES = 1 << 11,
    VIEW_SETTINGS = 1 << 12,
    MANAGE_SETTINGS = 1 << 13,
    VIEW_FEEDBACK = 1 << 14,
    MANAGE_FEEDBACK = 1 << 15,
    ADMINISTRATOR = 1 << 16,
}

export const brandPermissions: Permission[] = [
    {
        name: "VIEW_ANALYTICS",
        description: "Access brand-specific analytics and reports",
        bit: 1 << 17,
    },
    {
        name: "MANAGE_TEAM",
        description: "Invite or remove team members within the brand",
        bit: 1 << 18,
    },
    {
        name: "MANAGE_PRODUCTS",
        description: "Create, edit, or delete products under the brand",
        bit: 1 << 19,
    },
    {
        name: "MANAGE_DISCOUNTS",
        description: "Create, edit, or delete discounts for products",
        bit: 1 << 20,
    },
    {
        name: "VIEW_ORDERS",
        description: "Access order information and analytics",
        bit: 1 << 21,
    },
    {
        name: "MANAGE_BRANDING",
        description: "Edit brand colors, logo, and other branding elements",
        bit: 1 << 22,
    },
    {
        name: "ADMINISTRATOR",
        description:
            "Access to all brand functions, including critical administrative tasks",
        bit: 1 << 23,
    },
];

export enum BitFieldBrandPermission {
    VIEW_ANALYTICS = 1 << 17,
    MANAGE_TEAM = 1 << 18,
    MANAGE_PRODUCTS = 1 << 19,
    MANAGE_DISCOUNTS = 1 << 20,
    VIEW_ORDERS = 1 << 21,
    MANAGE_BRANDING = 1 << 22,
    ADMINISTRATOR = 1 << 23,
}
