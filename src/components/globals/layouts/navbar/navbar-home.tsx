"use client";

import { Icons } from "@/components/icons";
import { Renivet } from "@/components/svgs";
import { Button } from "@/components/ui/button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuGroup,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { DEFAULT_MESSAGES } from "@/config/const";
import { siteConfig } from "@/config/site";
import { useNavbarStore } from "@/lib/store";
import { trpc } from "@/lib/trpc/client";
import { hideEmail } from "@/lib/utils";
import { useAuth } from "@clerk/nextjs";
import { isClerkAPIResponseError } from "@clerk/nextjs/errors";
import { useMutation } from "@tanstack/react-query";
import { motion, useMotionValueEvent, useScroll } from "framer-motion";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

export function NavbarHome() {
    const router = useRouter();

    const [isMenuHidden, setIsMenuHidden] = useState(false);

    const isMenuOpen = useNavbarStore((state) => state.isOpen);
    const setIsMenuOpen = useNavbarStore((state) => state.setIsOpen);

    const { scrollY } = useScroll();

    useMotionValueEvent(scrollY, "change", (latest) => {
        const previous = scrollY.getPrevious() ?? 0;

        if (latest > previous && latest > 150) setIsMenuHidden(true);
        else setIsMenuHidden(false);
    });

    const { data: user } = trpc.users.currentUser.useQuery();

    const { signOut } = useAuth();

    const { mutate: handleLogout, isPending: isLoggingOut } = useMutation({
        onMutate: () => {
            const toastId = toast.loading("Logging out...");
            return { toastId };
        },
        mutationFn: () => signOut(),
        onSuccess: (_, __, { toastId }) => {
            toast.success("See you soon!", { id: toastId });
            router.refresh();
            router.push("/auth/signin");
        },
        onError: (err, _, ctx) => {
            return isClerkAPIResponseError(err)
                ? toast.error(err.errors.map((e) => e.message).join(", "), {
                      id: ctx?.toastId,
                  })
                : toast.error(DEFAULT_MESSAGES.ERRORS.GENERIC, {
                      id: ctx?.toastId,
                  });
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
            className="sticky inset-x-0 top-0 z-50 flex h-auto w-full items-center justify-center bg-background"
            data-menu-open={isMenuOpen}
        >
            <nav className="relative z-10 flex w-full max-w-5xl items-center justify-between gap-5 overflow-hidden p-4 md:px-8 xl:max-w-[100rem]">
                <button
                    aria-label="Mobile Menu Toggle Button"
                    aria-pressed={isMenuOpen}
                    className="sm:hidden"
                    onClick={() => setIsMenuOpen(!isMenuOpen)}
                >
                    <Icons.Menu className="size-6" />
                </button>

                <Link
                    href="/"
                    className="flex items-center gap-2 text-2xl font-bold hover:opacity-100 active:opacity-100"
                >
                    <Renivet
                        fill="white"
                        stroke="black"
                        svgScale={1.3}
                        height={38.33}
                        width={40.3}
                    />

                    <h4 className="text-2xl font-bold md:text-3xl">
                        {siteConfig.name}
                    </h4>
                </Link>

                <ul className="hidden items-center gap-10 sm:flex">
                    {!!siteConfig.menu.length &&
                        siteConfig.menu.map((item, index) => (
                            <li key={index}>
                                <Link
                                    className="text-sm ease-in-out"
                                    href={item.href}
                                    target={
                                        item.isExternal ? "_blank" : "_self"
                                    }
                                >
                                    {item.name}
                                </Link>
                            </li>
                        ))}
                </ul>

                {user ? (
                    <div className="flex items-center">
                        <Link
                            aria-label="Mobile Cart Button"
                            className="sm:hidden"
                            href="/cart"
                        >
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
                                        <DropdownMenuItem className="rounded-none">
                                            <Icons.Package className="mr-2 size-4" />
                                            <span>Orders</span>
                                        </DropdownMenuItem>

                                        <DropdownMenuItem className="rounded-none">
                                            <Icons.Heart className="mr-2 size-4" />
                                            <span>Wishlist</span>
                                        </DropdownMenuItem>

                                        <DropdownMenuItem className="rounded-none">
                                            <Icons.LifeBuoy className="mr-2 size-4" />
                                            <span>Contact Us</span>
                                        </DropdownMenuItem>
                                    </DropdownMenuGroup>

                                    <DropdownMenuSeparator />

                                    <DropdownMenuGroup>
                                        <DropdownMenuItem className="rounded-none">
                                            <Icons.Ticket className="mr-2 size-4" />
                                            <span>Coupons</span>
                                        </DropdownMenuItem>

                                        <DropdownMenuItem className="rounded-none">
                                            <Icons.Home className="mr-2 size-4" />
                                            <span>Addresses</span>
                                        </DropdownMenuItem>

                                        <DropdownMenuItem className="rounded-none">
                                            <Icons.User2 className="mr-2 size-4" />
                                            <span>Edit Profile</span>
                                        </DropdownMenuItem>
                                    </DropdownMenuGroup>

                                    <DropdownMenuSeparator />

                                    <DropdownMenuItem
                                        className="rounded-none"
                                        disabled={isLoggingOut}
                                        onClick={() => handleLogout()}
                                    >
                                        <Icons.LogOut className="mr-2 size-4" />
                                        <span>Log out</span>
                                    </DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>

                            <Link href="/soon">
                                <Icons.Heart className="size-5" />
                            </Link>

                            <Link href="/soon">
                                <Icons.ShoppingCart className="size-5" />
                            </Link>
                        </div>
                    </div>
                ) : (
                    <div className="flex items-center gap-1">
                        <Button variant="ghost" size="sm" asChild>
                            <Link href="/soon"> Become a Seller</Link>
                        </Button>

                        <Button
                            variant="ghost"
                            className="border-accent text-accent"
                            size="sm"
                            asChild
                        >
                            <Link href="/auth/signin">Login/Signup</Link>
                        </Button>
                    </div>
                )}
            </nav>
        </motion.header>
    );
}
