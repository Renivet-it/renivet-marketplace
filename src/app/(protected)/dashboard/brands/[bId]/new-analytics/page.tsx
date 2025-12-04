import { AnalyticsOverview } from "@/components/new-analytics/analytics-overview";
import { AnalyticsCharts } from "@/components/new-analytics/analytics-charts";
import { DashShell } from "@/components/globals/layouts";
import { Icons } from "@/components/icons";
import { Button } from "@/components/ui/button-dash";
import {
    EmptyPlaceholder,
    EmptyPlaceholderContent,
    EmptyPlaceholderDescription,
    EmptyPlaceholderIcon,
    EmptyPlaceholderTitle,
} from "@/components/ui/empty-placeholder-dash";
import { brandCache } from "@/lib/redis/methods";
import { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";

interface PageProps {
    params: Promise<{ bId: string }>;
}

export const metadata: Metadata = {
    title: "Analytics Dashboard",
    description: "View comprehensive brand analytics and insights",
};

export default function Page(props: PageProps) {
    return (
        <DashShell className="max-w-7xl">
            <Suspense fallback={<AnalyticsLoadingSkeleton />}>
                <AnalyticsFetch {...props} />
            </Suspense>
        </DashShell>
    );
}

async function AnalyticsFetch({ params }: PageProps) {
    const { bId } = await params;

    const existingBrand = await brandCache.get(bId);
    if (!existingBrand) notFound();

    const isBrandSubscribed = existingBrand.subscriptions.some(
        (sub) => sub.isActive
    );
    // Uncomment this when you want to enforce subscription
    // if (!isBrandSubscribed) return <NotSubscribedCard bId={bId} />;

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Analytics Dashboard</h1>
                <p className="text-muted-foreground mt-2">
                    Track your sales, orders, and performance metrics
                </p>
            </div>
            <AnalyticsOverview brandId={bId} />
            <AnalyticsCharts brandId={bId} />
        </div>
    );
}

function NotSubscribedCard({ bId }: { bId: string }) {
    return (
        <div className="flex flex-1 justify-center items-center min-h-[60vh]">
            <EmptyPlaceholder className="h-min max-w-md">
                <EmptyPlaceholderIcon>
                    <Icons.Hammer className="size-10" />
                </EmptyPlaceholderIcon>

                <EmptyPlaceholderContent>
                    <EmptyPlaceholderTitle>Access Denied</EmptyPlaceholderTitle>
                    <EmptyPlaceholderDescription>
                        You need an active membership to view analytics. Subscribe to any of our plans to unlock insights.
                    </EmptyPlaceholderDescription>
                </EmptyPlaceholderContent>

                <Button asChild size="sm">
                    <Link href={`/dashboard/brands/${bId}/memberships`}>
                        Manage Subscriptions
                    </Link>
                </Button>
            </EmptyPlaceholder>
        </div>
    );
}

function AnalyticsLoadingSkeleton() {
    return (
        <div className="space-y-6 animate-pulse">
            <div className="space-y-2">
                <div className="h-8 bg-muted rounded w-64" />
                <div className="h-4 bg-muted rounded w-96" />
            </div>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                {[...Array(4)].map((_, i) => (
                    <div key={i} className="h-32 bg-muted rounded-lg" />
                ))}
            </div>
            <div className="grid gap-4 md:grid-cols-2">
                {[...Array(2)].map((_, i) => (
                    <div key={i} className="h-80 bg-muted rounded-lg" />
                ))}
            </div>
        </div>
    );
}