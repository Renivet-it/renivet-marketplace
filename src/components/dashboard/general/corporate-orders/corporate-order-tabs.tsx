"use client";

import { Icons } from "@/components/icons";
import { BitFieldSitePermission } from "@/config/permissions";
import { trpc } from "@/lib/trpc/client";
import { cn, getUserPermissions, hasPermission } from "@/lib/utils";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useMemo } from "react";

export function CorporateOrderTabs() {
    const pathname = usePathname();
    const { data: user } = trpc.general.users.currentUser.useQuery();

    const hasSettingsPermission = useMemo(() => {
        if (!user) return false;
        const perms = getUserPermissions(user.roles);
        return hasPermission(perms.sitePermissions, [BitFieldSitePermission.MANAGE_SETTINGS]);
    }, [user]);

    const tabs = useMemo(() => {
        const list = [
            {
                name: "Active Orders",
                href: "/dashboard/general/corporate-orders",
                icon: "Package" as const,
            },
            {
                name: "Replacement Requests",
                href: "/dashboard/general/corporate-orders/replacements",
                icon: "RefreshCcw" as const,
            },
        ];

        if (hasSettingsPermission) {
            list.push({
                name: "Pricing & Settings",
                href: "/dashboard/general/corporate-orders/settings",
                icon: "Settings2" as const,
            });
        }

        return list;
    }, [hasSettingsPermission]);

    return (
        <div className="w-full overflow-hidden">
            <div className="flex items-center gap-1 overflow-x-auto rounded-[20px] border border-slate-200 bg-white/80 p-1.5 shadow-sm backdrop-blur-md no-scrollbar">
                {tabs.map((tab) => {
                    const isActive = pathname === tab.href;
                    const IconComponent = Icons[tab.icon];

                    return (
                        <Link
                            key={tab.href}
                            href={tab.href}
                            className={cn(
                                "flex items-center gap-2.5 px-4 py-2.5 text-sm font-medium transition-all duration-200 shrink-0",
                                isActive
                                    ? "rounded-[14px] bg-slate-900 text-white shadow-sm font-semibold"
                                    : "rounded-[14px] text-slate-600 hover:bg-slate-100/80 hover:text-slate-950"
                            )}
                        >
                            {IconComponent && (
                                <IconComponent
                                    className={cn(
                                        "size-4 transition-transform duration-200",
                                        isActive ? "text-white scale-110" : "text-slate-500 group-hover:text-slate-900"
                                    )}
                                />
                            )}
                            <span>{tab.name}</span>
                        </Link>
                    );
                })}
            </div>
        </div>
    );
}
