"use client";

import { trpc } from "@/lib/trpc/client";
import { cn } from "@/lib/utils";
import {
    ArrowRight,
    ChevronRight,
    FileText,
    Headphones,
    Heart,
    HelpCircle,
    LineChart,
    Lock,
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
import React from "react";

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

export default function OverviewPage() {
    const { data: user } = trpc.general.users.currentUser.useQuery();
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

    // Helper for mobile list items
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
        <div className="w-full space-y-8 pb-10">
            {/* Mobile Header (User Info) */}
            <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-gray-200 md:hidden">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <div className="flex size-12 items-center justify-center rounded-full bg-[#E8DCC6] text-xl font-bold text-gray-800">
                            {user?.firstName?.[0]?.toUpperCase() || "U"}
                        </div>
                        <div>
                            <h2 className="font-serif text-lg font-bold text-gray-900">
                                {user?.firstName} {user?.lastName}
                            </h2>
                            <p className="text-xs text-gray-500">
                                {user?.email}
                            </p>
                        </div>
                    </div>
                    <Link
                        href="/personal-details"
                        className="text-xs font-medium text-blue-400 hover:underline"
                    >
                        Edit Profile
                    </Link>
                </div>
            </div>

            {/* Desktop Header */}
            <div className="hidden md:block">
                <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
                <p className="text-gray-500">Welcome back, {user?.firstName}</p>
            </div>

            {/* Summary Cards Grid */}
            <div className="grid grid-cols-2 gap-4 md:grid-cols-3 md:gap-6">
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
                    // subtitle="1 in transit" // Dynamic if possible, or static as placeholder
                    subtitle={
                        ordersCount > 0
                            ? "View your orders"
                            : "No active orders"
                    }
                    href="/orders"
                    className="bg-white"
                >
                    {/* Example of adding badge like in design if needed, checking logic first */}
                    {/* {ordersCount > 0 && <span className="mt-2 inline-block rounded-full bg-[#C89F93] px-2 py-0.5 text-[10px] font-bold text-white">1 in transit</span>} */}
                </SummaryCard>
                <SummaryCard
                    icon={ShoppingBag}
                    title="Shopping Bag"
                    count={cartCount}
                    subtitle="Will save 0.8kg CO₂"
                    href="/cart"
                />
                <SummaryCard
                    icon={LineChart} // Using LineChart as a proxy for "About Us" graph icon
                    title="about us"
                    count="read our story"
                    href="/about"
                    className="md:hidden" // Only show on mobile grid as per design? Or both? Design shows 4 items.
                    // Overriding count display for text
                    customCount={true}
                />
            </div>

            {/* Preferences Section */}
            <div>
                <h2 className="mb-4 font-serif text-lg font-bold text-gray-700 md:mb-6 md:text-xl md:text-gray-900">
                    Your Preferences
                </h2>
                <div className="space-y-4">
                    <PreferenceCard
                        icon={Shirt}
                        title="Complete Your Style Profile"
                        description="Help us personalize your experience"
                        progress={40}
                        action={
                            <button className="whitespace-nowrap rounded-lg border border-blue-200 px-3 py-1.5 text-xs font-medium text-blue-600 transition-colors hover:bg-blue-50 md:border-blue-600 md:px-4 md:py-2 md:text-sm">
                                Continue
                            </button>
                        }
                    />
                    <PreferenceCard
                        icon={Ruler}
                        title="Saved Sizes: S (Tops), M (Bottoms)"
                        description="Update preferences"
                        action={null} // Design shows text description as title/subtitle combo, simplified here
                        // Re-aligning to match design: "Saved Sizes..." as title, "Update preferences" as subtitle link?
                    />
                    <PreferenceCard
                        icon={Scissors}
                        title="Preferred Materials"
                        description="Organic Cotton, Linen, Hemp"
                        action={null}
                    />
                    <div className="-mt-2 ml-[80px]">
                        <p className="flex items-center text-xs font-medium text-blue-400">
                            <span className="mr-1 text-blue-500">✓</span> Your
                            choices save 40% more water
                        </p>
                    </div>
                </div>
            </div>

            {/* Mobile Account Navigation */}
            <div className="space-y-6 md:hidden">
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

                <button className="w-full text-center text-sm font-medium text-gray-500 hover:text-gray-900">
                    log out
                </button>
            </div>
        </div>
    );
}
