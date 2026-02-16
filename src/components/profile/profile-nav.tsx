"use client";

import { DEFAULT_AVATAR_URL } from "@/config/const";
import { trpc } from "@/lib/trpc/client";
import { cn, convertValueToLabel, hideEmail } from "@/lib/utils";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Icons } from "../icons";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";

interface Item {
    icon: keyof typeof Icons;
    name: string;
    href: string;
    label?: string;
    count?: number;
}

function isActive(pathname: string, item: Item) {
    if (item.href === "/") {
        // "overview" and "personal-details" both map to /profile
        // This logic might need adjustment if sidebar logic changes, but keeping consistent with prev.
        // If exact match needed:
        return pathname === "/profile" || pathname === "/profile/";
    }
    return pathname.includes(item.href.replace("/", ""));
}

function NavItem({ item, pathname }: { item: Item; pathname: string }) {
    const Icon = Icons[item.icon];
    const active = isActive(pathname, item);
    const isDisabled = item.href === "#";

    const content = (
        <div
            className={cn(
                "group flex items-center justify-between rounded-lg px-3 py-2.5 text-sm font-medium transition-colors hover:bg-muted/50",
                active
                    ? "rounded-l-none border-l-4 border-blue-600 bg-blue-50 text-blue-600"
                    : "text-gray-600 hover:text-gray-900",
                isDisabled && "cursor-default opacity-60 hover:bg-transparent"
            )}
        >
            <div className="flex items-center gap-3">
                <Icon
                    className={cn(
                        "size-[18px] shrink-0",
                        active
                            ? "text-blue-600"
                            : "text-gray-500 group-hover:text-gray-700"
                    )}
                />
                <span>{item.label ?? convertValueToLabel(item.name)}</span>
            </div>
            {item.count !== undefined && item.count > 0 && (
                <span className="flex size-5 items-center justify-center rounded-full bg-blue-100 text-[10px] font-bold text-blue-600">
                    {item.count}
                </span>
            )}
        </div>
    );

    if (isDisabled) {
        return content;
    }

    const finalHref =
        item.name === "contact-us" ? item.href : `/profile${item.href}`;

    return <Link href={finalHref}>{content}</Link>;
}

function NavGroup({
    title,
    items,
    pathname,
}: {
    title?: string;
    items: Item[];
    pathname: string;
}) {
    return (
        <div className="mb-6">
            {title && (
                <h4 className="mb-2 px-3 text-xs font-semibold uppercase tracking-wider text-gray-400">
                    {title}
                </h4>
            )}
            <div className="flex flex-col gap-1">
                {items.map((item) => (
                    <NavItem key={item.name} item={item} pathname={pathname} />
                ))}
            </div>
        </div>
    );
}

export function ProfileNav({ className, ...props }: GenericProps) {
    const pathname = usePathname();
    const { data: user } = trpc.general.users.currentUser.useQuery();
    const { data: userCart } = trpc.general.users.cart.getCartForUser.useQuery(
        { userId: user?.id ?? "" },
        { enabled: !!user?.id }
    );
    // Fetch wishlist and orders if needed for badges
    const { data: wishlist } = trpc.general.users.wishlist.getWishlist.useQuery(
        { userId: user?.id ?? "" },
        { enabled: !!user?.id }
    );
    const { data: orders } = trpc.general.orders.getOrdersByUserId.useQuery(
        { userId: user?.id ?? "" },
        { enabled: !!user?.id }
    );

    // Using store/logic for cart count roughly
    const cartCount =
        userCart?.filter(
            (c) =>
                c.product.isPublished &&
                c.product.verificationStatus === "approved" &&
                !c.product.isDeleted &&
                c.product.isAvailable &&
                (!!c.product.quantity ? c.product.quantity > 0 : true) &&
                c.product.isActive &&
                (!c.variant ||
                    (c.variant &&
                        !c.variant.isDeleted &&
                        c.variant.quantity > 0))
        ).length || 0;

    const mainNavItems: Item[] = [
        {
            icon: "Home",
            name: "overview",
            href: "/",
            label: "Overview",
        },
        {
            icon: "ShoppingBag",
            name: "orders",
            href: "/orders",
            label: "Orders",
            count: orders?.length,
        },
        {
            icon: "Heart",
            name: "wishlist",
            href: "/profile/wishlist",
            label: "Wishlist",
            count: wishlist?.length,
        },
        {
            icon: "ShoppingCart",
            name: "shopping-bag",
            href: "/cart",
            label: "Shopping Bag",
            count: cartCount,
        },
        {
            icon: "LayoutDashboard",
            name: "impact-dashboard",
            href: "#",
            label: "Impact Dashboard",
        },
    ];

    const accountItems: Item[] = [
        {
            icon: "User",
            name: "personal-details",
            href: "/personal-details",
            label: "Personal Details",
        },
        {
            icon: "LockKeyhole",
            name: "security",
            href: "/security",
            label: "Security & Privacy",
        },
        {
            icon: "MapPin",
            name: "addresses",
            href: "/addresses",
            label: "Addresses",
        },
        {
            icon: "CreditCard",
            name: "payment-methods",
            href: "#",
            label: "Payment Methods",
        },
        {
            icon: "Bell",
            name: "notifications",
            href: "#",
            label: "Notifications",
        },
    ];

    const supportItems: Item[] = [
        {
            icon: "CircleHelp",
            name: "help-center",
            href: "#",
            label: "Help Center",
        },
        {
            icon: "Info",
            name: "faqs",
            href: "#",
            label: "FAQs",
        },
        {
            icon: "Mail",
            name: "contact-us",
            href: "/contact",
            label: "Contact Us",
        },
    ];

    return (
        <>
            {/* Desktop Sidebar */}
            <div
                className={cn("hidden md:block", className)}
                style={{ width: 300, minHeight: 966 }}
                {...props}
            >
                <div
                    className="h-full rounded-2xl bg-white p-6 shadow-sm ring-1 ring-gray-200"
                    style={{ minHeight: 966 }}
                >
                    {/* User Profile Section */}
                    {user && (
                        <div className="mb-8 flex flex-col items-center">
                            <div className="mb-4 flex size-20 items-center justify-center rounded-full bg-gray-100 p-1">
                                <Avatar className="size-full">
                                    <AvatarImage
                                        src={
                                            user.avatarUrl ?? DEFAULT_AVATAR_URL
                                        }
                                        alt={user.firstName}
                                        className="rounded-full object-cover"
                                    />
                                    <AvatarFallback className="text-xl">
                                        {user.firstName[0].toUpperCase()}
                                    </AvatarFallback>
                                </Avatar>
                            </div>

                            <h3 className="text-lg font-bold text-gray-900">
                                {user.firstName} {user.lastName}
                            </h3>
                            <p className="text-sm text-gray-500">
                                {hideEmail(user.email)}
                            </p>
                            <Link
                                href="/profile"
                                className="mt-2 text-xs font-semibold text-blue-600 hover:text-blue-700 hover:underline"
                            >
                                Edit Profile
                            </Link>
                        </div>
                    )}

                    {/* Navigation */}
                    <nav>
                        <NavGroup
                            title="DASHBOARD"
                            items={mainNavItems}
                            pathname={pathname}
                        />

                        <NavGroup
                            title="ACCOUNT"
                            items={accountItems}
                            pathname={pathname}
                        />

                        <NavGroup
                            title="SUPPORT"
                            items={supportItems}
                            pathname={pathname}
                        />
                    </nav>
                </div>
            </div>
        </>
    );
}
