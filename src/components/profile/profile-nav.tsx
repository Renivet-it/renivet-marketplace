"use client";

import { DEFAULT_AVATAR_URL } from "@/config/const";
import { trpc } from "@/lib/trpc/client";
import { cn, convertValueToLabel, hideEmail } from "@/lib/utils";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Icons } from "../icons";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import { Separator } from "../ui/separator";

interface Item {
    icon: keyof typeof Icons;
    name: string;
    href: string;
    label?: string;
}

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
    },
    {
        icon: "Heart",
        name: "wishlist",
        href: "/wishlist",
        label: "Wishlist",
    },
    {
        icon: "ShoppingCart",
        name: "shopping-bag",
        href: "/cart",
        label: "Shopping Bag",
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
        href: "/",
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

function isActive(pathname: string, item: Item) {
    const activeSegment = pathname.split("/").pop();
    if (item.href === "/") {
        // "overview" and "personal-details" both map to /profile
        return activeSegment === "profile";
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
                "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                active
                    ? "bg-[#92b5db] text-accent-foreground"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground",
                isDisabled && "cursor-default opacity-60 hover:bg-transparent"
            )}
        >
            <Icon className="size-[18px] shrink-0" />
            <span>{item.label ?? convertValueToLabel(item.name)}</span>
        </div>
    );

    if (isDisabled) {
        return content;
    }

    // return <Link href={`/profile${item.href}`}>{content}</Link>;
    const finalHref =
        item.name === "contact-us" ? item.href : `/profile${item.href}`;

    return <Link href={finalHref}>{content}</Link>;
}

function NavGroup({ items, pathname }: { items: Item[]; pathname: string }) {
    return (
        <div className="flex flex-col gap-0.5">
            {items.map((item) => (
                <NavItem key={item.name} item={item} pathname={pathname} />
            ))}
        </div>
    );
}

export function ProfileNav({ className, ...props }: GenericProps) {
    const pathname = usePathname();
    const { data: user } = trpc.general.users.currentUser.useQuery();

    return (
        <>
            {/* Desktop Sidebar */}
            <div
                className={cn("hidden md:block", className)}
                style={{ width: 300, minHeight: 966 }}
                {...props}
            >
                <div
                    className="rounded-lg border bg-card"
                    style={{ minHeight: 966 }}
                >
                    {/* User Profile Section */}
                    {user && (
                        <div className="flex flex-col items-center px-4 pb-2 pt-6">
                            <Avatar className="size-16 bg-muted">
                                <AvatarImage
                                    src={user.avatarUrl ?? DEFAULT_AVATAR_URL}
                                    alt={user.firstName}
                                />
                                <AvatarFallback className="text-lg">
                                    {user.firstName[0].toUpperCase()}
                                </AvatarFallback>
                            </Avatar>

                            <p className="mt-3 text-sm font-semibold">
                                {user.firstName} {user.lastName}
                            </p>
                            <p className="text-xs text-muted-foreground">
                                {hideEmail(user.email)}
                            </p>
                            <Link
                                href="/profile"
                                className="mt-1 text-xs font-medium text-primary hover:underline"
                            >
                                Edit Profile
                            </Link>

                            <Separator className="mt-4" />
                        </div>
                    )}

                    {/* Navigation */}
                    <div className="space-y-1 p-3">
                        <NavGroup items={mainNavItems} pathname={pathname} />

                        <Separator className="my-2" />

                        <NavGroup items={accountItems} pathname={pathname} />

                        <Separator className="my-2" />

                        <NavGroup items={supportItems} pathname={pathname} />
                    </div>
                </div>
            </div>
        </>
    );
}
