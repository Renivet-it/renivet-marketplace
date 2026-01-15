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
import { motion, useMotionValueEvent, useScroll } from "motion/react";
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
export function NavbarHome() {
    const [isMenuHidden, setIsMenuHidden] = useState(false);

    const isMenuOpen = useNavbarStore((state) => state.isOpen);
    const setIsMenuOpen = useNavbarStore((state) => state.setIsOpen);
    const { guestCart } = useGuestCart();
    const { guestWishlist } = useGuestWishlist();
    const { scrollY } = useScroll();

    // useMotionValueEvent(scrollY, "change", (latest) => {
    //     const previous = scrollY.getPrevious() ?? 0;

    //     if (latest > previous && latest > 150) setIsMenuHidden(true);
    //     else setIsMenuHidden(false);
    // });

    const { data: user, isPending: isUserFetching } =
        trpc.general.users.currentUser.useQuery();

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
            className="sticky inset-x-0 top-0 z-50 flex h-auto w-full items-center justify-center border-b border-white/20 bg-white/60 backdrop-blur-lg"
            data-menu-open={isMenuOpen}
        >
            <nav
                className={cn(
                    "relative z-10 flex w-full max-w-5xl items-center justify-between gap-5 p-4 md:px-8 xl:max-w-[100rem]",
                    isMenuOpen && "border-b"
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

                <div className="flex items-center gap-20">
                    <Link
                        href="/"
                        title="Home"
                        className="flex items-center gap-2 text-2xl font-bold hover:opacity-100 active:opacity-100"
                    >
                        <RenivetFull width={120} height={36} />
                    </Link>

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
                                                            className="relative bg-transparent hover:bg-transparent"
                                                            onClick={(e) => {
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
                                                        <NavigationMenuContent>
                                                            <div className="font-dmsans grid w-[1200px] max-w-[95vw] grid-cols-5 border border-gray-100 bg-white shadow-2xl">
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
                                                                                    if (
                                                                                        (a.rank ??
                                                                                            0) !==
                                                                                        (b.rank ??
                                                                                            0)
                                                                                    ) {
                                                                                        return (
                                                                                            (b.rank ??
                                                                                                0) -
                                                                                            (a.rank ??
                                                                                                0)
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

                                                                    // Split into 5 columns
                                                                    const columns: (typeof filteredSubCategories)[] =
                                                                        [
                                                                            [],
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
                                                                                    5
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
                                                                                    "flex flex-col gap-8 p-8",
                                                                                    colIdx %
                                                                                        2 ===
                                                                                        1
                                                                                        ? "bg-gray-50/40"
                                                                                        : "bg-white"
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
                                                                                            className="space-y-4"
                                                                                        >
                                                                                            <Link
                                                                                                href={`/shop?categoryId=${category.id}&subcategoryId=${subcategory.id}`}
                                                                                                className="block border-b border-gray-100 pb-1 transition-opacity hover:opacity-80"
                                                                                            >
                                                                                                <h3 className="text-13 font-bold uppercase tracking-wider text-myntra-primary">
                                                                                                    {
                                                                                                        subcategory.name
                                                                                                    }
                                                                                                </h3>
                                                                                            </Link>
                                                                                            <ul className="space-y-1.5">
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
                                                                                                                        className="block text-13 font-normal text-myntra-label transition-all [transition-duration:0ms] hover:font-bold hover:text-myntra-primary"
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
                                                        </NavigationMenuContent>
                                                    </>
                                                ) : (
                                                    <>
                                                        <NavigationMenuTrigger className="bg-transparent">
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

                <div className="flex items-center gap-5">
                    <ProductSearch
                        placeholder="Search for products..."
                        classNames={{ wrapper: "min-w-80 hidden xl:flex" }}
                    />
                    {/* ✅ Guest-only Wishlist & Cart */}
                    {!user && (
                        <>
                            <Link href="/guestWishlist" className="relative">
                                {wishlistCount > 0 && (
                                    <div className="absolute right-0 top-0 flex size-4 -translate-y-1/2 translate-x-1/2 items-center justify-center rounded-full bg-primary text-xs text-primary-foreground">
                                        {wishlistCount}
                                    </div>
                                )}
                                <Icons.Heart className="size-5" />
                                <span className="sr-only">Wishlist</span>
                            </Link>

                            <Link href="/mycart" className="relative">
                                {cartCount > 0 && (
                                    <div className="absolute right-0 top-0 flex size-4 -translate-y-1/2 translate-x-1/2 items-center justify-center rounded-full bg-primary text-xs text-primary-foreground">
                                        {cartCount}
                                    </div>
                                )}
                                <Icons.ShoppingCart className="size-5" />
                                <span className="sr-only">Cart</span>
                            </Link>
                        </>
                    )}

                    {user ? (
                        <div className="flex items-center">
                            <Link
                                aria-label="Mobile Cart Button"
                                className="relative sm:hidden"
                                href="/mycart"
                                prefetch
                            >
                                {(availableCart ?? []).length > 0 && (
                                    <div className="absolute right-0 top-0 flex size-4 -translate-y-1/2 translate-x-1/2 items-center justify-center rounded-full bg-primary text-xs text-primary-foreground">
                                        {(availableCart ?? []).length}
                                    </div>
                                )}
                                <Icons.ShoppingCart className="size-6" />
                            </Link>

                            <div className="hidden items-center gap-5 md:flex">
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <button>
                                            <Icons.UserCircle className="size-5" />
                                            <span className="sr-only">
                                                User menu
                                            </span>
                                        </button>
                                    </DropdownMenuTrigger>

                                    <DropdownMenuContent className="min-w-56 rounded-none">
                                        <DropdownMenuLabel className="space-y-1">
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
                                                    "rounded-none",
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
                                                    "rounded-none",
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
                                                    "rounded-none",
                                                    !isAuthorized && "hidden"
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
                                                className="rounded-none"
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
                                                    "rounded-none",
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
                                                className="rounded-none"
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
                                            className="rounded-none"
                                            disabled={isLoggingOut}
                                            onClick={() => handleLogout()}
                                        >
                                            <Icons.LogOut className="size-4" />
                                            <span>Log out</span>
                                        </DropdownMenuItem>
                                    </DropdownMenuContent>
                                </DropdownMenu>

                                <Link
                                    href="/profile/wishlist"
                                    className="relative"
                                >
                                    {userWishlist?.length
                                        ? userWishlist.length > 0 && (
                                              <div className="absolute right-0 top-0 flex size-4 -translate-y-1/2 translate-x-1/2 items-center justify-center rounded-full bg-primary text-xs text-primary-foreground">
                                                  {userWishlist.length}
                                              </div>
                                          )
                                        : null}

                                    <Icons.Heart className="size-5" />
                                    <span className="sr-only">Wishlist</span>
                                </Link>

                                <Link href="/mycart" className="relative">
                                    {availableCart?.length
                                        ? availableCart.length > 0 && (
                                              <div className="absolute right-0 top-0 flex size-4 -translate-y-1/2 translate-x-1/2 items-center justify-center rounded-full bg-primary text-xs text-primary-foreground">
                                                  {availableCart.length}
                                              </div>
                                          )
                                        : null}

                                    <Icons.ShoppingCart className="size-5" />
                                    <span className="sr-only">Cart</span>
                                </Link>
                            </div>
                        </div>
                    ) : (
                        <>
                            <Button
                                variant="ghost"
                                className="hidden border-accent text-primary md:flex"
                                size="sm"
                                asChild
                            >
                                <Link href="/auth/signin">Login/Signup</Link>
                            </Button>

                            <div className="flex items-center gap-1 md:hidden">
                                <Button
                                    variant="ghost"
                                    className="border-accent text-accent"
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
    );
}
