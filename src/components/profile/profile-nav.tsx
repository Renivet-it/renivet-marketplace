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

function getFinalHref(item: Item): string {
    if (item.href.startsWith("/profile")) {
        return item.href;
    }
    if (["contact-us", "shopping-bag"].includes(item.name)) {
        return item.href;
    }
    if (item.href === "/") {
        return "/profile";
    }
    return `/profile${item.href.startsWith("/") ? "" : "/"}${item.href}`;
}

function isActive(pathname: string, item: Item) {
    const targetHref = getFinalHref(item);
    if (targetHref === "/profile") {
        return pathname === "/profile" || pathname === "/profile/";
    }
    return pathname === targetHref || pathname.startsWith(targetHref + "/");
}

function NavItem({
    item,
    pathname,
    compact = false,
}: {
    item: Item;
    pathname: string;
    compact?: boolean;
}) {
    const Icon = Icons[item.icon];
    const active = isActive(pathname, item);
    const isDisabled = item.href === "#";

    const content = (
        <div
            className={cn(
                compact
                    ? "group flex items-center justify-between rounded-md px-2 py-2 text-[13px] font-medium transition-colors hover:bg-[#f4f8f6]"
                    : "group flex items-center justify-between rounded-lg px-3 py-2.5 text-sm font-medium transition-colors hover:bg-muted/50",
                active && compact
                    ? "rounded-l-none border-l-[3px] border-[#1d5b47] bg-[#edf7f1] text-[#164d3d]"
                    : active
                      ? "rounded-l-none border-l-4 border-blue-600 bg-blue-50 text-blue-600"
                      : compact
                        ? "text-[#536174] hover:text-[#173b30]"
                        : "text-gray-600 hover:text-gray-900",
                isDisabled && "cursor-default opacity-60 hover:bg-transparent"
            )}
        >
            <div className="flex items-center gap-3">
                <Icon
                    className={cn(
                        compact ? "size-4 shrink-0" : "size-[18px] shrink-0",
                        active && compact
                            ? "text-[#1d5b47]"
                            : active
                              ? "text-blue-600"
                              : compact
                                ? "text-[#536174] group-hover:text-[#173b30]"
                                : "text-gray-500 group-hover:text-gray-700"
                    )}
                />
                <span>{item.label ?? convertValueToLabel(item.name)}</span>
            </div>
            {item.count !== undefined && item.count > 0 && (
                <span
                    className={cn(
                        "flex size-5 items-center justify-center rounded-full text-[10px] font-bold",
                        compact
                            ? "bg-[#edf7f1] text-[#1d5b47]"
                            : "bg-blue-100 text-blue-600"
                    )}
                >
                    {item.count}
                </span>
            )}
        </div>
    );

    if (isDisabled) {
        return content;
    }

    const finalHref = getFinalHref(item);

    return <Link href={finalHref}>{content}</Link>;
}

function NavGroup({
    title,
    items,
    pathname,
    compact = false,
}: {
    title?: string;
    items: Item[];
    pathname: string;
    compact?: boolean;
}) {
    return (
        <div className="mb-6">
            {title && (
                <h4
                    className={cn(
                        "mb-2 px-3 text-xs font-semibold uppercase tracking-wider",
                        compact
                            ? "text-[9px] tracking-[0.08em] text-[#9aa5b3]"
                            : "text-gray-400"
                    )}
                >
                    {title}
                </h4>
            )}
            <div className="flex flex-col gap-1">
                {items.map((item) => (
                    <NavItem
                        key={item.name}
                        item={item}
                        pathname={pathname}
                        compact={compact}
                    />
                ))}
            </div>
        </div>
    );
}

