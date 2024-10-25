"use client";

import { cn } from "@/lib/utils";
import Image from "next/image";
import { Renivet } from "../svgs";
import { Button } from "../ui/button";

export function Landing({ className, ...props }: GenericProps) {
    return (
        <section className={cn("", className)} {...props}>
            <div className="relative h-full min-h-[40rem]">
                <div className="overflow-hidden">
                    <Image
                        src="/home/landing/landing_1.png"
                        alt="Landing 1"
                        height={2000}
                        width={2000}
                        className="size-full object-cover"
                    />
                </div>

                <div className="absolute left-[20%] top-0 flex h-full flex-col items-center justify-center gap-10 bg-accent p-10 px-28 text-accent-foreground">
                    <div>
                        <Renivet />
                    </div>

                    <div className="space-y-5 text-center">
                        <p>Handcrafted in Viet Nam since 1650</p>
                        <h1 className="text-4xl">
                            BAT TRANG
                            <br />
                            DINNER SET
                        </h1>
                    </div>

                    <div className="w-full">
                        <Button className="w-full rounded-none bg-background font-semibold uppercase text-accent">
                            Shop Now
                        </Button>
                    </div>
                </div>
            </div>
        </section>
    );
}
