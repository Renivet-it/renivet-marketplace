"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
    LineChart,
    Line,
    BarChart,
    Bar,
    PieChart,
    Pie,
    Cell,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ResponsiveContainer,
} from "recharts";

interface AnalyticsChartsProps {
    brandId: string;
}

// Static mock data
const MOCK_MONTHLY_SALES = [
    { month: "Jan", sales: 45200, orders: 156 },
    { month: "Feb", sales: 52100, orders: 189 },
    { month: "Mar", sales: 48900, orders: 172 },
    { month: "Apr", sales: 61300, orders: 215 },
    { month: "May", sales: 58700, orders: 198 },
    { month: "Jun", sales: 72400, orders: 243 },
    { month: "Jul", sales: 68900, orders: 231 },
    { month: "Aug", sales: 79200, orders: 267 },
    { month: "Sep", sales: 75600, orders: 254 },
    { month: "Oct", sales: 82300, orders: 278 },
    { month: "Nov", sales: 88500, orders: 295 },
    { month: "Dec", sales: 95800, orders: 312 },
];

const MOCK_TOP_PRODUCTS = [
    { name: "Premium Sneakers", sales: 28500, orders: 142 },
    { name: "Designer T-Shirt", sales: 24300, orders: 187 },
    { name: "Leather Jacket", sales: 21800, orders: 89 },
    { name: "Denim Jeans", sales: 19200, orders: 156 },
    { name: "Sports Watch", sales: 17600, orders: 94 },
];

const MOCK_ORDER_STATUS = [
    { status: "Delivered", count: 847 },
    { status: "Processing", count: 156 },
    { status: "Shipped", count: 123 },
    { status: "Pending", count: 89 },
    { status: "Cancelled", count: 23 },
    { status: "Returned", count: 35 },
];

const STATUS_COLORS = {
    pending: "#fbbf24",
    processing: "#60a5fa",
    shipped: "#a78bfa",
    delivered: "#34d399",
    cancelled: "#f87171",
    returned: "#fb923c",
};

export function AnalyticsCharts({ brandId }: AnalyticsChartsProps) {
    const monthlySales = MOCK_MONTHLY_SALES;
    const topProducts = MOCK_TOP_PRODUCTS;
    const orderStatus = MOCK_ORDER_STATUS;

    return (
        <div className="grid gap-4 md:grid-cols-2">
            {/* Monthly Sales Trend */}
            <Card className="md:col-span-2">
                <CardHeader>
                    <CardTitle>Monthly Sales Trend</CardTitle>
                    <p className="text-sm text-muted-foreground">
                        Revenue and order volume over the last 12 months
                    </p>
                </CardHeader>
                <CardContent>
                    <ResponsiveContainer width="100%" height={350}>
                        <LineChart data={monthlySales}>
                            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                            <XAxis
                                dataKey="month"
                                className="text-xs"
                                tick={{ fill: "currentColor" }}
                            />
                            <YAxis
                                yAxisId="left"
                                className="text-xs"
                                tick={{ fill: "currentColor" }}
                            />
                            <YAxis
                                yAxisId="right"
                                orientation="right"
                                className="text-xs"
                                tick={{ fill: "currentColor" }}
                            />
                            <Tooltip
                                contentStyle={{
                                    backgroundColor: "hsl(var(--background))",
                                    border: "1px solid hsl(var(--border))",
                                    borderRadius: "6px"
                                }}
                            />
                            <Legend />
                            <Line
                                yAxisId="left"
                                type="monotone"
                                dataKey="sales"
                                stroke="hsl(var(--primary))"
                                strokeWidth={2}
                                name="Sales ($)"
                                dot={{ fill: "hsl(var(--primary))" }}
                            />
                            <Line
                                yAxisId="right"
                                type="monotone"
                                dataKey="orders"
                                stroke="#10b981"
                                strokeWidth={2}
                                name="Orders"
                                dot={{ fill: "#10b981" }}
                            />
                        </LineChart>
                    </ResponsiveContainer>
                </CardContent>
            </Card>

            {/* Best Selling Products */}
            <Card>
                <CardHeader>
                    <CardTitle>Best-Selling Products</CardTitle>
                    <p className="text-sm text-muted-foreground">
                        Top 5 products by sales volume
                    </p>
                </CardHeader>
                <CardContent>
                    <ResponsiveContainer width="100%" height={350}>
                        <BarChart data={topProducts} layout="horizontal">
                            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                            <XAxis type="number" className="text-xs" tick={{ fill: "currentColor" }} />
                            <YAxis
                                dataKey="name"
                                type="category"
                                width={120}
                                className="text-xs"
                                tick={{ fill: "currentColor" }}
                            />
                            <Tooltip
                                contentStyle={{
                                    backgroundColor: "hsl(var(--background))",
                                    border: "1px solid hsl(var(--border))",
                                    borderRadius: "6px"
                                }}
                            />
                            <Bar
                                dataKey="sales"
                                fill="hsl(var(--primary))"
                                radius={[0, 4, 4, 0]}
                                name="Sales ($)"
                            />
                        </BarChart>
                    </ResponsiveContainer>
                </CardContent>
            </Card>

            {/* Order Status Distribution */}
            <Card>
                <CardHeader>
                    <CardTitle>Order Status Distribution</CardTitle>
                    <p className="text-sm text-muted-foreground">
                        Current breakdown of order statuses
                    </p>
                </CardHeader>
                <CardContent>
                    <ResponsiveContainer width="100%" height={350}>
                        <PieChart>
                            <Pie
                                data={orderStatus}
                                cx="50%"
                                cy="50%"
                                labelLine={false}
                                label={({ status, percent }) =>
                                    `${status}: ${(percent * 100).toFixed(0)}%`
                                }
                                outerRadius={100}
                                fill="hsl(var(--primary))"
                                dataKey="count"
                            >
                                {orderStatus.map((entry, index) => (
                                    <Cell
                                        key={`cell-${index}`}
                                        fill={STATUS_COLORS[entry.status.toLowerCase() as keyof typeof STATUS_COLORS] || "#8b5cf6"}
                                    />
                                ))}
                            </Pie>
                            <Tooltip
                                contentStyle={{
                                    backgroundColor: "hsl(var(--background))",
                                    border: "1px solid hsl(var(--border))",
                                    borderRadius: "6px"
                                }}
                            />
                            <Legend />
                        </PieChart>
                    </ResponsiveContainer>
                </CardContent>
            </Card>
        </div>
    );
}