"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Icons } from "@/components/icons";

interface AnalyticsOverviewProps {
    brandId: string;
}

// Static mock data
const MOCK_DATA = {
    totalOrders: 1247,
    totalRevenue: 89650,
    returnRate: 2.8,
    activeProducts: 156,
    ordersChange: 12.5,
    revenueChange: 18.3,
    returnChange: -5.2,
    productsChange: 8.0,
};

export function AnalyticsOverview({ brandId }: AnalyticsOverviewProps) {
    const data = MOCK_DATA;

    const cards = [
        {
            title: "Total Orders",
            value: data.totalOrders.toLocaleString(),
            change: data.ordersChange,
            icon: Icons.ShoppingCart,
            description: "from last month",
        },
        {
            title: "Total Revenue",
            value: `$${data.totalRevenue.toLocaleString()}`,
            change: data.revenueChange,
            icon: Icons.DollarSign,
            description: "from last month",
        },
        {
            title: "Return Rate",
            value: `${data.returnRate.toFixed(1)}%`,
            change: data.returnChange,
            icon: Icons.TrendingDown,
            description: "from last month",
            isNegativeGood: true,
        },
        {
            title: "Active Products",
            value: data.activeProducts.toLocaleString(),
            change: data.productsChange,
            icon: Icons.Package,
            description: "from last month",
        },
    ];

    return (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {cards.map((card) => {
                const Icon = card.icon;
                const isPositive = card.isNegativeGood 
                    ? card.change < 0 
                    : card.change > 0;
                const changeColor = isPositive 
                    ? "text-green-600 dark:text-green-400" 
                    : "text-red-600 dark:text-red-400";

                return (
                    <Card key={card.title}>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">
                                {card.title}
                            </CardTitle>
                            <Icon className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{card.value}</div>
                            <p className="text-xs text-muted-foreground mt-1">
                                <span className={changeColor}>
                                    {card.change > 0 ? "+" : ""}
                                    {card.change.toFixed(1)}%
                                </span>{" "}
                                {card.description}
                            </p>
                        </CardContent>
                    </Card>
                );
            })}
        </div>
    );
}