"use client";

import { Icons } from "@/components/icons";
import { Renivet } from "@/components/svgs";
import { Separator } from "@/components/ui/separator";
import { siteConfig } from "@/config/site";
import { cn } from "@/lib/utils";
import Image from "next/image";
import Link from "next/link";

export function ContactHeading({ className, ...props }: GenericProps) {
    return (
        <section className={cn("", className)} {...props}>
            <div className="flex w-full flex-col items-center justify-center overflow-hidden text-primary-foreground md:relative md:max-h-[60vh]">
                <Image
                    src="https://picsum.photos/seed/556/1920/1080"
                    alt="Landing"
                    height={2000}
                    width={2000}
                    priority
                    className="aspect-square size-full object-cover md:aspect-auto"
                />

                <div className="flex aspect-square w-full flex-col items-center justify-center gap-4 bg-primary p-20 px-16 md:absolute md:left-[10%] md:aspect-auto md:h-full md:w-auto md:gap-10 xl:p-28">
                    <div>
                        <Renivet className="size-10" />
                    </div>

                    <h1 className="text-3xl font-semibold uppercase md:text-4xl">
                        Contact Us
                    </h1>

                    <Separator />

                    <div className="space-y-5 text-center">
                        <p className="text-xs md:text-sm">
                            Follow us on Social Media
                        </p>

                        <div className="flex items-center gap-4">
                            {Object.entries(siteConfig.links!).map(
                                ([key, value]) => {
                                    const Icon =
                                        Icons[key as keyof typeof Icons];

                                    return (
                                        <Link
                                            href={value}
                                            key={key}
                                            className="aspect-square bg-secondary p-2 text-secondary-foreground"
                                        >
                                            <Icon className="size-3 md:size-4" />
                                        </Link>
                                    );
                                }
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}
