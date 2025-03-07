"use client";

import {
    Breadcrumb,
    BreadcrumbItem,
    BreadcrumbLink,
    BreadcrumbList,
    BreadcrumbPage,
    BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { trpc } from "@/lib/trpc/client";
import { cn, convertValueToLabel, isValidUUID } from "@/lib/utils";
import Link from "next/link";
import { usePathname } from "next/navigation";
import React from "react";

export function SidebarInset({ className, ...props }: GenericProps) {
    const pathname = usePathname();
    const segments = pathname.split("/").filter(Boolean);

    const { data: brand } = trpc.general.brands.getBrand.useQuery(
        { id: segments[2] },
        {
            enabled:
                segments.length >= 2 &&
                segments[1] === "brands" &&
                isValidUUID(segments[2]),
        }
    );

    return (
        <Breadcrumb className={cn("", className)} {...props}>
            <BreadcrumbList>
                {segments.map((segment, index) => (
                    <React.Fragment key={segment}>
                        {index > 0 && (
                            <BreadcrumbSeparator className="hidden md:block" />
                        )}

                        <BreadcrumbItem>
                            {index === segments.length - 1 ? (
                                <BreadcrumbPage>
                                    {convertValueToLabel(segment)}
                                </BreadcrumbPage>
                            ) : (
                                <BreadcrumbLink
                                    className="hidden md:block"
                                    asChild
                                >
                                    <Link
                                        href={`/${segments.slice(0, index + 1).join("/")}`}
                                    >
                                        {index === 2 &&
                                        segments[1] === "brands" &&
                                        brand
                                            ? brand.name
                                            : convertValueToLabel(segment)}
                                    </Link>
                                </BreadcrumbLink>
                            )}
                        </BreadcrumbItem>
                    </React.Fragment>
                ))}
            </BreadcrumbList>
        </Breadcrumb>
    );
}
