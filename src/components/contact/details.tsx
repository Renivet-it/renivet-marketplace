"use client";

import { siteConfig } from "@/config/site";
import { cn, convertValueToLabel } from "@/lib/utils";
import Link from "next/link";

export function ContactDetails({ className, ...props }: GenericProps) {
    return (
        <div
            className={cn(
                "flex flex-col items-center gap-5 md:gap-10",
                className
            )}
            {...props}
        >
            <div className="space-y-2 text-center md:space-y-4">
                <h2 className="text-balance text-3xl font-bold uppercase md:text-4xl">
                    Get in touch with us
                </h2>
            </div>

            <div className="space-y-2 text-center md:space-y-5">
                {Object.entries(siteConfig.contact).map(([key, value]) => (
                    <div key={key} className="space-y-1">
                        <p className="font-semibold">
                            {convertValueToLabel(key)}:
                        </p>

                        <p className="max-w-sm text-sm text-accent">
                            {key === "email" ? (
                                <Link href={`mailto:${value}`}>{value}</Link>
                            ) : (
                                value
                            )}
                        </p>
                    </div>
                ))}
            </div>
        </div>
    );
}
