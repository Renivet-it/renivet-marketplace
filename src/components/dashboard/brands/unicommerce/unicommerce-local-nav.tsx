"use client";

import { cn } from "@/lib/utils";
import Link from "next/link";
import { usePathname } from "next/navigation";

interface UnicommerceLocalNavProps {
    brandId: string;
}

const getLinks = (brandId: string) => [
    {
        label: "Settings",
        href: `/dashboard/brands/${brandId}/unicommerce`,
    },
    {
        label: "Authentication",
        href: `/dashboard/brands/${brandId}/unicommerce/authentication`,
    },
    {
        label: "Inventory",
        href: `/dashboard/brands/${brandId}/unicommerce/inventory`,
    },
    {
        label: "Orders",
        href: `/dashboard/brands/${brandId}/unicommerce/orders`,
    },
    {
        label: "Returns",
        href: `/dashboard/brands/${brandId}/unicommerce/returns`,
    },
    {
        label: "Catalog",
        href: `/dashboard/brands/${brandId}/unicommerce/catalog`,
    },
    {
        label: "API Explorer",
        href: `/dashboard/brands/${brandId}/unicommerce/api-explorer`,
    },
    {
        label: "Response Logs",
        href: `/dashboard/brands/${brandId}/unicommerce/logs`,
    },
];

export function UnicommerceLocalNav({ brandId }: UnicommerceLocalNavProps) {
    const pathname = usePathname();
    const links = getLinks(brandId);

    return (
        <aside className="rounded-xl border bg-card p-3">
            <p className="px-2 pb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Unicommerce
            </p>
            <nav className="space-y-1">
                {links.map((link) => {
                    const isRootSettings = link.href.endsWith("/unicommerce");
                    const isActive = isRootSettings
                        ? pathname === link.href
                        : pathname === link.href || pathname.startsWith(`${link.href}/`);

                    return (
                        <Link
                            key={link.href}
                            href={link.href}
                            className={cn(
                                "block rounded-lg px-3 py-2 text-sm transition-colors",
                                isActive
                                    ? "bg-primary text-primary-foreground"
                                    : "text-foreground/80 hover:bg-muted hover:text-foreground"
                            )}
                        >
                            {link.label}
                        </Link>
                    );
                })}
            </nav>
        </aside>
    );
}

