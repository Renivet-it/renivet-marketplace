"use client";

import { trpc } from "@/lib/trpc/client";
import { cn } from "@/lib/utils";
import {
    ArrowRight,
    Heart,
    Package,
    Ruler,
    Scissors,
    Shirt,
    ShoppingBag,
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
}: {
    icon: React.ElementType;
    title: string;
    count: string | number;
    subtitle?: string;
    href: string;
    className?: string;
}) {
    return (
        <Link
            href={href}
            className={cn(
                "group relative flex flex-col justify-between rounded-2xl bg-white p-6 shadow-sm ring-1 ring-gray-200 transition-all hover:shadow-md",
                className
            )}
        >
            <div className="flex items-start justify-between">
                <div className="rounded-lg bg-blue-50 p-2 text-blue-600">
                    <Icon className="size-6" />
                </div>
            </div>

            <div className="mt-4">
                <h3 className="font-medium text-gray-500">{title}</h3>
                <p className="mt-1 text-2xl font-bold text-gray-900">
                    {count} items
                </p>
                {subtitle && (
                    <p className="mt-2 text-xs font-medium text-blue-600">
                        {subtitle}
                    </p>
                )}
            </div>

            <div className="absolute bottom-6 right-6 text-gray-300 transition-colors group-hover:text-blue-600">
                <ArrowRight className="size-5" />
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

    return (
        <div className="w-full space-y-8">
            {/* Header */}
            <div>
                <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
                <p className="text-gray-500">Welcome back, {user?.firstName}</p>
            </div>

            {/* Summary Cards */}
            <div className="grid gap-6 md:grid-cols-3">
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
                    subtitle="89 total wears logged"
                    href="/orders"
                    className="bg-white" // Override if needed
                />
                <div className="relative">
                    <SummaryCard
                        icon={ShoppingBag}
                        title="Shopping Bag"
                        count={cartCount}
                        subtitle="Will save 0.8kg CO₂"
                        href="/cart"
                    />
                    {/* Add price if desired, or keep simple matching design */}
                    {/* <p className="absolute right-6 top-6 text-sm font-semibold text-gray-900">
                        {formatPriceTag(cartTotal / 100)}
                     </p> */}
                </div>
            </div>

            {/* Preferences Section */}
            <div>
                <h2 className="mb-6 font-serif text-xl font-bold text-gray-900">
                    Your Preferences
                </h2>
                <div className="space-y-4">
                    <PreferenceCard
                        icon={Shirt}
                        title="Complete Your Style Profile"
                        description="Help us personalize your experience"
                        progress={40}
                        action={
                            <button className="rounded-lg border border-blue-600 px-4 py-2 text-sm font-medium text-blue-600 transition-colors hover:bg-blue-50">
                                Continue
                            </button>
                        }
                    />
                    <PreferenceCard
                        icon={Ruler}
                        title="Saved Sizes"
                        description="S (Tops), M (Bottoms)"
                        action={
                            <button className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-600 transition-colors hover:bg-gray-50 hover:text-gray-900">
                                Update
                            </button>
                        }
                    />
                    <PreferenceCard
                        icon={Scissors}
                        title="Preferred Materials"
                        description="Organic Cotton, Linen, Hemp"
                        action={
                            <div className="text-right">
                                {/* Placeholder for design checking */}
                            </div>
                        }
                    />
                    {/* Custom footer in card for Materials to match design text */}
                    <div className="-mt-4 ml-[80px]">
                        <p className="text-xs font-medium text-blue-500">
                            ✓ Your choices save 40% more water
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
