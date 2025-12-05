"use client";

import { useState } from "react";
import { trpc } from "@/lib/trpc/client";

import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
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

const FILTERS = [
    { label: "7 Days", value: 7 },
    { label: "30 Days", value: 30 },
    { label: "3 Months", value: 90 },
    { label: "6 Months", value: 180 },
    { label: "9 Months", value: 270 },
    { label: "1 Year", value: 365 },
];

const STATUS_COLORS: Record<string, string> = {
    pending: "#fbbf24",
    processing: "#60a5fa",
    shipped: "#a78bfa",
    delivered: "#34d399",
    cancelled: "#f87171",
    returned: "#fb923c",
};

interface AnalyticsChartsProps {
    brandId: string;
}

export function AnalyticsCharts({ brandId }: AnalyticsChartsProps) {
    const [days, setDays] = useState(30);

    const { data: monthlySales } = trpc.brands.analytics.getMonthlySales.useQuery({
        brandId,
    });

    const { data: topProducts } = trpc.brands.analytics.getTopProducts.useQuery({
        brandId,
        limit: 5,
    });

    const { data: statusBreakdown } =
        trpc.brands.analytics.getStatusBreakdown.useQuery({
            brandId,
        });

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

            <div className="grid gap-4 md:grid-cols-2">
                {/* Monthly Sales */}
                <Card className="md:col-span-2">
                    <CardHeader>
                        <CardTitle>Monthly Sales Trend</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <ResponsiveContainer width="100%" height={350}>
                            <LineChart data={monthlySales ?? []}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="month" />
                                <YAxis yAxisId="left" />
                                <YAxis yAxisId="right" orientation="right" />
                                <Tooltip />
                                <Legend />
                                <Line
                                    yAxisId="left"
                                    dataKey="revenue"
                                    name="Revenue (₹)"
                                    stroke="hsl(var(--primary))"
                                />
                                <Line
                                    yAxisId="right"
                                    dataKey="orders"
                                    name="Orders"
                                    stroke="#10b981"
                                />
                            </LineChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>

                {/* Top Products */}
                <Card>
                    <CardHeader>
                        <CardTitle>Best-Selling Products</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <ResponsiveContainer width="100%" height={350}>
                            <BarChart data={topProducts ?? []}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="name" />
                                <YAxis />
                                <Tooltip />
                                <Bar dataKey="sales" fill="hsl(var(--primary))" />
                            </BarChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>

                {/* Order Status */}
                <Card>
                    <CardHeader>
                        <CardTitle>Order Status Distribution</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <ResponsiveContainer width="100%" height={350}>
                            <PieChart>
                                <Pie
                                    data={statusBreakdown ?? []}
                                    cx="50%"
                                    cy="50%"
                                    outerRadius={100}
                                    dataKey="count"
                                    nameKey="status"
                                    label
                                >
                                    {(statusBreakdown ?? []).map((entry, i) => (
                                        <Cell
                                            key={i}
                                            fill={
                                                STATUS_COLORS[
                                                    entry.status.toLowerCase()
                                                ] || "#8884d8"
                                            }
                                        />
                                    ))}
                                </Pie>
                                <Tooltip />
                                <Legend />
                            </PieChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
