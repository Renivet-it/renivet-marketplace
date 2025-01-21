"use client";

import { BRAND_EVENTS } from "@/config/brand";
import { trpc } from "@/lib/trpc/client";
import { cn, convertValueToLabel, formatPriceTag } from "@/lib/utils";
import { useState } from "react";
import { Card, CardContent, CardHeader } from "../ui/card";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "../ui/select-dash";
import { Skeleton } from "../ui/skeleton";
import { AnalyticsCard } from "./analytics-card";
import { RevenueCard } from "./revenue-card";
import { StatCard } from "./stat-card";

interface PageProps extends GenericProps {
    brandId: string;
}

export function AnalyticsPage({ className, brandId, ...props }: PageProps) {
    const [timeRange, setTimeRange] = useState("7");

    const revenueQuery = trpc.brands.revenue.getRevenue.useQuery({
        brandId,
        nDays: parseInt(timeRange),
    });

    const statsQuery = trpc.brands.revenue.getStats.useQuery({
        brandId,
        days: parseInt(timeRange),
    });

    const queries = Object.entries(BRAND_EVENTS).flatMap(([, events]) =>
        Object.values(events).map((namespace) =>
            trpc.brands.analytics.getAnalytics.useQuery({
                brandId,
                namespace,
                nDays: parseInt(timeRange),
            })
        )
    );

    const isLoading =
        queries.some((query) => query.isLoading) ||
        revenueQuery.isLoading ||
        statsQuery.isLoading;

    if (isLoading) {
        return (
            <div className={cn("space-y-8", className)} {...props}>
                <div className="flex items-center justify-between gap-2 md:flex-row">
                    <div className="space-y-1 text-center md:text-start">
                        <h1 className="text-2xl font-bold">Analytics</h1>
                        <p className="text-balance text-sm text-muted-foreground">
                            View the brand&apos;s analytics
                        </p>
                    </div>

                    <Skeleton className="h-10 w-36 rounded-md" />
                </div>

                {Object.keys(BRAND_EVENTS).map((category) => (
                    <div key={category} className="space-y-4">
                        <Skeleton className="h-7 w-32 rounded-md" />

                        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                            {Object.values(
                                BRAND_EVENTS[
                                    category as keyof typeof BRAND_EVENTS
                                ]
                            ).map((namespace) => (
                                <AnalyticsSkeleton key={namespace} />
                            ))}
                        </div>
                    </div>
                ))}
            </div>
        );
    }

    const queryIndex = { current: 0 };
    const groupedQueries = Object.entries(BRAND_EVENTS).reduce(
        (acc, [category, events]) => {
            acc[category] = Object.values(events).map(() => {
                const query = queries[queryIndex.current];
                queryIndex.current += 1;
                return query;
            });
            return acc;
        },
        {} as Record<string, typeof queries>
    );

    return (
        <div className={cn("space-y-8", className)} {...props}>
            <div className="flex flex-col items-center justify-between gap-2 md:flex-row">
                <div className="space-y-1 text-center md:text-start">
                    <h1 className="text-2xl font-bold">Analytics</h1>
                    <p className="text-balance text-sm text-muted-foreground">
                        View the brand&apos;s analytics
                    </p>
                </div>

                <Select
                    defaultValue={timeRange}
                    onValueChange={(value) => setTimeRange(value)}
                >
                    <SelectTrigger className="w-36">
                        <SelectValue placeholder="Select range" />
                    </SelectTrigger>

                    <SelectContent>
                        <SelectItem value="7">Last 7 days</SelectItem>
                        <SelectItem value="14">Last 14 days</SelectItem>
                        <SelectItem value="30">Last 30 days</SelectItem>
                    </SelectContent>
                </Select>
            </div>

            <div className="space-y-8">
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    {statsQuery.data && (
                        <>
                            <StatCard
                                title="Gross Revenue"
                                value={formatPriceTag(
                                    statsQuery.data.grossRevenue,
                                    true
                                )}
                                icon="DollarSign"
                                change={statsQuery.data.change.grossRevenue}
                            />
                            <StatCard
                                title="Net Revenue"
                                value={formatPriceTag(
                                    statsQuery.data.netRevenue,
                                    true
                                )}
                                icon="PiggyBank"
                                change={statsQuery.data.change.netRevenue}
                            />
                            <StatCard
                                title="Total Orders"
                                value={statsQuery.data.totalOrders.toString()}
                                icon="Package"
                                change={statsQuery.data.change.totalOrders}
                            />
                            <StatCard
                                title="Average Order Value"
                                value={formatPriceTag(
                                    statsQuery.data.averageOrderValue,
                                    true
                                )}
                                icon="PieChart"
                                change={
                                    statsQuery.data.change.averageOrderValue
                                }
                            />
                        </>
                    )}
                </div>

                <section className="space-y-4">
                    <h2 className="text-xl font-semibold">Revenue Overview</h2>
                    {revenueQuery.data && (
                        <RevenueCard data={revenueQuery.data} />
                    )}
                </section>

                {Object.entries(BRAND_EVENTS).map(([category, events]) => (
                    <section key={category} className="space-y-4">
                        <h2 className="text-xl font-semibold">
                            {convertValueToLabel(category)}
                        </h2>
                        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                            {Object.values(events).map((namespace, index) => {
                                const query = groupedQueries[category][index];
                                if (!query.data) return null;

                                const transformedData = query.data.map(
                                    (item) => ({
                                        date: item.date,
                                        value: item.events.reduce(
                                            (acc, event) => {
                                                const [, count] =
                                                    Object.entries(event)[0];
                                                return acc + count;
                                            },
                                            0
                                        ),
                                        metadata: item.events.map((event) => {
                                            const [key, value] =
                                                Object.entries(event)[0];
                                            return [key, value] as [
                                                string,
                                                number,
                                            ];
                                        }),
                                    })
                                );

                                return (
                                    <AnalyticsCard
                                        key={namespace}
                                        namespace={namespace}
                                        title={convertValueToLabel(namespace)}
                                        data={transformedData}
                                    />
                                );
                            })}
                        </div>
                    </section>
                ))}
            </div>
        </div>
    );
}

function AnalyticsSkeleton() {
    return (
        <Card>
            <CardHeader>
                <Skeleton className="h-8 w-32 rounded-md" />
            </CardHeader>

            <CardContent>
                <Skeleton className="aspect-[4/3] w-full rounded-md" />
            </CardContent>
        </Card>
    );
}
