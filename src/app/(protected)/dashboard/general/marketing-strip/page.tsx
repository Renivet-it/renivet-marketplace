import { MarketingStripsTable } from "@/components/dashboard/general/marketing-strip";
import { DashShell } from "@/components/globals/layouts";
import { TableSkeleton } from "@/components/globals/skeletons";
import { Icons } from "@/components/icons";
import { Button } from "@/components/ui/button-dash";
import { marketingStripQueries } from "@/lib/db/queries";
import { marketingStripCache } from "@/lib/redis/methods";
import { marketingStripSchema } from "@/lib/validations";
import { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";

export const metadata: Metadata = {
    title: "Marketing Strip",
    description: "Manage the platform's marketing strip for the homepage",
};

interface PageProps {
    searchParams: Promise<{
        page?: string;
        limit?: string;
        isActive?: string;
        search?: string;
    }>;
}

export default function Page({ searchParams }: PageProps) {
    return (
        <DashShell>
            <div className="flex flex-col items-center justify-between gap-4 md:flex-row md:gap-2">
                <div className="space-y-1 text-center md:text-start">
                    <h1 className="text-2xl font-bold">Marketing Strip</h1>
                    <p className="text-balance text-sm text-muted-foreground">
                        Manage the platform&apos;s marketing strip for the
                        homepage
                    </p>
                </div>

                <Button
                    asChild
                    className="h-9 px-3 text-xs md:h-10 md:px-4 md:text-sm"
                >
                    <Link href="/dashboard/general/marketing-strip/new">
                        <Icons.PlusCircle className="size-5" />
                        Add New Item
                    </Link>
                </Button>
            </div>

            <Suspense fallback={<TableSkeleton />}>
                <MakertingStripFetch searchParams={searchParams} />
            </Suspense>
        </DashShell>
    );
}

async function MakertingStripFetch({ searchParams }: PageProps) {
    const {
        page: pageRaw,
        limit: limitRaw,
        isActive: isActiveRaw,
        search: searchRaw,
    } = await searchParams;

    const limit =
        limitRaw && !isNaN(parseInt(limitRaw)) ? parseInt(limitRaw) : 10;
    const page = pageRaw && !isNaN(parseInt(pageRaw)) ? parseInt(pageRaw) : 1;
    const isActive =
        isActiveRaw === undefined || isActiveRaw === "true" ? true : false;
    const search = searchRaw?.length ? searchRaw : undefined;

    const data = await marketingStripQueries.getMarketingStrips({
        limit,
        page,
        isActive,
        search,
    });

    await marketingStripCache.drop();
    await marketingStripCache.addBulk(
        marketingStripSchema
            .array()
            .parse(data.data.filter((strip) => strip.isActive))
    );

    return <MarketingStripsTable initialData={data} />;
}
