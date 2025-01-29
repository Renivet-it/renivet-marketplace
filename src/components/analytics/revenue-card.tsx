import { RevenueData } from "@/lib/redis/methods";
import { formatPriceTag } from "@/lib/utils";
import { parse } from "date-fns";
import {
    Area,
    CartesianGrid,
    ComposedChart,
    Tooltip,
    XAxis,
    YAxis,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { ChartContainer } from "../ui/chart";

interface RevenueCardProps {
    data: {
        date: string;
        revenue: number;
        payments: number;
        refunds: number;
        transactions: RevenueData[];
    }[];
}

export function RevenueCard({ data }: RevenueCardProps) {
    const yAxisFormatter = (value: number) => formatPriceTag(value, true);

    const chartConfig = {
        revenue: {
            label: "Revenue",
            theme: {
                light: "hsl(var(--primary))",
                dark: "hsl(var(--primary))",
            },
        },
    };

    const sortedData = [...data].sort(
        (a, b) =>
            parse(a.date, "dd/MM/yyyy", new Date()).getTime() -
            parse(b.date, "dd/MM/yyyy", new Date()).getTime()
    );

    return (
        <Card>
            <CardHeader>
                <CardTitle>Revenue</CardTitle>
            </CardHeader>

            <CardContent>
                <ChartContainer className="aspect-[16/9]" config={chartConfig}>
                    <ComposedChart
                        data={sortedData}
                        margin={{ top: 20, right: 20, bottom: 20, left: 20 }}
                    >
                        <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                        <XAxis dataKey="date" />
                        <YAxis tickFormatter={yAxisFormatter} />
                        <Tooltip
                            formatter={(value: number) => yAxisFormatter(value)}
                            labelFormatter={(label) => `Date: ${label}`}
                        />
                        <Area
                            dataKey="revenue"
                            name="Net Revenue"
                            stroke={chartConfig.revenue.theme.light}
                            fill={chartConfig.revenue.theme.light}
                            fillOpacity={0.2}
                        />
                    </ComposedChart>
                </ChartContainer>
            </CardContent>
        </Card>
    );
}
