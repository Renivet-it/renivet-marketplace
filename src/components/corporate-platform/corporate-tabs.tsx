"use client";

import { Icons } from "@/components/icons";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { usePathname } from "next/navigation";

const corporateTabs = [
    {
        name: "Command Center",
        href: "/dashboard/general/corporate",
        icon: "LayoutDashboard" as const,
    },
    {
        name: "Requests (RFQs)",
        href: "/dashboard/general/corporate/rfqs",
        icon: "ClipboardList" as const,
    },
    {
        name: "Finance & POs",
        href: "/dashboard/general/corporate/finance",
        icon: "CreditCard" as const,
    },
    {
        name: "Task Control",
        href: "/dashboard/general/corporate/tasks",
        icon: "FileText" as const,
    },
    {
        name: "Reports",
        href: "/dashboard/general/corporate/reports",
        icon: "ChartNoAxesColumn" as const,
    },
    {
        name: "Executive View",
        href: "/dashboard/general/corporate/executive",
        icon: "Users" as const,
    },
];

export function CorporateTabs() {
    const pathname = usePathname();

    return (
        <div className="w-full overflow-hidden">
            <div className="no-scrollbar flex items-center gap-1 overflow-x-auto rounded-2xl border border-slate-200 bg-white/80 p-1 shadow-sm backdrop-blur-md">
                {corporateTabs.map((tab) => {
                    const isActive = pathname === tab.href;
                    const IconComponent = Icons[tab.icon];

                    return (
                        <Link
                            key={tab.href}
                            href={tab.href}
                            className={cn(
                                "flex shrink-0 items-center gap-2 px-3 py-2 text-xs font-medium transition-all duration-200",
                                isActive
                                    ? "rounded-xl bg-slate-900 font-semibold text-white shadow-sm"
                                    : "rounded-xl text-slate-600 hover:bg-slate-100/80 hover:text-slate-950"
                            )}
                        >
                            {IconComponent && (
                                <IconComponent
                                    className={cn(
                                        "size-3.5 transition-transform duration-200",
                                        isActive
                                            ? "scale-110 text-white"
                                            : "text-slate-500 group-hover:text-slate-900"
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
