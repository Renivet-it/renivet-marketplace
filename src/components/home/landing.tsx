"use client";

import { cn } from "@/lib/utils";
import Image from "next/image";

export function Landing({ className, ...props }: GenericProps) {
    return (
        <section className={cn("", className)} {...props}>
            <div className="relative flex min-h-[50vh] w-full items-center justify-center overflow-hidden md:min-h-[70vh]">
                <Image
                    src="/images/landing1.webp"
                    alt="Landing"
                    priority
                    layout="fill"
                    objectFit="cover"
                    className="opacity-90"
                />
            </div>
        </section>
    );
}
