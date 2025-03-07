import { AnalyticsPage } from "@/components/analytics";
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
    title: "Analytics",
    description: "View the brand's analytics",
};

export default function Page(props: PageProps) {
    return (
        <DashShell className="max-w-7xl">
            <Suspense>
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
    if (!isBrandSubscribed) return <NotSubscribedCard bId={bId} />;

    return <AnalyticsPage brandId={bId} />;
}

function NotSubscribedCard({ bId }: { bId: string }) {
    return (
        <div className="flex flex-1 justify-center">
            <EmptyPlaceholder className="h-min">
                <EmptyPlaceholderIcon>
                    <Icons.Hammer className="size-10" />
                </EmptyPlaceholderIcon>

                <EmptyPlaceholderContent>
                    <EmptyPlaceholderTitle>Access Denied</EmptyPlaceholderTitle>
                    <EmptyPlaceholderDescription>
                        You need a membership to view this page. Please
                        subscribe to any of our plans to continue.
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
