"use client";

import { cn, convertValueToLabel } from "@/lib/utils";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Icons } from "../icons";
import { Button } from "../ui/button-general";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Separator } from "../ui/separator";

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
        icon: "Key",
        name: "password",
        href: "/password",
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
        <Card className={cn("w-full rounded-none", className)} {...props}>
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
    );
}
