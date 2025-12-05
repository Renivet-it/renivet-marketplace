"use client";

import { useState } from "react";
import { trpc } from "@/lib/trpc/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Icons } from "@/components/icons";

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

    if (isLoading || !data)
        return <p className="text-sm text-muted-foreground">Loading analytics...</p>;

    const cards = [
        {
            title: "Total Orders",
            value: data.totalOrders.toLocaleString(),
            icon: Icons.ShoppingCart,
        },
        {
            title: "Total Revenue",
            value: `₹${data.totalRevenue.toLocaleString()}`,
            icon: Icons.DollarSign,
        },
        {
            title: "Return Count",
            value: `${data.returnRate}`,
            icon: Icons.TrendingDown,
            isNegativeGood: true,
        },
        {
            title: "Active Products",
            value: data.activeProducts.toLocaleString(),
            icon: Icons.Package,
        },
    ];

    return (
        <div className="space-y-4">
            {/* Filter */}
            <div className="flex justify-end">
                <select
                    className="border rounded-md p-2 text-sm"
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

            {/* Cards */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                {cards.map((card) => {
                    const Icon = card.icon;

                    return (
                        <Card key={card.title}>
                            <CardHeader className="flex flex-row items-center justify-between pb-2">
                                <CardTitle className="text-sm">{card.title}</CardTitle>
                                <Icon className="h-4 w-4 text-muted-foreground" />
                            </CardHeader>

                            <CardContent>
                                <div className="text-2xl font-bold">{card.value}</div>
                            </CardContent>
                        </Card>
                    );
                })}
            </div>
        </div>
    );
}
