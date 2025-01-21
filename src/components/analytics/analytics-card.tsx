import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog-dash";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";
import { parse } from "date-fns";
import Link from "next/link";
import { useState } from "react";
import {
    Area,
    CartesianGrid,
    ComposedChart,
    Tooltip,
    XAxis,
    YAxis,
} from "recharts";
import { Icons } from "../icons";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { ChartContainer } from "../ui/chart";
import { Popover, PopoverContent, PopoverTrigger } from "../ui/popover";
import { MetadataViewer } from "./metadata-viewer";

interface AnalyticsCardProps {
    namespace: string;
    title: string;
    data: {
        date: string;
        value: number;
        metadata: [string, number][];
    }[];
}

export function AnalyticsCard({ title, data }: AnalyticsCardProps) {
    const [isModalOpen, setIsModalOpen] = useState(false);

    const aggregatedMetadata = data.reduce(
        (acc, day) => {
            day.metadata.forEach(([key, value]: [string, number]) => {
                const parsed = JSON.parse(key);
                const id = parsed.productId || parsed.userId || key;

                if (!acc[id]) {
                    acc[id] = {
                        id,
                        name:
                            parsed.productName ||
                            parsed.userName ||
                            parsed.orderId ||
                            id,
                        url: parsed.url || undefined,
                        metadata: parsed, // Store all metadata
                        total: 0,
                        dailyData: {},
                    };
                }

                acc[id].total += value;
                acc[id].dailyData[day.date] = value;
            });
            return acc;
        },
        {} as Record<
            string,
            {
                id: string;
                name: string;
                url?: string;
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                metadata: Record<string, any>;
                total: number;
                dailyData: Record<string, number>;
            }
        >
    );

    const sortedMetadata = Object.values(aggregatedMetadata).sort(
        (a, b) => b.total - a.total
    );

    const sortedData = [...data].sort(
        (a, b) =>
            parse(a.date, "dd/MM/yyyy", new Date()).getTime() -
            parse(b.date, "dd/MM/yyyy", new Date()).getTime()
    );

    const chartConfig = {
        value: {
            label: title,
            theme: {
                light: "hsl(var(--primary))",
                dark: "hsl(var(--primary))",
            },
        },
    };

    const commonChartProps = {
        data: sortedData, // Use sortedData instead of data
        margin: { top: 20, right: 20, bottom: 40, left: 40 },
        children: (
            <>
                <defs>
                    <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                        <stop
                            offset="5%"
                            stopColor="hsl(var(--primary))"
                            stopOpacity={0.8}
                        />
                        <stop
                            offset="95%"
                            stopColor="hsl(var(--primary))"
                            stopOpacity={0}
                        />
                    </linearGradient>
                </defs>

                <CartesianGrid strokeDasharray="3 3" opacity={0.2} />

                <XAxis
                    dataKey="date"
                    tickLine={false}
                    fontSize={12}
                    label={{
                        value: "Date",
                        position: "insideBottom",
                        offset: -20,
                        fontSize: 12,
                    }}
                />

                <YAxis
                    tickLine={false}
                    fontSize={12}
                    label={{
                        value: "Count",
                        angle: -90,
                        position: "insideLeft",
                        offset: 0,
                        fontSize: 12,
                    }}
                />

                <Tooltip
                    content={({ active, payload }) => {
                        if (!active || !payload?.[0]) return null;
                        const data = payload[0].payload;

                        return (
                            <div className="rounded-lg border bg-background p-2 shadow-sm">
                                <div className="grid gap-2">
                                    <div className="font-medium">
                                        {data.date}
                                    </div>
                                    <div className="grid gap-1">
                                        <div className="text-xs text-muted-foreground">
                                            Total: {data.value}
                                        </div>
                                        {data.metadata.map(
                                            (
                                                [key, value]: [string, number],
                                                i: number
                                            ) => (
                                                <div
                                                    key={i}
                                                    className="text-xs"
                                                >
                                                    {JSON.parse(key)
                                                        .productName ||
                                                        JSON.parse(key)
                                                            .userName ||
                                                        JSON.parse(key)
                                                            .orderId ||
                                                        key}
                                                    : {value}
                                                </div>
                                            )
                                        )}
                                    </div>
                                </div>
                            </div>
                        );
                    }}
                />
                <Area
                    type="monotone"
                    dataKey="value"
                    stroke="hsl(var(--primary))"
                    fillOpacity={1}
                    fill="url(#colorValue)"
                    name="Trend"
                />
            </>
        ),
    };

    return (
        <>
            <Card
                className={cn(
                    "flex flex-col",
                    "cursor-pointer",
                    "hover:shadow-lg",
                    "transition-shadow"
                )}
                onClick={() => setIsModalOpen(true)}
            >
                <CardHeader>
                    <CardTitle className="truncate text-xl">{title}</CardTitle>
                </CardHeader>

                <CardContent className="flex-1">
                    <ChartContainer
                        className="aspect-[4/3]"
                        config={chartConfig}
                    >
                        <ComposedChart {...commonChartProps} />
                    </ChartContainer>
                </CardContent>
            </Card>

            <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
                <DialogContent className="max-w-5xl">
                    <DialogHeader>
                        <DialogTitle>{title}</DialogTitle>
                    </DialogHeader>

                    <div className="grid gap-6">
                        <ChartContainer
                            className="aspect-[16/9]"
                            config={chartConfig}
                        >
                            <ComposedChart {...commonChartProps} />
                        </ChartContainer>

                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Name</TableHead>
                                    <TableHead>Total</TableHead>
                                    {sortedData.map((day) => (
                                        <TableHead key={day.date}>
                                            {day.date}
                                        </TableHead>
                                    ))}
                                </TableRow>
                            </TableHeader>

                            <TableBody>
                                {sortedMetadata.map((item) => (
                                    <TableRow key={item.id}>
                                        <TableCell className="flex items-center gap-2 font-medium">
                                            <Popover>
                                                <PopoverTrigger className="flex items-center gap-2">
                                                    {item.name}
                                                    <div>
                                                        <Icons.Info className="size-4 text-muted-foreground" />
                                                    </div>
                                                </PopoverTrigger>

                                                <PopoverContent
                                                    className="w-auto text-sm"
                                                    align="start"
                                                >
                                                    <div className="space-y-1">
                                                        {Object.entries(
                                                            item.metadata
                                                        )
                                                            .filter(
                                                                ([key]) =>
                                                                    ![
                                                                        "productName",
                                                                        "userName",
                                                                        "url",
                                                                    ].includes(
                                                                        key
                                                                    )
                                                            )
                                                            .map(
                                                                ([
                                                                    key,
                                                                    value,
                                                                ]) => (
                                                                    <MetadataViewer
                                                                        key={
                                                                            key
                                                                        }
                                                                        data={
                                                                            value
                                                                        }
                                                                        parentKey={
                                                                            key
                                                                        }
                                                                    />
                                                                )
                                                            )}
                                                    </div>
                                                </PopoverContent>
                                            </Popover>
                                            {item.url && (
                                                <Link
                                                    href={item.url}
                                                    target="_blank"
                                                >
                                                    <Icons.ExternalLink className="size-4" />
                                                    <span className="sr-only">
                                                        Open link
                                                    </span>
                                                </Link>
                                            )}
                                        </TableCell>

                                        <TableCell className="font-medium">
                                            {item.total}
                                        </TableCell>

                                        {sortedData.map((day) => (
                                            <TableCell key={day.date}>
                                                {item.dailyData[day.date] || 0}
                                            </TableCell>
                                        ))}
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>
                </DialogContent>
            </Dialog>
        </>
    );
}
