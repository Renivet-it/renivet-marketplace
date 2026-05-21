"use client";

import { cn } from "@/lib/utils";
import { useAuth } from "@clerk/nextjs";
import { trpc } from "@/lib/trpc/client";
import { Heart, Home, Search, ShoppingBag, Store } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

type CartItem = {
    quantity: number;
};

function useGuestCartCount() {
    const [count, setCount] = useState(0);

    useEffect(() => {
        const sync = () => {
            try {
                const guestCart = JSON.parse(
                    localStorage.getItem("guest_cart") || "[]"
                ) as CartItem[];
                setCount(guestCart.length);
            } catch {
                setCount(0);
            }
        };

        sync();
        window.addEventListener("guestCartUpdated", sync);
        window.addEventListener("storage", sync);
        return () => {
            window.removeEventListener("guestCartUpdated", sync);
            window.removeEventListener("storage", sync);
        };
    }, []);

    return count;
}

export function MobileBottomNav() {
    const pathname = usePathname();
    const { userId } = useAuth();
    const guestCartCount = useGuestCartCount();
    const { data: userCart } = trpc.general.users.cart.getCartForUser.useQuery(
        { userId: userId ?? "" },
        { enabled: !!userId }
    );
    const [isVisible, setIsVisible] = useState(true);

    useEffect(() => {
        let previousY = window.scrollY;

        const handleScroll = () => {
            const currentY = window.scrollY;
            if (!pathname.startsWith("/products/")) {
                setIsVisible(true);
                previousY = currentY;
                return;
            }

            const isScrollingDown = currentY > previousY;
            setIsVisible(!(isScrollingDown && currentY > 160));
            previousY = currentY;
        };

        handleScroll();
        window.addEventListener("scroll", handleScroll, { passive: true });
        return () => window.removeEventListener("scroll", handleScroll);
    }, [pathname]);

    if (
        pathname.startsWith("/auth") ||
        pathname.startsWith("/sign-in") ||
        pathname.startsWith("/sign-up")
    ) {
        return null;
    }

    const navItems = [
        { href: "/", icon: Home, label: "Home" },
        { href: "/shop", icon: Store, label: "Shop" },
        { href: "/shop", icon: Search, label: "Search" },
        {
            href: userId ? "/profile/wishlist" : "/guestWishlist",
            icon: Heart,
            label: "Wishlist",
        },
        {
            href: "/mycart",
            icon: ShoppingBag,
            label: "Bag",
            count: userId ? userCart?.length ?? 0 : guestCartCount,
        },
    ];

    return (
        <nav
            className={cn(
                "fixed inset-x-0 bottom-0 z-40 border-t border-[#eadfce] bg-white/95 pb-[max(env(safe-area-inset-bottom),0px)] shadow-[0_-8px_24px_rgba(57,48,33,0.08)] backdrop-blur-xl transition-transform duration-300 md:hidden",
                isVisible ? "translate-y-0" : "translate-y-full"
            )}
        >
            <div className="mx-auto w-full max-w-md px-2">
                <div className="grid h-[74px] grid-cols-5 gap-1">
                    {navItems.map((item) => {
                        const isActive =
                            item.label === "Search"
                                ? false
                                : item.label === "Home"
                                ? pathname === "/"
                                : pathname.startsWith(item.href);

                        return (
                            <Link
                                key={item.label}
                                href={item.href}
                                className={cn(
                                    "relative flex min-w-0 flex-col items-center justify-center gap-1 rounded-2xl px-1.5 py-2 text-[10px] font-semibold tracking-[0.08em] transition-all duration-200",
                                    isActive
                                        ? "bg-[linear-gradient(180deg,#31401f_0%,#263018_100%)] text-white shadow-[0_14px_26px_rgba(49,64,31,0.28)]"
                                        : "text-[#726a58]"
                                )}
                            >
                                <div
                                    className={cn(
                                        "relative flex size-11 items-center justify-center rounded-full border transition-all",
                                        isActive
                                            ? "border-white/15 bg-white/10"
                                            : "border-[#efe5d2] bg-white/60 text-[#5e584b]"
                                    )}
                                >
                                    <item.icon className="size-[20px]" />
                                    {item.label === "Bag" && item.count && item.count > 0 && (
                                        <span className="absolute -right-1 -top-1 flex h-5 min-w-[20px] items-center justify-center rounded-full border-2 border-[#fbf6ec] bg-[#ff5a52] px-1 text-[10px] font-bold text-white shadow-sm">
                                            {item.count}
                                        </span>
                                    )}
                                </div>
                                <span className="truncate leading-none">
                                    {item.label}
                                </span>
                            </Link>
                        );
                    })}
                </div>
            </div>
        </nav>
    );
}
