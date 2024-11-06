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

const navItems: Item[] = [
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
            <Card
                className={cn(
                    "hidden w-full rounded-none md:inline-block",
                    className
                )}
                {...props}
            >
                <CardHeader>
                    <CardTitle>Personal</CardTitle>
                </CardHeader>

                <Separator />

                <CardContent className="p-0 py-2">
                    <div className="flex flex-col">
                        {navItems.map((item) => {
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

            <Sheet>
                <SheetTrigger asChild className="md:hidden">
                    <Button>
                        <Icons.Settings2 />
                        <span>Open Menu</span>
                    </Button>
                </SheetTrigger>

                <SheetContent side="bottom" className="p-0 [&>button]:hidden">
                    <SheetHeader className="p-4 text-start">
                        <SheetTitle>Personal</SheetTitle>
                    </SheetHeader>

                    <div className="flex flex-col">
                        {navItems.map((item) => {
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
                </SheetContent>
            </Sheet>
        </>
    );
}
