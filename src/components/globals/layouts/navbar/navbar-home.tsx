"use client";

import { Icons } from "@/components/icons";
import { RenivetFull } from "@/components/svgs";
import { Button } from "@/components/ui/button-general";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuGroup,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
    NavigationMenu,
    NavigationMenuContent,
    NavigationMenuItem,
    NavigationMenuLink,
    NavigationMenuList,
    NavigationMenuTrigger,
} from "@/components/ui/navigation-menu";
import { ProductSearch } from "@/components/ui/product-search";
import { BitFieldSitePermission } from "@/config/permissions";
import { POSTHOG_EVENTS } from "@/config/posthog";
import { useGuestWishlist } from "@/lib/hooks/useGuestWishlist";
import { useNavbarStore } from "@/lib/store";
import { trpc } from "@/lib/trpc/client";
import {
    cn,
    getUserPermissions,
    handleClientError,
    hasPermission,
    hideEmail,
    wait,
} from "@/lib/utils";
import { useAuth } from "@clerk/nextjs";
import { isClerkAPIResponseError } from "@clerk/nextjs/errors";
import { useMutation } from "@tanstack/react-query";
import {
    AnimatePresence,
    motion,
} from "motion/react";
import Link from "next/link";
import { usePostHog } from "posthog-js/react";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

function useGuestCart() {
    const [guestCart, setGuestCart] = useState<any[]>([]);

    // Load guest cart from localStorage
    useEffect(() => {
        const stored = localStorage.getItem("guest_cart");
        if (stored) setGuestCart(JSON.parse(stored));
    }, []);

    // 🔥 Listen for custom events to update cart
    useEffect(() => {
        const handleCartUpdate = () => {
            const stored = localStorage.getItem("guest_cart");
            setGuestCart(stored ? JSON.parse(stored) : []);
        };

        window.addEventListener("guestCartUpdated", handleCartUpdate);
        window.addEventListener("storage", handleCartUpdate);
        return () => {
            window.removeEventListener("guestCartUpdated", handleCartUpdate);
            window.removeEventListener("storage", handleCartUpdate);
        };
    }, []);

    const addToGuestCart = (item: any) => {
        setGuestCart((prev) => {
            const existing = prev.find(
                (x) =>
                    x.productId === item.productId &&
                    (x.variantId || null) === (item.variantId || null)
            );
            let updated;
            if (existing) {
                updated = prev.map((x) =>
                    x.productId === item.productId &&
                    (x.variantId || null) === (item.variantId || null)
                        ? { ...x, quantity: x.quantity + item.quantity }
                        : x
                );
            } else {
                updated = [...prev, item];
            }
            localStorage.setItem("guest_cart", JSON.stringify(updated));
            // 🔥 Dispatch event to notify other components
            window.dispatchEvent(new Event("guestCartUpdated"));
            return updated;
        });
    };

    const clearGuestCart = () => {
        localStorage.removeItem("guest_cart");
        setGuestCart([]);
        window.dispatchEvent(new Event("guestCartUpdated"));
    };

    return { guestCart, addToGuestCart, clearGuestCart };
}

