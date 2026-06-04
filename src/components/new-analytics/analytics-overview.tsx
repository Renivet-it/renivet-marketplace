"use client";

import { Icons } from "@/components/icons";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { trpc } from "@/lib/trpc/client";
import { useState } from "react";

interface AnalyticsOverviewProps {
    brandId: string;
}

const FILTERS = [
    { label: "7 Days", value: 7 },
    { label: "30 Days", value: 30 },
    { label: "3 Months", value: 90 },
    { label: "6 Months", value: 180 },
    { label: "9 Months", value: 270 },
    { label: "1 Year", value: 365 },
];

export function AnalyticsOverview({ brandId }: AnalyticsOverviewProps) {
    const [days, setDays] = useState(30);

    const { data, isLoading } = trpc.brands.analytics.getOverview.useQuery({
        brandId,
        nDays: days,
    });

    if (isLoading || !data) {
        return (
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                {[...Array(8)].map((_, i) => (
                    <Card key={i} className="h-28 animate-pulse bg-card/80" />
                ))}
            </div>
        );
    }

    const cards = [
        {
            title: "New Orders",
            value: data.newOrders.toLocaleString(),
            icon: Icons.PlusCircle,
            tone: "text-blue-600",
            bg: "bg-blue-50",
        },
        {
            title: "Pickup Scheduled",
            value: data.pickupScheduled.toLocaleString(),
            icon: Icons.Calendar,
            tone: "text-violet-600",
            bg: "bg-violet-50",
        },
        {
            title: "In Transit",
            value: data.inTransit.toLocaleString(),
            icon: Icons.Truck,
            tone: "text-amber-600",
            bg: "bg-amber-50",
        },
        {
            title: "Delivered",
            value: data.delivered.toLocaleString(),
            icon: Icons.CheckCircle,
            tone: "text-emerald-600",
            bg: "bg-emerald-50",
        },
        {
            title: "Total Orders",
            value: data.totalOrders.toLocaleString(),
            icon: Icons.ShoppingCart,
            tone: "text-slate-600",
            bg: "bg-slate-50",
        },
        {
            title: "Total Revenue",
            value: `\u20b9${data.totalRevenue.toLocaleString()}`,
            symbol: "\u20b9",
            tone: "text-emerald-600",
            bg: "bg-emerald-50",
        },
        {
            title: "Return Count",
            value: data.returnRate.toLocaleString(),
            icon: Icons.TrendingDown,
            tone: "text-rose-600",
            bg: "bg-rose-50",
        },
        {
            title: "Active Products",
            value: data.activeProducts.toLocaleString(),
            icon: Icons.Package,
            tone: "text-sky-600",
            bg: "bg-sky-50",
        },
    ];

    return (
        <div className="space-y-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h2 className="text-lg font-semibold text-foreground">
                        Performance Snapshot
                    </h2>
                    <p className="text-sm text-muted-foreground">
                        Orders and activity for the selected period
                    </p>
                </div>

                <select
                    className="h-10 rounded-lg border border-border bg-card px-3 text-sm shadow-sm"
                    value={days}
                    onChange={(e) => setDays(Number(e.target.value))}
                >
                    {FILTERS.map((f) => (
                        <option key={f.value} value={f.value}>
                            {f.label}
                        </option>
                    ))}
                </select>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                {cards.map((card) => {
                    const Icon = "icon" in card ? card.icon : null;

                    return (
                        <Card
                            key={card.title}
                            className="overflow-hidden border-border/70 bg-card/95 shadow-sm"
                        >
                            <CardHeader className="flex flex-row items-start justify-between gap-4 pb-2">
                                <CardTitle className="text-sm font-medium text-muted-foreground">
                                    {card.title}
                                </CardTitle>
                                <span
                                    className={`flex size-9 shrink-0 items-center justify-center rounded-lg ${card.bg}`}
                                >
                                    {Icon ? (
                                        <Icon
                                            className={`size-4 ${card.tone}`}
                                        />
                                    ) : (
                                        <span
                                            className={`text-lg font-semibold leading-none ${card.tone}`}
                                        >
                                            {card.symbol}
                                        </span>
                                    )}
                                </span>
                            </CardHeader>

                            <CardContent>
                                <div className="text-3xl font-semibold tracking-tight text-foreground">
                                    {card.value}
                                </div>
                            </CardContent>
                        </Card>
                    );
                })}
            </div>
        </div>
    );
}
