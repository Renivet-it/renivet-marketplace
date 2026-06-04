"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { trpc } from "@/lib/trpc/client";
import {
    Bar,
    BarChart,
    CartesianGrid,
    Legend,
    Line,
    LineChart,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis,
} from "recharts";

interface AnalyticsChartsProps {
    brandId: string;
}

const formatMonth = (value: string | Date) =>
    new Intl.DateTimeFormat("en-IN", {
        month: "short",
        year: "2-digit",
    }).format(new Date(value));

const formatCurrency = (value: number) =>
    `\u20b9${value.toLocaleString("en-IN")}`;

const truncateLabel = (value: string) =>
    value.length > 24 ? `${value.slice(0, 24)}...` : value;

export function AnalyticsCharts({ brandId }: AnalyticsChartsProps) {
    const { data: monthlySales } =
        trpc.brands.analytics.getMonthlySales.useQuery({
            brandId,
        });

    const { data: topProducts } = trpc.brands.analytics.getTopProducts.useQuery(
        {
            brandId,
            limit: 8,
        }
    );

    return (
        <div className="grid w-full min-w-0 grid-cols-1 gap-4 xl:grid-cols-2">
            <Card className="min-w-0 border-border/70 bg-card/95 shadow-sm">
                <CardHeader className="pb-3">
                    <CardTitle className="text-xl font-semibold">
                        Monthly Sales Trend
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <ResponsiveContainer width="100%" height={360}>
                        <LineChart
                            data={monthlySales ?? []}
                            margin={{ left: 8, right: 8, top: 8, bottom: 8 }}
                        >
                            <CartesianGrid
                                stroke="hsl(var(--border))"
                                strokeDasharray="3 3"
                            />
                            <XAxis
                                axisLine={false}
                                dataKey="month"
                                tickFormatter={formatMonth}
                                tickLine={false}
                            />
                            <YAxis
                                allowDecimals={false}
                                axisLine={false}
                                orientation="right"
                                tickLine={false}
                                yAxisId="right"
                            />
                            <YAxis
                                allowDecimals={false}
                                axisLine={false}
                                tickFormatter={(value) =>
                                    Number(value) >= 1000
                                        ? `${Number(value) / 1000}k`
                                        : `${value}`
                                }
                                tickLine={false}
                                yAxisId="left"
                            />
                            <Tooltip
                                formatter={(value, name) =>
                                    name === "Revenue"
                                        ? formatCurrency(Number(value))
                                        : Number(value).toLocaleString()
                                }
                                labelFormatter={(label) =>
                                    formatMonth(label as string)
                                }
                            />
                            <Legend />
                            <Line
                                activeDot={{ r: 5 }}
                                dataKey="revenue"
                                dot={{ r: 3 }}
                                name="Revenue"
                                stroke="hsl(var(--primary))"
                                strokeWidth={2.5}
                                type="monotone"
                                yAxisId="left"
                            />
                            <Line
                                activeDot={{ r: 5 }}
                                dataKey="orders"
                                dot={{ r: 3 }}
                                name="Orders"
                                stroke="#0ea5e9"
                                strokeWidth={2.5}
                                type="monotone"
                                yAxisId="right"
                            />
                        </LineChart>
                    </ResponsiveContainer>
                </CardContent>
            </Card>

            <Card className="min-w-0 border-border/70 bg-card/95 shadow-sm">
                <CardHeader className="pb-3">
                    <CardTitle className="text-xl font-semibold">
                        Best-Selling Products
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <ResponsiveContainer width="100%" height={380}>
                        <BarChart
                            data={topProducts ?? []}
                            layout="vertical"
                            margin={{ left: 24, right: 24, top: 8, bottom: 8 }}
                        >
                            <CartesianGrid
                                horizontal={false}
                                stroke="hsl(var(--border))"
                                strokeDasharray="3 3"
                            />
                            <XAxis
                                axisLine={false}
                                tickFormatter={(value) =>
                                    Number(value) >= 1000
                                        ? `${Number(value) / 1000}k`
                                        : `${value}`
                                }
                                tickLine={false}
                                type="number"
                            />
                            <YAxis
                                axisLine={false}
                                dataKey="name"
                                tick={{ fontSize: 12 }}
                                tickFormatter={truncateLabel}
                                tickLine={false}
                                type="category"
                                width={170}
                            />
                            <Tooltip
                                formatter={(value) =>
                                    formatCurrency(Number(value))
                                }
                            />
                            <Bar
                                dataKey="sales"
                                fill="hsl(var(--primary))"
                                maxBarSize={34}
                                name="Sales"
                                radius={[0, 8, 8, 0]}
                            />
                        </BarChart>
                    </ResponsiveContainer>
                </CardContent>
            </Card>
        </div>
    );
}
