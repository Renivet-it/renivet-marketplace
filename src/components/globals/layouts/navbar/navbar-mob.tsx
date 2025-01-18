"use client";

import { Icons } from "@/components/icons";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { DEFAULT_AVATAR_URL } from "@/config/const";
import { BitFieldSitePermission } from "@/config/permissions";
import { useNavbarStore } from "@/lib/store";
import { trpc } from "@/lib/trpc/client";
import {
    cn,
    getUserPermissions,
    handleClientError,
    hasPermission,
    hideEmail,
    slugify,
} from "@/lib/utils";
import { useAuth } from "@clerk/nextjs";
import { isClerkAPIResponseError } from "@clerk/nextjs/errors";
import { useMutation } from "@tanstack/react-query";
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
        name: "Become a Seller",
        description: "Join as a seller",
        href: "/become-a-seller",
        icon: "DollarSign",
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

const profileMenu: SiteConfig["menu"] = [
    {
        name: "Dashboard",
        href: "/dashboard",
        icon: "LayoutDashboard",
    },
    {
        name: "Manage Account",
        href: "/profile",
        icon: "User2",
    },
    {
        name: "Addresses",
        href: "/profile/addresses",
        icon: "Map",
    },
    {
        name: "Join as a Brand",
        href: "/contact/brand",
        icon: "SquareTerminal",
    },
    {
        name: "Login/Register",
        href: "/auth/signin",
        icon: "LogIn",
    },
];

const boxMenu: SiteConfig["menu"] = [
    {
        name: "Orders",
        href: "/orders",
        icon: "Package",
    },
    {
        name: "Wishlist",
        href: "/wishlist",
        icon: "Heart",
    },
    {
        name: "Help Center",
        href: "/contact",
        icon: "Headset",
    },
    {
        name: "Coupons",
        href: "/coupons",
        icon: "Ticket",
    },
];

const IS_HIDDEN = true;

export function NavbarMob({ className, ...props }: GenericProps) {
    const router = useRouter();

    const isMenuOpen = useNavbarStore((state) => state.isOpen);
    const setIsMenuOpen = useNavbarStore((state) => state.setIsOpen);

    const navContainerRef = useRef<ElementRef<"div"> | null>(null);
    const navListRef = useRef<ElementRef<"ul"> | null>(null);

    useEffect(() => {
        if (typeof document === "undefined") return;

        if (isMenuOpen) document.body.style.overflow = "hidden";
        else document.body.style.overflow = "auto";
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
                "bg-background md:hidden",
                "flex flex-col justify-between gap-4",
                className
            )}
            ref={navContainerRef}
            {...props}
        >
            <div
                className="space-y-5 overflow-y-scroll pt-[4.5rem]"
                style={{ scrollbarWidth: "none" }}
            >
                {user && (
                    <div>
                        <div className="flex items-center justify-between gap-4 p-4 py-5">
                            <div className="flex items-center gap-4">
                                <Avatar>
                                    <AvatarImage
                                        src={
                                            user.avatarUrl ?? DEFAULT_AVATAR_URL
                                        }
                                        alt={user.firstName}
                                    />
                                    <AvatarFallback>
                                        {user.firstName[0].toUpperCase()}
                                    </AvatarFallback>
                                </Avatar>

                                <div>
                                    <p className="text-sm font-semibold">
                                        {user.firstName} {user.lastName}
                                    </p>
                                    <p className="text-xs font-normal">
                                        {hideEmail(user.email)}
                                    </p>
                                </div>
                            </div>

                            <button
                                className="p-2"
                                disabled={isLoggingOut}
                                onClick={() => handleLogout()}
                            >
                                <Icons.LogOut className="size-4" />
                            </button>
                        </div>

                        <Separator />
                    </div>
                )}

                <div className={cn("space-y-5", !user && "mt-5")}>
                    {!isSiteAuthorized && !isBrandAuthorized && (
                        <>
                            <ul
                                className={cn(
                                    "grid grid-cols-2 items-center gap-4 px-4",
                                    IS_HIDDEN && "hidden"
                                )}
                                ref={navListRef}
                            >
                                {boxMenu.map((item, index) => {
                                    const Icon = Icons[item.icon];

                                    return (
                                        <li
                                            key={index}
                                            className="border"
                                            aria-label={`Box Menu Item ${item.name}`}
                                        >
                                            <Link
                                                href={item.href}
                                                className="flex items-center justify-between gap-1 p-3"
                                                target={
                                                    item.isExternal
                                                        ? "_blank"
                                                        : "_self"
                                                }
                                                onClick={() =>
                                                    setIsMenuOpen(false)
                                                }
                                            >
                                                <div className="flex items-center gap-2">
                                                    <Icon className="size-5 text-muted-foreground" />
                                                    <span className="text-sm font-semibold">
                                                        {item.name}
                                                    </span>
                                                </div>

                                                <div>
                                                    <Icons.ChevronRight className="size-5 text-muted-foreground" />
                                                </div>
                                            </Link>
                                        </li>
                                    );
                                })}
                            </ul>

                            <Separator className="hidden" />
                        </>
                    )}

                    <ul
                        className="flex items-center gap-2 overflow-x-scroll px-4"
                        style={{ scrollbarWidth: "none" }}
                    >
                        {profileMenu.map((item, index) => (
                            <li
                                key={index}
                                aria-label={`Profile Menu Item ${item.name}`}
                                className={cn({
                                    hidden:
                                        (slugify(item.name) === "dashboard" &&
                                            !isSiteAuthorized &&
                                            !isBrandAuthorized) ||
                                        (slugify(item.name) ===
                                            "join-as-a-brand" &&
                                            isBrandAuthorized &&
                                            !isSiteAuthorized) ||
                                        (!user &&
                                            [
                                                "manage-account",
                                                "addresses",
                                            ].includes(slugify(item.name))) ||
                                        (user &&
                                            slugify(item.name) ===
                                                "loginregister"),
                                })}
                            >
                                <Link
                                    href={item.href}
                                    className="flex items-center justify-between gap-1 rounded-full border p-2 px-3"
                                    target={
                                        item.isExternal ? "_blank" : "_self"
                                    }
                                    onClick={() => setIsMenuOpen(false)}
                                >
                                    <p className="whitespace-nowrap text-xs font-semibold">
                                        {item.name}
                                    </p>

                                    <div>
                                        <Icons.ChevronRight className="size-4 text-muted-foreground" />
                                    </div>
                                </Link>
                            </li>
                        ))}
                    </ul>

                    <div>
                        <Separator />

                        <ul>
                            {extraMenu.map((item, index) => {
                                const Icon = Icons[item.icon];

                                return (
                                    <li
                                        key={index}
                                        aria-label={`Extra Menu Item ${item.name}`}
                                    >
                                        <Link
                                            href={item.href}
                                            className="flex items-center justify-between gap-2 p-4"
                                            target={
                                                item.isExternal
                                                    ? "_blank"
                                                    : "_self"
                                            }
                                            onClick={() => setIsMenuOpen(false)}
                                        >
                                            <div className="flex items-center gap-4">
                                                <Icon className="size-5 text-muted-foreground" />
                                                <div>
                                                    <p className="text-sm font-semibold">
                                                        {item.name}
                                                    </p>

                                                    <p className="text-xs">
                                                        {item.description}
                                                    </p>
                                                </div>
                                            </div>

                                            <div>
                                                <Icons.ChevronRight className="size-5 text-muted-foreground" />
                                            </div>
                                        </Link>

                                        <Separator />
                                    </li>
                                );
                            })}
                        </ul>
                    </div>
                </div>
            </div>
        </div>
    );
}
