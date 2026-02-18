"use client";

import { Icons } from "@/components/icons";
import { BitFieldSitePermission } from "@/config/permissions";
import { useNavbarStore } from "@/lib/store";
import { trpc } from "@/lib/trpc/client";
import {
    cn,
    getUserPermissions,
    handleClientError,
    hasPermission,
    hideEmail,
} from "@/lib/utils";
import { useAuth } from "@clerk/nextjs";
import { isClerkAPIResponseError } from "@clerk/nextjs/errors";
import { useMutation } from "@tanstack/react-query";
import {
    ArrowRight,
    ChevronRight,
    FileText,
    Headphones,
    Heart,
    HelpCircle,
    LayoutDashboard,
    LineChart,
    Lock,
    LogOut,
    MapPin,
    MessageCircle,
    Package,
    Ruler,
    Scissors,
    ShieldAlert,
    Shirt,
    ShoppingBag,
    User,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ElementRef, useEffect, useMemo, useRef } from "react";
import { toast } from "sonner";

const extraMenu: SiteConfig["menu"] = [
    {
        name: "Home",
        description: "Go back to the homepage",
        href: "/",
        icon: "Home",
    },
    {
        name: "Shop",
        description: "Browse our products",
        href: "/shop",
        icon: "ShoppingBag",
    },
    {
        name: "About",
        description: "Learn more about us",
        href: "/about",
        icon: "User",
    },
    {
        name: "Blogs",
        description: "Read our blogs",
        href: "/blogs",
        icon: "BookOpen",
    },
    {
        name: "Privacy Policy",
        description: "Read our privacy policy",
        href: "/privacy",
        icon: "Scale",
    },
    {
        name: "Terms of Services",
        description: "Read our terms of service",
        href: "/terms",
        icon: "ScrollText",
    },
];

const boxMenu: SiteConfig["menu"] = [
    {
        name: "Orders",
        href: "/profile/orders",
        icon: "Package",
    },
    {
        name: "Wishlist",
        href: "/profile/wishlist",
        icon: "Heart",
    },
    {
        name: "Cart",
        href: "/mycart",
        icon: "ShoppingCart",
    },
    {
        name: "Help Center",
        href: "/contact",
        icon: "Headset",
    },
];

// Helper Components (Ported from profile/page.tsx)
function SummaryCard({
    icon: Icon,
    title,
    count,
    subtitle,
    href,
    className,
    customCount,
    children,
}: {
    icon: React.ElementType;
    title: string;
    count: string | number;
    subtitle?: string;
    href: string;
    className?: string;
    customCount?: boolean;
    children?: React.ReactNode;
}) {
    // ... [Same implementation as page.tsx]
    return (
        <Link
            href={href}
            className={cn(
                "group relative flex flex-col justify-between rounded-xl bg-white p-4 shadow-sm ring-1 ring-gray-200 transition-all hover:shadow-md md:rounded-2xl md:p-6",
                className
            )}
        >
            <div className="flex items-start justify-between">
                <div className="rounded-lg bg-blue-50 p-2 text-blue-400 md:bg-blue-50 md:text-blue-600">
                    <Icon className="size-5 md:size-6" />
                </div>
            </div>

            <div className="mt-4">
                <h3 className="text-sm font-medium text-gray-500 md:text-base">
                    {title}
                </h3>
                {customCount ? (
                    <p className="mt-1 text-sm font-medium text-gray-400 md:text-2xl md:font-bold md:text-gray-900">
                        {count}
                    </p>
                ) : (
                    <p className="mt-1 text-lg font-bold text-gray-900 md:text-2xl">
                        {count} items
                    </p>
                )}
                {subtitle && (
                    <p className="mt-1 text-[10px] font-medium text-gray-400 md:mt-2 md:text-xs md:text-blue-600">
                        {subtitle}
                    </p>
                )}
                {children}
            </div>

            <div className="absolute bottom-4 right-4 text-gray-300 transition-colors group-hover:text-blue-600 md:bottom-6 md:right-6">
                <ArrowRight className="size-4 md:size-5" />
            </div>
        </Link>
    );
}

