"use client";

import { Icons } from "@/components/icons";
import { Renivet } from "@/components/svgs";
import { Button } from "@/components/ui/button-general";
import { siteConfig } from "@/config/site";
import { cn } from "@/lib/utils";
import Link from "next/link";

export function Footer({ className, ...props }: GenericProps) {
    return (
        <footer
            className={cn(
                "flex justify-center bg-primary text-primary-foreground",
                className
            )}
            {...props}
        >
            <div className="flex w-full max-w-5xl flex-col items-center justify-between xl:max-w-[100rem]">
                <div className="flex w-full flex-col items-center justify-between lg:flex-row lg:items-start">
                    <div className="w-full space-y-6 p-10 px-5 md:p-10 lg:basis-1/3 lg:p-20">
                        <Link href="/" className="flex items-center gap-2">
                            <Renivet className="size-8" />

                            <h1 className="text-4xl font-bold">
                                {siteConfig.name}
                            </h1>
                        </Link>

                        <p className="text-primary-foreground/80">
                            {siteConfig.description}
                        </p>

                        <Button
                            variant="outline"
                            className="min-w-40 border-background bg-transparent font-semibold hover:bg-background hover:text-black"
                            size="lg"
                            asChild
                        >
                            <Link href="/">
                                <span>Get Started</span>
                                <Icons.ArrowRight />
                            </Link>
                        </Button>
                    </div>

                    <div className="mx-5 h-px self-stretch bg-background lg:mx-0 lg:h-auto lg:w-px" />

                    <div className="grid w-full basis-2/3 grid-cols-2 gap-5 p-10 px-5 md:grid-cols-3 md:p-10 lg:p-20">
                        {siteConfig.footer.menu.map((category, i) => (
                            <div key={i} className="space-y-3 lg:space-y-6">
                                <h2 className="text-lg font-semibold uppercase lg:text-2xl">
                                    {category.name}
                                </h2>

                                <ul className="space-y-1 lg:space-y-3">
                                    {category.items.map((item, i) => (
                                        <li key={i}>
                                            <Link
                                                href={item.href}
                                                target={
                                                    item.isExternal
                                                        ? "_blank"
                                                        : "_self"
                                                }
                                                className="w-full text-sm text-primary-foreground/80 transition-all ease-in-out hover:text-primary-foreground md:text-base"
                                            >
                                                {item.name}
                                            </Link>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="self-stretch px-5 md:mx-0">
                    <div className="h-px w-full self-stretch bg-background" />
                </div>

                <div className="flex w-full flex-col items-center justify-center gap-1 p-5 text-sm text-primary-foreground/80 md:flex-row">
                    <p>
                        Copyright &copy; {new Date().getFullYear()}{" "}
                        {siteConfig.name}
                    </p>

                    <span className="hidden md:inline-block">|</span>

                    <p>All Rights Reserved</p>

                    <span className="hidden md:inline-block">|</span>

                    <div className="flex items-center gap-1">
                        <Link
                            href="/terms"
                            className="underline underline-offset-2"
                        >
                            Terms and Conditions
                        </Link>

                        <span>|</span>

                        <Link
                            href="/privacy"
                            className="underline underline-offset-2"
                        >
                            Privacy Policy
                        </Link>
                    </div>
                </div>
            </div>
        </footer>
    );
}
