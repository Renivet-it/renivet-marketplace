"use client";

import { cn } from "@/lib/utils";
import Image from "next/image";

interface AboutHeroProps {
    className?: string;
}

export function AboutHero({ className }: AboutHeroProps) {
    return (
        <section
            className={cn(
                "relative h-[70vh] min-h-[500px] w-full overflow-hidden md:h-[90vh]",
                className
            )}
        >
            <Image
                src="https://4o4vm2cu6g.ufs.sh/f/HtysHtJpctzNda9wjnb4imNMJ6l9SbIRxWLcDyX3vTqk2UVG"
                alt="About Hero"
                fill
                priority
                className="object-cover"
            />
        </section>
    );
}