export function ProfileNav({ className, ...props }: GenericProps) {
    const pathname = usePathname();
    const isCorporateDashboard = false;
    const { data: user, isPending: isUserLoading } =
        trpc.general.users.currentUser.useQuery();
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
    const { data: unreadNotifications } =
        trpc.general.notifications.unreadCount.useQuery(undefined, {
            enabled: !!user?.id,
        });

    // Using store/logic for cart count roughly
    const cartCount = (userCart ?? [])
        .filter(
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
        )
        .reduce(
            (total, item) => total + Math.max(0, Number(item.quantity) || 0),
            0
        );

    const mainNavItems: Item[] = [
        {
            icon: "Home",
            name: "overview",
            href: "/",
            label: isCorporateDashboard ? "Dashboard" : "Overview",
        },
        {
            icon: "ShoppingBag",
            name: "orders",
            href: "/orders",
            label: isCorporateDashboard ? "My Orders" : "Orders",
            count: orders?.length,
        },
        {
            icon: "Briefcase",
            name: "corporate",
            href: "/profile/corporate",
            label: "Corporate Procurement",
        },
        {
            icon: "Heart",
            name: "wishlist",
            href: "/wishlist",
            label: isCorporateDashboard ? "Saved Items" : "Wishlist",
            count: wishlist?.length,
        },
        {
            icon: "ShoppingCart",
            name: "shopping-bag",
            href: "/mycart",
            label: isCorporateDashboard ? "Cart" : "Shopping Bag",
            count: cartCount,
        },
        {
            icon: "LayoutDashboard",
            name: "impact-dashboard",
            href: "#",
            label: isCorporateDashboard
                ? "Sustainability Impact"
                : "Impact Dashboard",
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
            href: "/notifications",
            label: "Notifications",
            count: unreadNotifications,
        },
    ];

    const supportItems: Item[] = [
        {
            icon: "CircleHelp",
            name: "help-center",
            href: "/profile/help-center",
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
                className={cn(
                    "hidden md:block",
                    isCorporateDashboard && "md:-my-10 md:-ml-8",
                    className
                )}
                style={{
                    width: isCorporateDashboard ? 218 : 300,
                    minHeight: isCorporateDashboard ? "100vh" : 966,
                }}
                {...props}
            >
                <div
                    className={cn(
                        "h-full bg-white font-inter",
                        isCorporateDashboard
                            ? "border-r border-[#e4e9e7] px-3 py-0 shadow-none"
                            : "rounded-2xl p-6 shadow-sm ring-1 ring-gray-200"
                    )}
                    style={{ minHeight: isCorporateDashboard ? "100vh" : 966 }}
                >
                    {/* User Profile Section */}
                    {user ? (
                        <div
                            className={cn(
                                "flex flex-col items-center",
                                isCorporateDashboard
                                    ? "mb-5 border-b border-[#eef1ef] px-1 pb-5 pt-5"
                                    : "mb-8"
                            )}
                        >
                            <div
                                className={cn(
                                    "mb-4 flex items-center justify-center rounded-full bg-gray-100 p-1",
                                    isCorporateDashboard
                                        ? "size-14 bg-[#c4512b] p-0 text-white"
                                        : "size-20"
                                )}
                            >
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

                            <h3
                                className={cn(
                                    "font-bold text-gray-900",
                                    isCorporateDashboard ? "text-sm" : "text-lg"
                                )}
                            >
                                {user.firstName} {user.lastName}
                            </h3>
                            <p
                                className={cn(
                                    "text-gray-500",
                                    isCorporateDashboard
                                        ? "text-[11px]"
                                        : "text-sm"
                                )}
                            >
                                {hideEmail(user.email)}
                            </p>
                            <Link
                                href="/profile"
                                className={cn(
                                    "mt-2 text-xs font-semibold hover:underline",
                                    isCorporateDashboard
                                        ? "text-[#1d5b47]"
                                        : "text-blue-600 hover:text-blue-700"
                                )}
                            >
                                Edit Profile
                            </Link>
                        </div>
                    ) : (
                        <div
                            className={cn(
                                "flex flex-col items-center opacity-0",
                                isCorporateDashboard
                                    ? "mb-5 border-b border-[#eef1ef] pb-5 pt-5"
                                    : "mb-8"
                            )}
                            aria-hidden="true"
                        >
                            <div
                                className={cn(
                                    "mb-4 rounded-full",
                                    isCorporateDashboard ? "size-14" : "size-20"
                                )}
                            />
                            <div className="h-5 w-32 rounded-full" />
                            <div className="mt-2 h-4 w-40 rounded-full" />
                            <div className="mt-3 h-3 w-20 rounded-full" />
                        </div>
                    )}

                    {/* Navigation */}
                    <nav className={isCorporateDashboard ? "pt-3" : undefined}>
                        <NavGroup
                            title="DASHBOARD"
                            items={mainNavItems}
                            pathname={pathname}
                            compact={isCorporateDashboard}
                        />

                        <NavGroup
                            title="ACCOUNT"
                            items={accountItems}
                            pathname={pathname}
                            compact={isCorporateDashboard}
                        />

                        <NavGroup
                            title="SUPPORT"
                            items={supportItems}
                            pathname={pathname}
                            compact={isCorporateDashboard}
                        />
                    </nav>
                </div>
            </div>
        </>
    );
}