function PreferenceCard({
    icon: Icon,
    title,
    description,
    action,
    progress,
}: {
    icon: React.ElementType;
    title: string;
    description: string;
    action: React.ReactNode;
    progress?: number;
}) {
    return (
        <div className="flex items-center gap-4 rounded-xl border border-gray-100 bg-white p-5 shadow-sm">
            <div className="flex size-12 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
                <Icon className="size-6" />
            </div>
            <div className="flex-1">
                <h3 className="font-semibold text-gray-900">{title}</h3>
                <p className="text-sm text-gray-500">{description}</p>
                {progress !== undefined && (
                    <div className="mt-3 h-1.5 w-full max-w-[200px] overflow-hidden rounded-full bg-gray-100">
                        <div
                            className="h-full rounded-full bg-blue-600"
                            style={{ width: `${progress}%` }}
                        />
                    </div>
                )}
            </div>
            <div className="shrink-0">{action}</div>
        </div>
    );
}

export function NavbarMob({ className, ...props }: GenericProps) {
    const router = useRouter();

    const isMenuOpen = useNavbarStore((state) => state.isOpen);
    const setIsMenuOpen = useNavbarStore((state) => state.setIsOpen);

    const navContainerRef = useRef<ElementRef<"div"> | null>(null);
    const navListRef = useRef<ElementRef<"ul"> | null>(null);

    // useEffect(() => {
    //     if (typeof document === "undefined") return;

    //     if (isMenuOpen) document.body.style.overflow = "hidden";
    //     else document.body.style.overflow = "auto";
    // }, [isMenuOpen]);
    useEffect(() => {
        if (isMenuOpen) {
            document.body.style.overflow = "hidden";
        } else {
            document.body.style.overflow = "auto";
        }

        // Cleanup on unmount
        return () => {
            document.body.style.overflow = "auto";
        };
    }, [isMenuOpen]);

    const { data: user } = trpc.general.users.currentUser.useQuery();

    const userPermissions = useMemo(() => {
        if (!user)
            return {
                sitePermissions: 0,
                brandPermissions: 0,
            };
        return getUserPermissions(user.roles);
    }, [user]);

    const isSiteAuthorized = useMemo(
        () =>
            hasPermission(userPermissions.sitePermissions, [
                BitFieldSitePermission.VIEW_PROTECTED_PAGES,
            ]),
        [userPermissions.sitePermissions]
    );

    const isBrandAuthorized = useMemo(() => !!user?.brand, [user]);

    const isAuthorized = isSiteAuthorized || isBrandAuthorized;

    const { signOut } = useAuth();

    const { mutate: handleLogout, isPending: isLoggingOut } = useMutation({
        onMutate: () => {
            const toastId = toast.loading("Logging out...");
            return { toastId };
        },
        mutationFn: () => signOut(),
        onSuccess: (_, __, { toastId }) => {
            toast.success("See you soon!", { id: toastId });
            setIsMenuOpen(false);
            router.refresh();
            router.push("/auth/signin");
        },
        onError: (err, _, ctx) => {
            return isClerkAPIResponseError(err)
                ? toast.error(err.errors.map((e) => e.message).join(", "), {
                      id: ctx?.toastId,
                  })
                : handleClientError(err, ctx?.toastId);
        },
    });

    // Additional Data hooks
    const { data: userCart } = trpc.general.users.cart.getCartForUser.useQuery(
        { userId: user?.id ?? "" },
        { enabled: !!user?.id }
    );
    const { data: wishlist } = trpc.general.users.wishlist.getWishlist.useQuery(
        { userId: user?.id ?? "" },
        { enabled: !!user?.id }
    );
    const { data: orders } = trpc.general.orders.getOrdersByUserId.useQuery(
        { userId: user?.id ?? "" },
        { enabled: !!user?.id }
    );

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

    const wishlistCount = wishlist?.length || 0;
    const ordersCount = orders?.length || 0;

    const MobileNavItem = ({
        icon: Icon,
        label,
        href,
    }: {
        icon: React.ElementType;
        label: string;
        href: string;
    }) => (
        <Link
            href={href}
            onClick={() => setIsMenuOpen(false)}
            className="flex items-center justify-between border-b border-gray-100 py-4 last:border-0 hover:bg-gray-50/50"
        >
            <div className="flex items-center gap-3">
                <Icon className="size-5 text-blue-400" />
                <span className="text-sm font-medium text-gray-700">
                    {label}
                </span>
            </div>
            <ChevronRight className="size-4 text-gray-300" />
        </Link>
    );

    return (
        <div
            aria-label="Mobile Menu"
            data-menu-open={isMenuOpen}
            className={cn(
                "fixed inset-x-0 z-40",
                "overflow-hidden",
                "transition-all duration-500 ease-in-out",
                "h-0 data-[menu-open=true]:h-screen",
                "-top-1/2 bottom-0 data-[menu-open=true]:top-0",
                "bg-[#f8f7f4] md:hidden",
                "flex flex-col justify-between gap-4",
                className
            )}
            ref={navContainerRef}
            {...props}
        >
            <div
                className="space-y-6 overflow-y-scroll px-4 pb-10 pt-24"
                style={{ scrollbarWidth: "none" }}
            >
                {user ? (
                    // LOGGED IN VIEW (Profile Dashboard Design)
                    <div className="space-y-8">
                        {/* Header */}
                        <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-gray-200">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-4">
                                    <div className="flex size-12 items-center justify-center rounded-full bg-[#E8DCC6] text-xl font-bold text-gray-800">
                                        {user?.firstName?.[0]?.toUpperCase() ||
                                            "U"}
                                    </div>
                                    <div>
                                        <h2 className="font-serif text-lg font-bold text-gray-900">
                                            {user?.firstName} {user?.lastName}
                                        </h2>
                                        <p className="text-xs text-gray-500">
                                            {hideEmail(user?.email)}
                                        </p>
                                    </div>
                                </div>
                                <div className="flex flex-col items-end gap-2">
                                    <button
                                        className="text-gray-400 hover:text-gray-900"
                                        disabled={isLoggingOut}
                                        onClick={() => handleLogout()}
                                    >
                                        <LogOut className="size-5" />
                                    </button>
                                    <Link
                                        href="/personal-details"
                                        onClick={() => setIsMenuOpen(false)}
                                        className="text-[10px] font-medium text-blue-400 hover:underline"
                                    >
                                        Edit Profile
                                    </Link>
                                </div>
                            </div>
                        </div>

                        {/* Summary Cards Grid */}
                        <div className="grid grid-cols-2 gap-4">
                            {!isAuthorized ? (
                                <>
                                    <SummaryCard
                                        icon={Heart}
                                        title="Wishlist"
                                        count={wishlistCount}
                                        subtitle="Avg. Earth Score: 82"
                                        href="/profile/wishlist"
                                    />
                                    <SummaryCard
                                        icon={Package}
                                        title="Orders"
                                        count={ordersCount}
                                        subtitle={
                                            ordersCount > 0
                                                ? "View your orders"
                                                : "No active orders"
                                        }
                                        href="/orders"
                                        className="bg-white"
                                    />
                                    <SummaryCard
                                        icon={ShoppingBag}
                                        title="Shopping Bag"
                                        count={cartCount}
                                        subtitle="Will save 0.8kg CO₂"
                                        href="/cart"
                                    />
                                </>
                            ) : (
                                <SummaryCard
                                    icon={LayoutDashboard}
                                    title="Dashboard"
                                    count="View Dashboard"
                                    href="/dashboard"
                                    customCount={true}
                                />
                            )}
                            <SummaryCard
                                icon={LineChart}
                                title="about us"
                                count="read our story"
                                href="/about"
                                customCount={true}
                            />
                        </div>

                        {/* Preferences Section */}
                        <div>
                            <h2 className="mb-4 font-serif text-lg font-bold text-gray-700">
                                Your Preferences
                            </h2>
                            <div className="space-y-4">
                                <PreferenceCard
                                    icon={Shirt}
                                    title="Complete Your Style Profile"
                                    description="Help us personalize your experience"
                                    progress={40}
                                    action={
                                        <button className="whitespace-nowrap rounded-lg border border-blue-200 px-3 py-1.5 text-xs font-medium text-blue-600 transition-colors hover:bg-blue-50">
                                            Continue
                                        </button>
                                    }
                                />
                                <PreferenceCard
                                    icon={Ruler}
                                    title="Saved Sizes: S (Tops), M (Bottoms)"
                                    description="Update preferences"
                                    action={null}
                                />
                                <PreferenceCard
                                    icon={Scissors}
                                    title="Preferred Materials"
                                    description="Organic Cotton, Linen, Hemp"
                                    action={null}
                                />
                                <div className="-mt-2 ml-[80px]">
                                    <p className="flex items-center text-xs font-medium text-blue-400">
                                        <span className="mr-1 text-blue-500">
                                            ✓
                                        </span>{" "}
                                        Your choices save 40% more water
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Mobile Account Navigation */}
                        <div className="space-y-6">
                            <div>
                                <h3 className="mb-3 font-serif text-lg font-bold text-gray-700">
                                    Your Account
                                </h3>
                                <div className="overflow-hidden rounded-2xl bg-white px-4 shadow-sm ring-1 ring-gray-200">
                                    <MobileNavItem
                                        icon={User}
                                        label="Personal Details"
                                        href="/personal-details"
                                    />
                                    <MobileNavItem
                                        icon={Lock}
                                        label="Security & Privacy"
                                        href="/security"
                                    />
                                    <MobileNavItem
                                        icon={MapPin}
                                        label="Addresses"
                                        href="/addresses"
                                    />
                                </div>
                            </div>

                            <div>
                                <h3 className="mb-3 font-serif text-lg font-bold text-gray-700">
                                    Support
                                </h3>
                                <div className="overflow-hidden rounded-2xl bg-white px-4 shadow-sm ring-1 ring-gray-200">
                                    <MobileNavItem
                                        icon={HelpCircle}
                                        label="Help Center"
                                        href="#"
                                    />
                                    <MobileNavItem
                                        icon={MessageCircle}
                                        label="FAQs"
                                        href="#"
                                    />
                                    <MobileNavItem
                                        icon={Headphones}
                                        label="Contact Us"
                                        href="/contact"
                                    />
                                </div>
                            </div>

                            <div>
                                <h3 className="mb-3 font-serif text-lg font-bold text-gray-700">
                                    Legal
                                </h3>
                                <div className="overflow-hidden rounded-2xl bg-white px-4 shadow-sm ring-1 ring-gray-200">
                                    <MobileNavItem
                                        icon={FileText}
                                        label="Privacy Policy"
                                        href="#"
                                    />
                                    <MobileNavItem
                                        icon={ShieldAlert}
                                        label="Terms of Service"
                                        href="#"
                                    />
                                </div>
                            </div>

                            <button
                                onClick={() => handleLogout()}
                                className="w-full pb-10 text-center text-sm font-medium text-gray-500 hover:text-gray-900"
                            >
                                log out
                            </button>
                        </div>
                    </div>
                ) : (
                    // NOT LOGGED IN VIEW (Keep existing Grid/List for guests)
                    <div className={cn("space-y-6", "mt-5")}>
                        <ul
                            className={cn(
                                "grid grid-cols-2 items-center gap-4"
                            )}
                            ref={navListRef}
                        >
                            {boxMenu.map((item, index) => {
                                const Icon = Icons[item.icon];

                                return (
                                    <li
                                        key={index}
                                        className="rounded-xl bg-white shadow-sm ring-1 ring-gray-200"
                                        aria-label="Box Menu Item"
                                    >
                                        <Link
                                            href={item.href}
                                            className="flex items-center justify-between gap-1 p-4"
                                            target={
                                                item.isExternal
                                                    ? "_blank"
                                                    : "_self"
                                            }
                                            onClick={() => setIsMenuOpen(false)}
                                        >
                                            <div className="flex items-center gap-3">
                                                <Icon className="size-5 text-gray-500" />
                                                <span className="text-sm font-medium text-gray-900">
                                                    {item.name}
                                                </span>
                                            </div>

                                            <div>
                                                <Icons.ChevronRight className="size-4 text-gray-300" />
                                            </div>
                                        </Link>
                                    </li>
                                );
                            })}
                        </ul>

                        {/* Guest List */}
                        <div>
                            <div className="overflow-hidden rounded-2xl bg-white px-2 shadow-sm ring-1 ring-gray-200">
                                <ul className="divide-y divide-gray-100">
                                    {extraMenu.map((item, index) => {
                                        const Icon =
                                            Icons[
                                                item.icon as keyof typeof Icons
                                            ] || Icons.Circle;

                                        return (
                                            <li
                                                key={index}
                                                aria-label="Extra Menu Item"
                                            >
                                                <Link
                                                    href={item.href}
                                                    className="flex items-center justify-between gap-2 px-4 py-4 hover:bg-gray-50"
                                                    target={
                                                        item.isExternal
                                                            ? "_blank"
                                                            : "_self"
                                                    }
                                                    onClick={() =>
                                                        setIsMenuOpen(false)
                                                    }
                                                >
                                                    <div className="flex items-center gap-4">
                                                        <Icon className="size-5 text-blue-400" />
                                                        <div>
                                                            <p className="text-sm font-semibold text-gray-900">
                                                                {item.name}
                                                            </p>
                                                            <p className="text-xs text-gray-500">
                                                                {
                                                                    item.description
                                                                }
                                                            </p>
                                                        </div>
                                                    </div>
                                                    <div>
                                                        <Icons.ChevronRight className="size-4 text-gray-300" />
                                                    </div>
                                                </Link>
                                            </li>
                                        );
                                    })}
                                </ul>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
