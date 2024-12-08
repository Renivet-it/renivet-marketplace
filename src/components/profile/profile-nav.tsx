"use client";

import { cn, convertValueToLabel } from "@/lib/utils";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Icons } from "../icons";
import { Button } from "../ui/button-general";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Separator } from "../ui/separator";
import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
    SheetTrigger,
} from "../ui/sheet";

interface Item {
    icon: keyof typeof Icons;
    name: string;
    href: string;
}

const personalNavItems: Item[] = [
    {
        icon: "User",
        name: "general",
        href: "/",
    },
    {
        icon: "LockKeyhole",
        name: "security",
        href: "/security",
    },
    {
        icon: "Home",
        name: "addresses",
        href: "/addresses",
    },
];

const shoppingNavItems: Item[] = [
    {
        icon: "Heart",
        name: "wishlist",
        href: "/wishlist",
    },
    {
        icon: "ShoppingBag",
        name: "orders",
        href: "/orders",
    },
];

export function ProfileNav({ className, ...props }: GenericProps) {
    const pathname = usePathname();
    const activeSection = pathname.split("/").pop();

    return (
        <>
            <div
                className={cn(
                    "hidden w-full space-y-6 md:inline-block",
                    className
                )}
                {...props}
            >
                <Card className="rounded-none">
                    <CardHeader>
                        <CardTitle>Personal</CardTitle>
                    </CardHeader>

                    <Separator />

                    <CardContent className="p-0 py-2">
                        <div className="flex flex-col">
                            {personalNavItems.map((item) => {
                                const Icon = Icons[item.icon];

                                return (
                                    <Button
                                        key={item.name}
                                        variant={
                                            (activeSection === "profile" &&
                                                item.name === "general") ||
                                            activeSection === item.name
                                                ? "accent"
                                                : "ghost"
                                        }
                                        className="justify-start gap-2 rounded-none"
                                        asChild
                                    >
                                        <Link href={`/profile${item.href}`}>
                                            <Icon className="size-4" />
                                            {convertValueToLabel(item.name)}
                                        </Link>
                                    </Button>
                                );
                            })}
                        </div>
                    </CardContent>
                </Card>

                <Card className="rounded-none">
                    <CardHeader>
                        <CardTitle>Shopping</CardTitle>
                    </CardHeader>

                    <Separator />

                    <CardContent className="p-0 py-2">
                        <div className="flex flex-col">
                            {shoppingNavItems.map((item) => {
                                const Icon = Icons[item.icon];

                                return (
                                    <Button
                                        key={item.name}
                                        variant={
                                            (activeSection === "profile" &&
                                                item.name === "general") ||
                                            activeSection === item.name
                                                ? "accent"
                                                : "ghost"
                                        }
                                        className="justify-start gap-2 rounded-none"
                                        asChild
                                    >
                                        <Link href={`/profile${item.href}`}>
                                            <Icon className="size-4" />
                                            {convertValueToLabel(item.name)}
                                        </Link>
                                    </Button>
                                );
                            })}
                        </div>
                    </CardContent>
                </Card>
            </div>

            <Sheet>
                <SheetTrigger asChild className="md:hidden">
                    <Button>
                        <Icons.Settings2 />
                        <span>Open Menu</span>
                    </Button>
                </SheetTrigger>

                <SheetContent side="bottom" className="p-0 [&>button]:hidden">
                    <SheetHeader className="sr-only p-0">
                        <SheetTitle>Profile Navigation</SheetTitle>
                    </SheetHeader>

                    <div className="flex flex-col">
                        <div>
                            <h2 className="p-4 text-lg font-semibold">
                                Personal
                            </h2>

                            <ul>
                                {personalNavItems.map((item) => {
                                    const Icon = Icons[item.icon];

                                    return (
                                        <li key={item.name}>
                                            <Button
                                                variant={
                                                    (activeSection ===
                                                        "profile" &&
                                                        item.name ===
                                                            "general") ||
                                                    activeSection === item.name
                                                        ? "accent"
                                                        : "ghost"
                                                }
                                                className="w-full justify-start gap-2 rounded-none"
                                                asChild
                                            >
                                                <Link
                                                    href={`/profile${item.href}`}
                                                >
                                                    <Icon className="size-4" />
                                                    {convertValueToLabel(
                                                        item.name
                                                    )}
                                                </Link>
                                            </Button>
                                        </li>
                                    );
                                })}
                            </ul>
                        </div>

                        <Separator className="mt-2" />

                        <div>
                            <h2 className="p-4 text-lg font-semibold">
                                Shopping
                            </h2>

                            <ul>
                                {shoppingNavItems.map((item) => {
                                    const Icon = Icons[item.icon];

                                    return (
                                        <li key={item.name}>
                                            <Button
                                                variant={
                                                    activeSection === item.name
                                                        ? "accent"
                                                        : "ghost"
                                                }
                                                className="w-full justify-start gap-2 rounded-none"
                                                asChild
                                            >
                                                <Link
                                                    href={`/profile${item.href}`}
                                                >
                                                    <Icon className="size-4" />
                                                    {convertValueToLabel(
                                                        item.name
                                                    )}
                                                </Link>
                                            </Button>
                                        </li>
                                    );
                                })}
                            </ul>
                        </div>

                        <Separator className="mt-2" />
                    </div>
                </SheetContent>
            </Sheet>
        </>
    );
}
