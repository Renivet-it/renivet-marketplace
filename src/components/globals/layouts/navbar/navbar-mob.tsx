"use client";

import { Icons } from "@/components/icons";
// import { DEFAULT_MESSAGES } from "@/config/const";
import { siteConfig } from "@/config/site";
import { useNavbarStore } from "@/lib/store";
// import { trpc } from "@/lib/trpc/client";
import { cn } from "@/lib/utils";
// import { useAuth } from "@clerk/nextjs";
// import { isClerkAPIResponseError } from "@clerk/nextjs/errors";
import Link from "next/link";
import { ElementRef, useEffect, useRef } from "react";

// import { toast } from "sonner";

export function NavbarMob({ className, ...props }: GenericProps) {
    const isMenuOpen = useNavbarStore((state) => state.isOpen);
    const setIsMenuOpen = useNavbarStore((state) => state.setIsOpen);

    const navContainerRef = useRef<ElementRef<"div"> | null>(null);
    const navListRef = useRef<ElementRef<"ul"> | null>(null);

    useEffect(() => {
        if (typeof document === "undefined") return;

        if (isMenuOpen) document.body.style.overflow = "hidden";
        else document.body.style.overflow = "auto";
    }, [isMenuOpen]);

    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (
                navContainerRef.current?.contains(event.target as Node) &&
                !navListRef.current?.contains(event.target as Node)
            ) {
                setIsMenuOpen(false);
            }
        }

        document.addEventListener("mousedown", handleClickOutside);

        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, [setIsMenuOpen]);

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
        <div
            aria-label="Mobile Menu"
            data-menu-open={isMenuOpen}
            className={cn(
                "fixed inset-x-0 z-40",
                "overflow-hidden",
                "transition-all duration-500 ease-in-out",
                "h-0 data-[menu-open=true]:h-screen",
                "-top-1/2 bottom-0 data-[menu-open=true]:top-0",
                "md:hidden",
                className
            )}
            ref={navContainerRef}
            {...props}
        >
            <ul
                className="mt-16 h-full bg-background px-4 py-3"
                ref={navListRef}
            >
                {siteConfig.menu.map((item, index) => {
                    const Icon = Icons[item.icon];

                    return (
                        <li
                            key={index}
                            className="border-b border-foreground/20"
                            aria-label="Mobile Menu Item"
                        >
                            <Link
                                href={item.href}
                                className="flex items-center justify-between gap-2 px-2 py-5"
                                target={item.isExternal ? "_blank" : "_self"}
                                onClick={() => setIsMenuOpen(false)}
                            >
                                <span>{item.name}</span>
                                <Icon className="size-5" />
                            </Link>
                        </li>
                    );
                })}
            </ul>
        </div>
    );
}
