import {
    Breadcrumb,
    BreadcrumbItem,
    BreadcrumbLink,
    BreadcrumbList,
    BreadcrumbPage,
    BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { cn, getAbsoluteURL } from "@/lib/utils";
import Link from "next/link";
import { Fragment } from "react";

type BreadcrumbSegment = {
    label: string;
    href?: string;
};

interface StorefrontBreadcrumbsProps {
    items: BreadcrumbSegment[];
    className?: string;
}

export function buildBreadcrumbJsonLd(items: BreadcrumbSegment[]) {
    return {
        "@context": "https://schema.org",
        "@type": "BreadcrumbList",
        itemListElement: items.map((item, index) => ({
            "@type": "ListItem",
            position: index + 1,
            name: item.label,
            item: getAbsoluteURL(item.href ?? "/"),
        })),
    };
}

export function StorefrontBreadcrumbs({
    items,
    className,
}: StorefrontBreadcrumbsProps) {
    if (items.length <= 1) return null;

    return (
        <div
            className={cn(
                "overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden",
                className
            )}
        >
            <Breadcrumb>
                <BreadcrumbList className="w-max min-w-full flex-nowrap gap-1 text-[11px] uppercase tracking-[0.12em] text-[#6c7566] sm:text-xs">
                    {items.map((item, index) => {
                        const isLast = index === items.length - 1;

                        return (
                            <Fragment key={`${item.label}-${index}`}>
                                <BreadcrumbItem className="shrink-0">
                                    {isLast || !item.href ? (
                                        <BreadcrumbPage className="truncate text-[#25321d]">
                                            {item.label}
                                        </BreadcrumbPage>
                                    ) : (
                                        <BreadcrumbLink
                                            asChild
                                            className="truncate hover:text-[#25321d]"
                                        >
                                            <Link href={item.href}>{item.label}</Link>
                                        </BreadcrumbLink>
                                    )}
                                </BreadcrumbItem>
                                {!isLast && (
                                    <BreadcrumbSeparator className="shrink-0 text-[#a8b19f]" />
                                )}
                            </Fragment>
                        );
                    })}
                </BreadcrumbList>
            </Breadcrumb>
        </div>
    );
}
