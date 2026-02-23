"use client";

import {
    Footer,
    GeneralShell,
    NavbarHome,
    NavbarMob,
} from "@/components/globals/layouts";
import { Icons } from "@/components/icons";
import { Button } from "@/components/ui/button-general";
import { Separator } from "@/components/ui/separator";
import { convertPaiseToRupees, formatPriceTag } from "@/lib/utils";
import {
    Leaf,
    Minus,
    Plus,
    Recycle,
    RotateCcw,
    ShoppingBag,
    Trash2,
    Truck,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import CheckoutStepper from "./checkout-stepper";

export default function GuestCartPage() {
    const router = useRouter();
    const [guestCart, setGuestCart] = useState<any[]>([]);

    useEffect(() => {
        const cart = JSON.parse(localStorage.getItem("guest_cart") || "[]");
        setGuestCart(cart);
    }, []);

    const persistCart = useCallback((updated: any[]) => {
        setGuestCart(updated);
        localStorage.setItem("guest_cart", JSON.stringify(updated));
        window.dispatchEvent(new Event("guestCartUpdated"));
    }, []);

    const updateQuantity = useCallback(
        (index: number, delta: number) => {
            const updated = [...guestCart];
            const newQty = updated[index].quantity + delta;
            if (newQty < 1) return;
            updated[index] = { ...updated[index], quantity: newQty };
            persistCart(updated);
        },
        [guestCart, persistCart]
    );

    const removeItem = useCallback(
        (index: number) => {
            const updated = guestCart.filter((_, i) => i !== index);
            persistCart(updated);
        },
        [guestCart, persistCart]
    );

    const itemsCount = useMemo(
        () =>
            guestCart.reduce(
                (acc: number, item: any) => acc + item.quantity,
                0
            ),
        [guestCart]
    );

    const totalPrice = useMemo(
        () =>
            guestCart.reduce(
                (acc: number, item: any) =>
                    acc + (item.price ?? 0) * item.quantity,
                0
            ),
        [guestCart]
    );

    const fmtPrice = (paise: number) =>
        formatPriceTag(+convertPaiseToRupees(paise), true);

    return (
        <div className="relative flex min-h-screen flex-col">
            <NavbarHome />

            <main className="flex flex-1 flex-col">
                <GeneralShell>
                    <CheckoutStepper currentStep={0} />

                    <div className="container mx-auto px-4 py-4">
                        <div className="flex flex-col gap-6 lg:flex-row">
                            {/* ==================== LEFT — BAG ==================== */}
                            <div className="w-full lg:w-2/3">
                                {/* Item count header */}
                                <div className="mb-4 flex items-center justify-between">
                                    <h2 className="text-base font-semibold text-gray-900">
                                        {itemsCount}{" "}
                                        {itemsCount === 1
                                            ? "Thoughtful Choice"
                                            : "Thoughtful Choices"}
                                    </h2>
                                </div>

                                {guestCart.length === 0 ? (
                                    <div className="flex flex-col items-center justify-center rounded-xl border border-gray-200 bg-white py-16 text-center">
                                        <ShoppingBag className="mb-4 size-12 text-gray-300" />
                                        <p className="text-base font-medium text-gray-500">
                                            Your bag is empty.
                                        </p>
                                        <p className="mt-1 text-sm text-gray-400">
                                            Add items to start shopping!
                                        </p>
                                        <Button
                                            className="mt-4"
                                            size="sm"
                                            onClick={() => router.push("/shop")}
                                        >
                                            Continue Shopping
                                        </Button>
                                    </div>
                                ) : (
                                    <div className="space-y-3">
                                        {guestCart.map((item, idx) => (
                                            <GuestCartCard
                                                key={idx}
                                                item={item}
                                                index={idx}
                                                onUpdateQuantity={
                                                    updateQuantity
                                                }
                                                onRemove={removeItem}
                                            />
                                        ))}
                                    </div>
                                )}
                            </div>

                            {/* ==================== RIGHT — SIDEBAR ==================== */}
                            <div className="w-full lg:w-1/3">
                                <div className="sticky top-4 space-y-4">
                                    {/* Complimentary delivery banner */}
                                    <div className="flex items-center gap-2 rounded-xl bg-[#e8f5e9] p-3">
                                        <Truck className="size-5 shrink-0 text-green-700" />
                                        <p className="text-sm font-medium text-green-800">
                                            Your order is eligible for
                                            complimentary delivery!
                                        </p>
                                    </div>

                                    {/* Order Summary card */}
                                    <div className="rounded-xl border border-gray-200 bg-white p-5">
                                        <h2 className="text-lg font-semibold text-gray-900">
                                            Order Summary
                                        </h2>

                                        <div className="mt-1 space-y-0.5 text-xs text-gray-500">
                                            <p className="flex items-center gap-1">
                                                <Leaf className="size-3 text-green-500" />
                                                Carbon neutral delivery included
                                            </p>
                                        </div>

                                        <Separator className="my-3" />

                                        {/* Line items */}
                                        <div className="space-y-2 text-sm">
                                            <div className="flex justify-between">
                                                <span className="text-gray-600">
                                                    Items
                                                </span>
                                                <span className="font-medium text-gray-900">
                                                    {fmtPrice(totalPrice)}
                                                </span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="text-gray-600">
                                                    Discount
                                                </span>
                                                <span className="text-gray-900">
                                                    ₹0.00
                                                </span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="text-gray-600">
                                                    Delivery
                                                </span>
                                                <span className="font-medium text-green-600">
                                                    ₹0.00 (Free)
                                                </span>
                                            </div>
                                        </div>

                                        {/* Your Impact */}
                                        <div className="mt-4 rounded-lg border border-green-200 bg-green-50/50 p-3">
                                            <p className="mb-1.5 text-xs font-semibold text-green-800">
                                                Your Impact
                                            </p>
                                            <div className="space-y-1 text-[11px] text-green-700">
                                                <p className="flex items-center gap-1.5">
                                                    <Leaf className="size-3" />
                                                    1.6kg CO₂ saved
                                                </p>
                                                <p className="flex items-center gap-1.5">
                                                    <Recycle className="size-3" />
                                                    8% materials reused
                                                </p>
                                                <p className="flex items-center gap-1.5">
                                                    <Icons.User className="size-3" />
                                                    2 artisans supported
                                                </p>
                                            </div>
                                        </div>

                                        <Separator className="my-3" />

                                        {/* Total */}
                                        <div className="flex justify-between text-base font-bold text-gray-900">
                                            <span>Total</span>
                                            <span>{fmtPrice(totalPrice)}</span>
                                        </div>

                                        {/* Apply Coupons */}
                                        <div className="mt-4 flex items-center justify-between rounded-lg border border-gray-200 px-3 py-2">
                                            <div className="flex items-center gap-2">
                                                <Icons.Tag className="size-4 text-gray-500" />
                                                <span className="text-sm text-gray-600">
                                                    Apply Coupons
                                                </span>
                                            </div>
                                            <button
                                                disabled
                                                className="cursor-not-allowed rounded border border-gray-300 px-3 py-0.5 text-xs font-semibold text-gray-400"
                                            >
                                                APPLY
                                            </button>
                                        </div>

                                        {/* Login CTA */}
                                        <button
                                            className="mt-4 w-full rounded-xl bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900 px-6 py-3 text-sm font-semibold tracking-wide text-white shadow-lg transition-all duration-300 hover:scale-[1.02] hover:shadow-xl active:scale-[0.98]"
                                            onClick={() =>
                                                router.push(
                                                    "/auth/signin?redirect_url=/mycart"
                                                )
                                            }
                                        >
                                            Login to Checkout
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </GeneralShell>
            </main>

            <Footer />
            <NavbarMob />
        </div>
    );
}

/* --------------------------------------------------------
   GUEST CART CARD — matches logged-in ProductCartCard style
-------------------------------------------------------- */

function GuestCartCard({
    item,
    index,
    onUpdateQuantity,
    onRemove,
}: {
    item: any;
    index: number;
    onUpdateQuantity: (index: number, delta: number) => void;
    onRemove: (index: number) => void;
}) {
    const imageUrl =
        item.fullProduct?.media?.[0]?.mediaItem?.url ??
        item.image ??
        "https://4o4vm2cu6g.ufs.sh/f/HtysHtJpctzNNQhfcW4g0rgXZuWwadPABUqnljV5RbJMFsx1";

    const unitPrice = item.price ?? 0;
    const priceRupees = parseFloat(convertPaiseToRupees(unitPrice));
    const estimatedWears = 180;
    const pricePerWear = (priceRupees / estimatedWears).toFixed(2);
    const slug = item.fullProduct?.slug ?? item.slug;

    return (
        <div className="rounded-xl border border-gray-200 bg-white p-4 transition-shadow hover:shadow-sm">
            <div className="flex gap-4">
                {/* ✅ Checkbox placeholder (visual only — guest can't select) */}
                <div className="mt-1 flex size-5 shrink-0 items-center justify-center rounded border border-green-400 bg-green-500 text-white">
                    <Icons.Check className="size-3" />
                </div>

                {/* Image */}
                <div className="relative aspect-[4/5] w-[90px] shrink-0 overflow-hidden rounded-lg bg-gray-50 md:w-28">
                    {slug ? (
                        <Link href={`/products/${slug}`}>
                            <Image
                                src={imageUrl}
                                alt={item.title || "Product"}
                                fill
                                className="object-cover"
                                sizes="(max-width: 768px) 90px, 112px"
                            />
                        </Link>
                    ) : (
                        <Image
                            src={imageUrl}
                            alt={item.title || "Product"}
                            fill
                            className="object-cover"
                            sizes="(max-width: 768px) 90px, 112px"
                        />
                    )}
                </div>

                {/* Product Info */}
                <div className="flex flex-1 flex-col justify-between">
                    <div className="space-y-1">
                        {/* Title */}
                        <h3 className="text-sm font-semibold leading-tight text-gray-900 md:text-base">
                            {slug ? (
                                <Link
                                    href={`/products/${slug}`}
                                    className="hover:underline"
                                >
                                    {item.title}
                                </Link>
                            ) : (
                                item.title
                            )}
                        </h3>

                        {/* Brand */}
                        {item.brand && (
                            <p className="text-xs text-gray-500">
                                By {item.brand}
                            </p>
                        )}

                        {/* Price */}
                        <div className="text-sm font-bold text-gray-900 md:text-lg">
                            {formatPriceTag(priceRupees, true)}
                        </div>

                        {/* Sustainability badges */}
                        <div className="flex flex-wrap gap-1.5">
                            <div className="flex items-center gap-1 rounded-full bg-green-50 px-2 py-0.5">
                                <Leaf className="size-3 text-green-600" />
                                <span className="text-[10px] font-medium text-green-700">
                                    0.8kg CO₂
                                </span>
                            </div>
                            <div className="flex items-center gap-1 rounded-full bg-blue-50 px-2 py-0.5">
                                <Recycle className="size-3 text-blue-600" />
                                <span className="text-[10px] font-medium text-blue-700">
                                    8% reused
                                </span>
                            </div>
                            <div className="flex items-center gap-1 rounded-full bg-orange-50 px-2 py-0.5">
                                <Icons.User className="size-3 text-orange-600" />
                                <span className="text-[10px] font-medium text-orange-700">
                                    1 artisan
                                </span>
                            </div>
                        </div>

                        {/* Price per wear */}
                        <p className="text-xs text-gray-500">
                            Estimated{" "}
                            {formatPriceTag(parseFloat(pricePerWear), true)} per
                            wear ({estimatedWears} wears)
                        </p>
                    </div>

                    {/* Bottom badges — mobile */}
                    <div className="mt-2 flex flex-wrap items-center gap-2 md:hidden">
                        <div className="flex items-center gap-1 text-[11px] text-gray-500">
                            <Truck className="size-3 text-green-500" />
                            <span>Free carbon-neutral shipping</span>
                        </div>
                        <div className="inline-flex items-center gap-1 rounded-full border border-[#c5d1b8] bg-[#f0f4eb] px-2 py-0.5 text-[10px] font-medium text-[#6B7A5E]">
                            <RotateCcw className="size-3" />
                            7-day returns available
                        </div>
                    </div>
                </div>

                {/* Right side — Quantity + Remove + Badges */}
                <div className="hidden flex-col items-end justify-between md:flex">
                    {/* Quantity controls */}
                    <div className="flex items-center gap-1.5">
                        <button
                            onClick={() => onUpdateQuantity(index, -1)}
                            disabled={item.quantity <= 1}
                            className="flex size-7 items-center justify-center rounded-full border border-green-300 text-green-600 transition-colors hover:bg-green-50 disabled:cursor-not-allowed disabled:opacity-40"
                        >
                            <Minus className="size-3" />
                        </button>
                        <span className="w-6 text-center text-sm font-medium">
                            {item.quantity}
                        </span>
                        <button
                            onClick={() => onUpdateQuantity(index, 1)}
                            className="flex size-7 items-center justify-center rounded-full border border-green-300 bg-green-50 text-green-600 transition-colors hover:bg-green-100"
                        >
                            <Plus className="size-3" />
                        </button>
                    </div>

                    {/* Remove */}
                    <button
                        onClick={() => onRemove(index)}
                        className="mt-2 text-xs font-medium text-red-500 transition-colors hover:text-red-600 hover:underline"
                    >
                        Remove
                    </button>

                    {/* Badges */}
                    <div className="mt-2 flex flex-col gap-1">
                        <div className="flex items-center gap-1 text-[11px] text-gray-500">
                            <Truck className="size-3" />
                            <span>Free carbon-neutral shipping</span>
                        </div>
                        <div className="inline-flex items-center gap-1 rounded-full border border-[#c5d1b8] bg-[#f0f4eb] px-2 py-0.5 text-[10px] font-medium text-[#6B7A5E]">
                            <RotateCcw className="size-3" />
                            7-day returns available
                        </div>
                    </div>
                </div>
            </div>

            {/* Mobile bottom — quantity + remove */}
            <div className="mt-3 flex items-center justify-between border-t border-gray-100 pt-3 md:hidden">
                <div className="flex items-center gap-2">
                    <button
                        onClick={() => onUpdateQuantity(index, -1)}
                        disabled={item.quantity <= 1}
                        className="flex size-7 items-center justify-center rounded border border-green-300 text-green-600 transition-colors hover:bg-green-50 disabled:cursor-not-allowed disabled:opacity-40"
                    >
                        <Minus className="size-3" />
                    </button>
                    <span className="w-5 text-center text-sm font-medium">
                        {item.quantity}
                    </span>
                    <button
                        onClick={() => onUpdateQuantity(index, 1)}
                        className="flex size-7 items-center justify-center rounded border border-green-300 bg-green-50 text-green-600 transition-colors hover:bg-green-100"
                    >
                        <Plus className="size-3" />
                    </button>
                </div>

                <button
                    onClick={() => onRemove(index)}
                    className="text-[11px] font-medium text-red-500 transition-colors hover:text-red-600 hover:underline"
                >
                    Remove
                </button>
            </div>
        </div>
    );
}