function NavbarActionButton({
    children,
    href,
    className,
}: {
    children: React.ReactNode;
    href: string;
    className?: string;
}) {
    return (
        <Link
            href={href}
            className={cn(
                "relative flex size-10 items-center justify-center rounded-xl border border-transparent bg-transparent text-[#1f2937] transition-all duration-200 hover:border hover:bg-[#f3f4f6] hover:text-[#111827]",
                className
            )}
        >
            {children}
        </Link>
    );
}
export function NavbarHome({
    customLogo,
}: { customLogo?: React.ReactNode } = {}) {
    const [isMenuHidden] = useState(false);

    const isMenuOpen = useNavbarStore((state) => state.isOpen);
    const setIsMenuOpen = useNavbarStore((state) => state.setIsOpen);
    const { guestCart } = useGuestCart();
    const { guestWishlist } = useGuestWishlist();
    // useMotionValueEvent(scrollY, "change", (latest) => {
    //     const previous = scrollY.getPrevious() ?? 0;

    //     if (latest > previous && latest > 150) setIsMenuHidden(true);
    //     else setIsMenuHidden(false);
    // });

    type FlyingItem = {
        id: string;
        imageSrc: string;
        startRect: { left: number; top: number; width: number; height: number };
        endRect: { left: number; top: number; width: number; height: number };
    };

    const [isCartBumping, setIsCartBumping] = useState(false);
    const [flyingItems, setFlyingItems] = useState<FlyingItem[]>([]);

    useEffect(() => {
        const handleCartFly = (e: any) => {
            const detail: FlyingItem = e.detail;
            setFlyingItems((prev) => [...prev, detail]);
        };
        window.addEventListener("trigger-cart-fly", handleCartFly);
        return () =>
            window.removeEventListener("trigger-cart-fly", handleCartFly);
    }, []);

    const handleAnimationComplete = (id: string) => {
        setFlyingItems((prev) => prev.filter((item) => item.id !== id));
        setIsCartBumping(true);
        setTimeout(() => setIsCartBumping(false), 300);
    };

    const { isSignedIn } = useAuth();

    const { data: user, isPending: isUserFetching } =
        trpc.general.users.currentUser.useQuery(undefined, {
            enabled: !!isSignedIn,
        });

    const [
        { data: categories, isPending: isCategoriesFetching },
        { data: subcategories, isPending: isSubcategoriesFetching },
        { data: productTypes, isPending: isProductTypesFetching },
    ] = trpc.useQueries((t) => [
        t.general.categories.getCategories(),
        t.general.subCategories.getSubCategories(),
        t.general.productTypes.getProductTypes(),
    ]);

    const isCategoriesLoading =
        isCategoriesFetching ||
        isSubcategoriesFetching ||
        isProductTypesFetching;

    const { data: userWishlist } =
        trpc.general.users.wishlist.getWishlist.useQuery(
            // eslint-disable-next-line @typescript-eslint/no-non-null-asserted-optional-chain
            { userId: user?.id! },
            { enabled: user !== undefined && !isUserFetching }
        );

    const { data: userCart } = trpc.general.users.cart.getCartForUser.useQuery(
        // eslint-disable-next-line @typescript-eslint/no-non-null-asserted-optional-chain
        { userId: user?.id! },
        { enabled: user !== undefined && !isUserFetching }
    );

    const availableCart = userCart?.filter(
        (c) =>
            c.product.isPublished &&
            c.product.verificationStatus === "approved" &&
            !c.product.isDeleted &&
            c.product.isAvailable &&
            (!!c.product.quantity ? c.product.quantity > 0 : true) &&
            c.product.isActive &&
            (!c.variant ||
                (c.variant && !c.variant.isDeleted && c.variant.quantity > 0))
    );

    const userPermissions = useMemo(() => {
        if (!user)
            return {
                sitePermissions: 0,
                brandPermissions: 0,
            };
        return getUserPermissions(user.roles);
    }, [user]);

    const isAuthorized = useMemo(
        () =>
            hasPermission(userPermissions.sitePermissions, [
                BitFieldSitePermission.VIEW_PROTECTED_PAGES,
            ]) || !!user?.brand,
        [userPermissions.sitePermissions, user?.brand]
    );

    const handleNavigate = (
        categoryId: string,
        subcategoryId: string,
        productTypeId: string
    ) => {
        return `/shop?categoryId=${categoryId}&subcategoryId=${subcategoryId}&productTypeId=${productTypeId}`;
    };

    const cartCount = user ? (availableCart ?? []).length : guestCart.length;
    const wishlistCount = user
        ? (userWishlist?.length ?? 0)
        : guestWishlist.length;

    const { signOut } = useAuth();
    const posthog = usePostHog();

    const { mutate: handleLogout, isPending: isLoggingOut } = useMutation({
        onMutate: () => {
            posthog.capture(POSTHOG_EVENTS.AUTH.SIGNOUT_INITIATED, {
                userId: user?.id,
            });
            const toastId = toast.loading("Logging out...");
            return { toastId };
        },
        mutationFn: () =>
            signOut({
                redirectUrl: "/",
            }),
        onSuccess: async (_, __, { toastId }) => {
            toast.success("See you soon!", { id: toastId });
            posthog.capture(POSTHOG_EVENTS.AUTH.SIGNED_OUT, {
                userId: user?.id,
            });
            await wait(1000);
            window.location.reload();
        },
        onError: (err, _, ctx) => {
            return isClerkAPIResponseError(err)
                ? toast.error(err.errors.map((e) => e.message).join(", "), {
                      id: ctx?.toastId,
                  })
                : handleClientError(err, ctx?.toastId);
        },
    });

    return (
        <>
            <AnimatePresence>
                {flyingItems.map((item) => (
                    <motion.img
                        key={item.id}
                        src={item.imageSrc}
                        layoutId={`flying-image-${item.id}`}
                        initial={{
                            position: "fixed",
                            left: item.startRect.left,
                            top: item.startRect.top,
                            width: item.startRect.width,
                            height: item.startRect.height,
                            opacity: 1,
                            zIndex: 9999,
                            borderRadius: 8,
                            objectFit: "cover",
                            boxShadow: "0 10px 25px rgba(0,0,0,0.2)",
                            rotate: 0,
                        }}
                        animate={{
                            left:
                                item.endRect.left + item.endRect.width / 2 - 10,
                            top:
                                item.endRect.top + item.endRect.height / 2 - 10,
                            width: 20,
                            height: 20,
                            opacity: 0.6,
                            rotate: 8,
                        }}
                        exit={{ opacity: 0, scale: 0 }}
                        transition={{
                            duration: 0.5,
                            ease: [0.4, 0.0, 0.2, 1], // cubic-bezier(0.4, 0.0, 0.2, 1)
                        }}
                        onAnimationComplete={() =>
                            handleAnimationComplete(item.id)
                        }
                    />
                ))}
            </AnimatePresence>
            <motion.header
                variants={{
                    visible: {
                        y: 0,
                    },
                    hidden: {
                        y: "-100%",
                    },
                }}
                animate={isMenuHidden ? "hidden" : "visible"}
                transition={{
                    duration: 0.35,
                    ease: "easeInOut",
                }}
                className="sticky inset-x-0 top-0 z-50 flex h-auto w-full flex-col items-center justify-center border bg-[rgba(255,255,255,0.96)] shadow-[0_10px_30px_-28px_rgba(15,23,42,0.18)] backdrop-blur-xl"
                data-menu-open={isMenuOpen}
            >
                {/* 🔵 DISCOUNT STRIP — GLOBALLY ABOVE NAVBAR */}
                <div className="order-2 w-full overflow-hidden border-t border-[#cbd5e1] bg-[#374151] md:order-1 md:border-none">
                    <div
                        className="text-11 tracking-[0.08em] text-[#f8fafc] md:text-xs"
                        style={{
                            display: "inline-flex",
                            whiteSpace: "nowrap",
                            gap: "40px",
                            padding: "8px 0",
                            fontWeight: 600,
                            animation: "discountMarquee 120s linear infinite",
                        }}
                    >
                        {Array.from({ length: 8 }).map((_, i) => (
                            <span key={i} className="flex items-center gap-[40px]">
                                <span className="flex items-center gap-2">
                                    <Icons.Truck className="size-4" />
                                    <span>Free Delivery on Your 1st Conscious Choice</span>
                                </span>
                                <span>•</span>
                                <span className="flex items-center gap-2">
                                    <Icons.Ticket className="size-4" />
                                    <span>
                                        Flat 20% Off on Orders Above ₹3,000 – Use <strong>TRYNEW20</strong>
                                    </span>
                                </span>
                                <span>•</span>
                                <span className="flex items-center gap-2">
                                    <Icons.Tag className="size-4" />
                                    <span>
                                        Flat 10% Off For Your First Conscious Choice – Use <strong>RENIVET10</strong>
                                    </span>
                                </span>
                                <span>•</span>
                                <span className="flex items-center gap-2">
                                    <Icons.Shield className="size-4" />
                                    <span>Verified Sustainable Brands & Easy Returns</span>
                                </span>
                                <span>•</span>
                            </span>
                        ))}
                    </div>
                </div>

                <nav
                    className={cn(
                        "relative z-10 order-1 flex w-full max-w-[100rem] items-center justify-between gap-4 px-4 py-3 md:order-2 md:px-8 xl:px-10",
                        isMenuOpen && "border"
                    )}
                >
                    <button
                        aria-label="Mobile Menu Toggle Button"
                        aria-pressed={isMenuOpen}
                        className="sm:hidden"
                        onClick={() => setIsMenuOpen(!isMenuOpen)}
                    >
                        <Icons.Menu className="size-6" />
                    </button>

                    <div className="flex items-center gap-8 xl:gap-12">
                        {customLogo ? (
                            customLogo
                        ) : (
                            <Link
                                href="/"
                                title="Home"
                                className="flex items-center gap-2 text-2xl font-bold transition-opacity duration-200 hover:opacity-85"
                            >
                                <RenivetFull width={120} height={36} />
                            </Link>
                        )}

                        <div className="hidden items-center gap-1 lg:flex">
                            <NavigationMenu className="static h-full max-w-none">
                                {/* <NavigationMenuList>
                                {isCategoriesLoading ? (
                                    <></>
                                ) : (
                                    categories &&
                                    subcategories &&
                                    productTypes &&
                                    categories.data
                                        .sort((a, b) =>
                                            a.createdAt.getTime() >
                                            b.createdAt.getTime()
                                                ? 1
                                                : -1
                                        )
                                        .slice(0, 5)
                                        .map((category) => (
                                            <NavigationMenuItem
                                                key={category.id}
                                            >
                                                <NavigationMenuTrigger className="bg-transparent">
                                                    {category.name}
                                                </NavigationMenuTrigger>

                                                <NavigationMenuContent>
                                                    <div className="grid w-[1200px] grid-cols-5 gap-3 p-4 px-6">
                                                        {subcategories.data
                                                            .filter(
                                                                (sub) =>
                                                                    sub.categoryId ===
                                                                        category.id &&
                                                                    productTypes.data.some(
                                                                        (pt) =>
                                                                            pt.subCategoryId ===
                                                                            sub.id && (pt.productCount ?? 0) > 0
                                                                    )
                                                            )
                                                            .map(
                                                                (
                                                                    subcategory
                                                                ) => (
                                                                    <div
                                                                        key={
                                                                            subcategory.id
                                                                        }
                                                                        className="space-y-2"
                                                                    >
                                                                        <Link
                                                                            href={`/shop?categoryId=${category.id}&subcategoryId=${subcategory.id}`}
                                                                            className="block hover:opacity-80"
                                                                        >
                                                                            <h3 className="font-medium text-primary">
                                                                                {
                                                                                    subcategory.name
                                                                                }
                                                                            </h3>
                                                                        </Link>

                                                                        <ul className="space-y-1">
                                                                            {productTypes.data
                                                                                .filter(
                                                                                    (
                                                                                        pt
                                                                                    ) =>
                                                                                        pt.subCategoryId ===
                                                                                        subcategory.id && (pt.productCount ?? 0) > 0
                                                                                )
                                                                                .sort((a, b) => a.name.localeCompare(b.name))
                                                                                .map(
                                                                                    (
                                                                                        productType
                                                                                    ) => (
                                                                                        <li
                                                                                            key={
                                                                                                productType.id
                                                                                            }
                                                                                        >
                                                                                            <NavigationMenuLink
                                                                                                asChild
                                                                                            >
                                                                                                <Link
                                                                                                    href={handleNavigate(
                                                                                                        category.id,
                                                                                                        subcategory.id,
                                                                                                        productType.id
                                                                                                    )}
                                                                                                    className="block text-sm text-muted-foreground hover:font-semibold hover:text-foreground"
                                                                                                >
                                                                                                    {
                                                                                                        productType.name
                                                                                                    }
                                                                                                </Link>
                                                                                            </NavigationMenuLink>
                                                                                        </li>
                                                                                    )
                                                                                )}
                                                                        </ul>
                                                                    </div>
                                                                )
                                                            )}
                                                    </div>
                                                </NavigationMenuContent>
                                            </NavigationMenuItem>
                                        ))
                                )}
                            </NavigationMenuList> */}
                                <NavigationMenuList>
                                    {isCategoriesLoading ? (
                                        <></>
                                    ) : (
                                        categories &&
                                        subcategories &&
                                        productTypes &&
                                        categories.data
                                            .sort((a, b) =>
                                                a.createdAt.getTime() >
                                                b.createdAt.getTime()
                                                    ? 1
                                                    : -1
                                            )
                                            .slice(0, 5)
                                            .map((category) => (
                                                <NavigationMenuItem
                                                    key={category.id}
                                                >
                                                    {/* Special handling for Men and Women categories */}
                                                    {category.name === "Men" ||
                                                    category.name === "Kids" ||
                                                    category.name === "Women" ||
                                                    category.name ===
                                                        "Home and Living" ||
                                                    category.name ===
                                                        "Beauty and Personal Care" ? (
                                                        <>
                                                            <NavigationMenuTrigger
                                                                className="relative h-10 rounded-none border-b-2 border-transparent bg-transparent px-3 text-13 font-semibold uppercase tracking-[0.08em] text-[#33413a] transition-colors duration-200 hover:bg-transparent hover:text-primary data-[state=open]:border-primary data-[state=open]:text-primary"
                                                                onClick={(
                                                                    e
                                                                ) => {
                                                                    e.preventDefault();
                                                                    let path;
                                                                    switch (
                                                                        category.name
                                                                    ) {
                                                                        case "Home and Living":
                                                                            path =
                                                                                "/home-living";
                                                                            break;
                                                                        case "Beauty and Personal Care":
                                                                            path =
                                                                                "/beauty-personal";
                                                                            break;
                                                                        default:
                                                                            path = `/${category.name.toLowerCase()}`;
                                                                    }
                                                                    window.location.href =
                                                                        path;
                                                                }}
                                                            >
                                                                {category.name}
                                                            </NavigationMenuTrigger>
                                                            <NavigationMenuContent className="pt-3">
                                                                <div className="overflow-hidden rounded-[24px] border bg-[#ffffff] shadow-[0_30px_80px_-42px_rgba(15,23,42,0.18)]">
                                                                    <div className="flex items-center justify-between border-b border-[#eef2f7] bg-[linear-gradient(180deg,#ffffff_0%,#f8fafc_100%)] px-8 py-4">
                                                                        <div>
                                                                            <p className="font-outfit text-11 font-semibold uppercase tracking-[0.18em] text-[#94a3b8]">
                                                                                Explore
                                                                            </p>
                                                                            <h3 className="mt-1 font-dmsans text-[24px] font-semibold tracking-[0.01em] text-[#111827]">
                                                                                {category.name}
                                                                            </h3>
                                                                        </div>
                                                                        <Link
                                                                            href={
                                                                                category.name ===
                                                                                "Home and Living"
                                                                                    ? "/home-living"
                                                                                    : category.name ===
                                                                                        "Beauty and Personal Care"
                                                                                      ? "/beauty-personal"
                                                                                      : `/${category.name.toLowerCase()}`
                                                                            }
                                                                            className="font-outfit inline-flex items-center gap-2 rounded-full border border-[#d1d5db] bg-white px-4 py-2 text-12 font-semibold uppercase tracking-[0.12em] text-[#374151] transition-colors hover:border-[#9ca3af] hover:text-[#111827]"
                                                                        >
                                                                            Shop all
                                                                            <Icons.ArrowRight className="size-3.5" />
                                                                        </Link>
                                                                    </div>

                                                                    <div className="grid w-[1180px] max-w-[95vw] grid-cols-4 font-dmsans">
                                                                    {(() => {
                                                                        const filteredSubCategories =
                                                                            subcategories.data
                                                                                .filter(
                                                                                    (
                                                                                        sub
                                                                                    ) =>
                                                                                        sub.categoryId ===
                                                                                            category.id &&
                                                                                        productTypes.data.some(
                                                                                            (
                                                                                                pt
                                                                                            ) =>
                                                                                                pt.subCategoryId ===
                                                                                                    sub.id &&
                                                                                                (pt.productCount ??
                                                                                                    0) >
                                                                                                    0
                                                                                        )
                                                                                )
                                                                                .sort(
                                                                                    (
                                                                                        a,
                                                                                        b
                                                                                    ) => {
                                                                                        const rankA =
                                                                                            a.rank ||
                                                                                            Infinity;
                                                                                        const rankB =
                                                                                            b.rank ||
                                                                                            Infinity;
                                                                                        if (
                                                                                            rankA !==
                                                                                            rankB
                                                                                        ) {
                                                                                            return (
                                                                                                rankA -
                                                                                                rankB
                                                                                            );
                                                                                        }
                                                                                        return (
                                                                                            new Date(
                                                                                                b.updatedAt
                                                                                            ).getTime() -
                                                                                            new Date(
                                                                                                a.updatedAt
                                                                                            ).getTime()
                                                                                        );
                                                                                    }
                                                                                );

                                                                        // Split into 4 denser columns for a cleaner mega menu
                                                                        const columns: (typeof filteredSubCategories)[] =
                                                                            [
                                                                                [],
                                                                                [],
                                                                                [],
                                                                                [],
                                                                            ];
                                                                        filteredSubCategories.forEach(
                                                                            (
                                                                                sub,
                                                                                i
                                                                            ) => {
                                                                                columns[
                                                                                    i %
                                                                                        4
                                                                                ].push(
                                                                                    sub
                                                                                );
                                                                            }
                                                                        );

                                                                        return columns.map(
                                                                            (
                                                                                col,
                                                                                colIdx
                                                                            ) => (
                                                                                <div
                                                                                    key={
                                                                                        colIdx
                                                                                    }
                                                                                    className={cn(
                                                                                        "flex min-h-[250px] flex-col gap-7 px-8 pb-8 pt-7",
                                                                                        colIdx %
                                                                                            2 ===
                                                                                            1
                                                                                            ? "bg-[#f8fafc]"
                                                                                            : "bg-[#ffffff]"
                                                                                    )}
                                                                                >
                                                                                    {col.map(
                                                                                        (
                                                                                            subcategory
                                                                                        ) => (
                                                                                            <div
                                                                                                key={
                                                                                                    subcategory.id
                                                                                                }
                                                                                                className="space-y-3"
                                                                                            >
                                                                                                <Link
                                                                                                    href={`/shop?categoryId=${category.id}&subcategoryId=${subcategory.id}`}
                                                                                                    className="block border-b border-[#eef2f7] pb-2 transition-colors hover:text-[#111827]"
                                                                                                >
                                                                                                    <h3 className="font-lato text-[15px] font-bold uppercase tracking-[0.06em] text-[#1f2937]">
                                                                                                        {
                                                                                                            subcategory.name
                                                                                                        }
                                                                                                    </h3>
                                                                                                </Link>
                                                                                                <ul className="space-y-2">
                                                                                                    {productTypes.data
                                                                                                        .filter(
                                                                                                            (
                                                                                                                pt
                                                                                                            ) =>
                                                                                                                pt.subCategoryId ===
                                                                                                                    subcategory.id &&
                                                                                                                (pt.productCount ??
                                                                                                                    0) >
                                                                                                                    0
                                                                                                        )
                                                                                                        .sort(
                                                                                                            (
                                                                                                                a,
                                                                                                                b
                                                                                                            ) =>
                                                                                                                a.name.localeCompare(
                                                                                                                    b.name
                                                                                                                )
                                                                                                        )
                                                                                                        .map(
                                                                                                            (
                                                                                                                productType
                                                                                                            ) => (
                                                                                                                <li
                                                                                                                    key={
                                                                                                                        productType.id
                                                                                                                    }
                                                                                                                >
                                                                                                                    <NavigationMenuLink
                                                                                                                        asChild
                                                                                                                    >
                                                                                                                        <Link
                                                                                                                            href={handleNavigate(
                                                                                                                                category.id,
                                                                                                                                subcategory.id,
                                                                                                                                productType.id
                                                                                                                            )}
                                                                                                                            className="block text-[15px] font-normal leading-6 text-[#6b7280] transition-colors [transition-duration:0ms] hover:text-[#111827]"
                                                                                                                        >
                                                                                                                            {
                                                                                                                                productType.name
                                                                                                                            }
                                                                                                                        </Link>
                                                                                                                    </NavigationMenuLink>
                                                                                                                </li>
                                                                                                            )
                                                                                                        )}
                                                                                                </ul>
                                                                                            </div>
                                                                                        )
                                                                                    )}
                                                                                </div>
                                                                            )
                                                                        );
                                                                    })()}
                                                                    </div>
                                                                </div>
                                                            </NavigationMenuContent>
                                                        </>
                                                    ) : (
                                                        <>
                                                            <NavigationMenuTrigger className="h-10 rounded-none border-b-2 border-transparent bg-transparent px-3 text-13 font-semibold uppercase tracking-[0.08em] text-[#33413a] transition-colors duration-200 hover:bg-transparent hover:text-primary data-[state=open]:border-primary data-[state=open]:text-primary">
                                                                {category.name}
                                                            </NavigationMenuTrigger>
                                                            <NavigationMenuContent>
                                                                {/* ... existing content for other categories ... */}
                                                            </NavigationMenuContent>
                                                        </>
                                                    )}
                                                </NavigationMenuItem>
                                            ))
                                    )}
                                </NavigationMenuList>
                            </NavigationMenu>
                        </div>
                    </div>

                    <div className="flex items-center gap-3 xl:gap-4">
                        <ProductSearch
                            placeholder="Search products, brands, categories..."
                            classNames={{
                                wrapper:
                                    "hidden min-w-[280px] xl:flex xl:min-w-[360px] [&>div]:rounded-xl [&>div]:border-[#dfdfdf] [&>div]:bg-[#f5f5f5] [&>div]:shadow-none",
                            }}
                        />
                        {/* ✅ Guest-only Wishlist & Cart */}
                        {!user && (
                            <>
                                <NavbarActionButton href="/guestWishlist">
                                    {wishlistCount > 0 && (
                                        <div className="absolute -right-1 -top-1 flex min-w-[20px] items-center justify-center rounded-full bg-primary px-1.5 py-0.5 text-[10px] font-bold text-primary-foreground">
                                            {wishlistCount}
                                        </div>
                                    )}
                                    <Icons.Heart className="size-5" />
                                    <span className="sr-only">Wishlist</span>
                                </NavbarActionButton>

                                <NavbarActionButton
                                    href="/mycart"
                                    className="global-cart-icon"
                                >
                                    <motion.div
                                        animate={{
                                            scale: isCartBumping ? 1.25 : 1,
                                        }}
                                        transition={{
                                            type: "spring",
                                            stiffness: 300,
                                            damping: 20,
                                        }}
                                        className="relative flex items-center justify-center"
                                    >
                                        {cartCount > 0 && (
                                            <div className="absolute -right-1 -top-1 flex min-w-[20px] items-center justify-center rounded-full bg-primary px-1.5 py-0.5 text-[10px] font-bold text-primary-foreground">
                                                {cartCount}
                                            </div>
                                        )}
                                        <Icons.ShoppingCart className="size-5" />
                                    </motion.div>
                                    <span className="sr-only">Cart</span>
                                </NavbarActionButton>
                            </>
                        )}

                        {user ? (
                            <div className="flex items-center">
                                <Link
                                    aria-label="Mobile Cart Button"
                                    className="global-cart-icon relative flex items-center justify-center sm:hidden"
                                    href="/mycart"
                                    prefetch
                                >
                                    <motion.div
                                        animate={{
                                            scale: isCartBumping ? 1.25 : 1,
                                        }}
                                        transition={{
                                            type: "spring",
                                            stiffness: 300,
                                            damping: 20,
                                        }}
                                        className="relative flex items-center justify-center"
                                    >
                                        {(availableCart ?? []).length > 0 && (
                                            <div className="absolute right-[-6px] top-[-6px] flex size-4 items-center justify-center rounded-full bg-primary text-xs text-primary-foreground">
                                                {(availableCart ?? []).length}
                                            </div>
                                        )}
                                        <Icons.ShoppingCart className="size-6" />
                                    </motion.div>
                                </Link>

                                <div className="hidden items-center gap-2 md:flex">
                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <button className="flex size-10 items-center justify-center rounded-xl border border-transparent bg-transparent text-[#1f2b24] transition-all duration-200 hover:border-[#e7dfd1] hover:bg-[#f5f1e8] hover:text-primary">
                                                <Icons.UserCircle className="size-5" />
                                                <span className="sr-only">
                                                    User menu
                                                </span>
                                            </button>
                                        </DropdownMenuTrigger>

                                        <DropdownMenuContent className="min-w-56 rounded-xl border bg-white p-2 shadow-[0_18px_45px_-30px_rgba(15,23,42,0.16)]">
                                            <DropdownMenuLabel className="space-y-1 rounded-lg bg-[#f9fafb] p-3">
                                                <p>
                                                    Hello,{" "}
                                                    <span className="font-semibold">
                                                        {user.firstName}
                                                    </span>
                                                </p>
                                                <p className="text-xs font-normal">
                                                    {hideEmail(user.email)}
                                                </p>
                                            </DropdownMenuLabel>

                                            <DropdownMenuSeparator />

                                            <DropdownMenuGroup>
                                                <DropdownMenuItem
                                                    className={cn(
                                                        "rounded-xl",
                                                        isAuthorized && "hidden"
                                                    )}
                                                    asChild
                                                >
                                                    <Link
                                                        href="/profile/orders"
                                                        prefetch
                                                    >
                                                        <Icons.Package className="size-4" />
                                                        <span>Orders</span>
                                                    </Link>
                                                </DropdownMenuItem>

                                                <DropdownMenuItem
                                                    className={cn(
                                                        "rounded-xl",
                                                        isAuthorized && "hidden"
                                                    )}
                                                    asChild
                                                >
                                                    <Link
                                                        href="/profile/wishlist"
                                                        prefetch
                                                    >
                                                        <Icons.Heart className="size-4" />
                                                        <span>Wishlist</span>
                                                    </Link>
                                                </DropdownMenuItem>

                                                <DropdownMenuItem
                                                    className={cn(
                                                        "rounded-xl",
                                                        !isAuthorized &&
                                                            "hidden"
                                                    )}
                                                    asChild
                                                >
                                                    <Link
                                                        href="/dashboard"
                                                        prefetch
                                                    >
                                                        <Icons.LayoutDashboard className="size-4" />
                                                        <span>Dashboard</span>
                                                    </Link>
                                                </DropdownMenuItem>

                                                <DropdownMenuItem
                                                    className="rounded-xl"
                                                    asChild
                                                >
                                                    <Link href="/contact">
                                                        <Icons.LifeBuoy className="size-4" />
                                                        <span>Contact Us</span>
                                                    </Link>
                                                </DropdownMenuItem>
                                            </DropdownMenuGroup>

                                            <DropdownMenuSeparator />

                                            <DropdownMenuGroup>
                                                <DropdownMenuItem
                                                    className={cn(
                                                        "rounded-xl",
                                                        isAuthorized && "hidden"
                                                    )}
                                                    asChild
                                                >
                                                    <Link href="/profile/addresses">
                                                        <Icons.Home className="size-4" />
                                                        <span>Addresses</span>
                                                    </Link>
                                                </DropdownMenuItem>

                                                <DropdownMenuItem
                                                    className="rounded-xl"
                                                    asChild
                                                >
                                                    <Link href="/profile">
                                                        <Icons.User2 className="size-4" />
                                                        <span>Profile</span>
                                                    </Link>
                                                </DropdownMenuItem>
                                            </DropdownMenuGroup>

                                            <DropdownMenuSeparator />

                                            <DropdownMenuItem
                                                className="rounded-xl"
                                                disabled={isLoggingOut}
                                                onClick={() => handleLogout()}
                                            >
                                                <Icons.LogOut className="size-4" />
                                                <span>Log out</span>
                                            </DropdownMenuItem>
                                        </DropdownMenuContent>
                                    </DropdownMenu>

                                    <NavbarActionButton href="/profile/wishlist">
                                        {userWishlist?.length
                                            ? userWishlist.length > 0 && (
                                                  <div className="absolute -right-1 -top-1 flex min-w-[20px] items-center justify-center rounded-full bg-primary px-1.5 py-0.5 text-[10px] font-bold text-primary-foreground">
                                                      {userWishlist.length}
                                                  </div>
                                              )
                                            : null}

                                        <Icons.Heart className="size-5" />
                                        <span className="sr-only">
                                            Wishlist
                                        </span>
                                    </NavbarActionButton>

                                    <NavbarActionButton
                                        href="/mycart"
                                        className="global-cart-icon"
                                    >
                                        <motion.div
                                            animate={{
                                                scale: isCartBumping ? 1.25 : 1,
                                            }}
                                            transition={{
                                                type: "spring",
                                                stiffness: 300,
                                                damping: 20,
                                            }}
                                            className="relative flex items-center justify-center"
                                        >
                                            {availableCart?.length &&
                                            availableCart.length > 0 ? (
                                                <div className="absolute -right-1 -top-1 flex min-w-[20px] items-center justify-center rounded-full bg-primary px-1.5 py-0.5 text-[10px] font-bold text-primary-foreground">
                                                    {availableCart.length}
                                                </div>
                                            ) : null}
                                            <Icons.ShoppingCart className="size-5" />
                                        </motion.div>
                                        <span className="sr-only">Cart</span>
                                    </NavbarActionButton>
                                </div>
                            </div>
                        ) : (
                            <>
                                <Button
                                    variant="ghost"
                                    className="hidden h-10 rounded-lg border border-[#d9d9d9] px-4 text-[#1f2b24] hover:bg-[#f5f5f5] hover:text-primary md:flex"
                                    size="sm"
                                    asChild
                                >
                                    <Link href="/auth/signin">
                                        Login/Signup
                                    </Link>
                                </Button>

                                <div className="flex items-center gap-1 md:hidden">
                                    <Button
                                        variant="ghost"
                                        className="h-10 rounded-lg border border-[#d9d9d9] px-4 text-primary hover:bg-[#f5f5f5]"
                                        size="sm"
                                        asChild
                                    >
                                        <Link href="/auth/signin">Login</Link>
                                    </Button>
                                </div>
                            </>
                        )}
                    </div>
                </nav>
            </motion.header>
        </>
    );
}
