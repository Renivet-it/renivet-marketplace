"use client";

import {
    Breadcrumb,
    BreadcrumbItem,
    BreadcrumbLink,
    BreadcrumbList,
    BreadcrumbPage,
    BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { cn, convertValueToLabel } from "@/lib/utils";
import { usePathname } from "next/navigation";
import React from "react";

export function SidebarInset({ className, ...props }: GenericProps) {
    const pathname = usePathname();
    const segments = pathname.split("/").filter(Boolean);

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
                                    href={`/${segments.slice(0, index + 1).join("/")}`}
                                >
                                    {convertValueToLabel(segment)}
                                </BreadcrumbLink>
                            )}
                        </BreadcrumbItem>
                    </React.Fragment>
                ))}
            </BreadcrumbList>
        </Breadcrumb>
    );
}
