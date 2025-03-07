import { PlansTable } from "@/components/dashboard/general/plans";
import { DashShell } from "@/components/globals/layouts";
import { TableSkeleton } from "@/components/globals/skeletons";
import { Icons } from "@/components/icons";
import { Button } from "@/components/ui/button-dash";
import { planCache } from "@/lib/redis/methods";
import { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";

export const metadata: Metadata = {
    title: "Plans",
    description: "Manage the platform's subscription plans for brands",
};

export default function Page() {
    return (
        <DashShell>
            <div className="flex flex-col items-center justify-between gap-4 md:flex-row md:gap-2">
                <div className="space-y-1 text-center md:text-start">
                    <h1 className="text-2xl font-bold">Plans</h1>
                    <p className="text-balance text-sm text-muted-foreground">
                        Manage the platform&apos;s subscription plans for brands
                    </p>
                </div>

                <Button
                    asChild
                    className="h-9 px-3 text-xs md:h-10 md:px-4 md:text-sm"
                >
                    <Link href="/dashboard/general/plans/new">
                        <Icons.PlusCircle className="size-5" />
                        Create New Plan
                    </Link>
                </Button>
            </div>

            <Suspense fallback={<TableSkeleton />}>
                <PlansFetch />
            </Suspense>
        </DashShell>
    );
}

async function PlansFetch() {
    const data = await planCache.getAll();

    const parsed = {
        data,
        count: data.length,
    };

    return <PlansTable initialData={parsed} />;
}
