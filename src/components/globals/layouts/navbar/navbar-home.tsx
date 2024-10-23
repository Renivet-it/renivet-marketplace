"use client";

import { Icons } from "@/components/icons";
// import { DEFAULT_MESSAGES } from "@/config/const";
import { siteConfig } from "@/config/site";
import { useNavbarStore } from "@/lib/store";
// import { trpc } from "@/lib/trpc/client";
// import { getAbsoluteURL } from "@/lib/utils";
// import { useAuth } from "@clerk/nextjs";
// import { isClerkAPIResponseError } from "@clerk/nextjs/errors";
import { motion, useMotionValueEvent, useScroll } from "framer-motion";
import Link from "next/link";
import { useState } from "react";

// import { toast } from "sonner";

export function NavbarHome() {
    const [isMenuHidden, setIsMenuHidden] = useState(false);

    const isMenuOpen = useNavbarStore((state) => state.isOpen);
    const setIsMenuOpen = useNavbarStore((state) => state.setIsOpen);

    const { scrollY } = useScroll();

    useMotionValueEvent(scrollY, "change", (latest) => {
        const previous = scrollY.getPrevious() ?? 0;

        if (latest > previous && latest > 150) setIsMenuHidden(true);
        else setIsMenuHidden(false);
    });

    // const { data, isPending } = trpc.users.currentUser.useQuery();

    // const { signOut } = useAuth();

    // const handleLogout = async () => {
    //     try {
    //         await signOut({
    //             redirectUrl: getAbsoluteURL(),
    //         });
    //     } catch (err) {
    //         console.error(err);

    //         return isClerkAPIResponseError(err)
    //             ? toast.error(err.errors.map((e) => e.message).join(", "))
    //             : toast.error(DEFAULT_MESSAGES.ERRORS.GENERIC);
    //     }
    // };

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
            className="sticky inset-x-0 top-0 z-50 flex h-auto w-full items-center justify-center bg-transparent"
            data-menu-open={isMenuOpen}
        >
            <nav className="relative z-10 flex w-full max-w-7xl items-center justify-between gap-5 overflow-hidden rounded-2xl bg-background p-4 md:px-8">
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
                    {/* TODO: Logo Component */}
                    <Icons.Waves className="size-7" />

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
                                    target="_blank"
                                >
                                    {item.name}
                                </Link>
                            </li>
                        ))}
                </ul>

                <div className="flex items-center">
                    <Link
                        aria-label="Mobile Cart Button"
                        className="sm:hidden"
                        href="/cart"
                    >
                        <Icons.ShoppingCart className="size-6" />
                    </Link>

                    <div className="hidden items-center gap-5 md:flex">
                        <button>
                            <Icons.Search className="size-5" />
                        </button>

                        <button>
                            <Icons.UserCircle className="size-5" />
                        </button>

                        <button>
                            <Icons.Heart className="size-5" />
                        </button>

                        <button>
                            <Icons.ShoppingCart className="size-5" />
                        </button>
                    </div>
                </div>
            </nav>
        </motion.header>
    );
}
