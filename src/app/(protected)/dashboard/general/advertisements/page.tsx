import { AdvertisementsTable } from "@/components/dashboard/general/advertisements";
import { DashShell } from "@/components/globals/layouts";
import { TableSkeleton } from "@/components/globals/skeletons";
import { Icons } from "@/components/icons";
import { Button } from "@/components/ui/button-dash";
import { advertisementQueries } from "@/lib/db/queries";
import { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";

export const metadata: Metadata = {
    title: "Advertisements",
    description: "Manage the platform's advertisements",
};

interface PageProps {
    searchParams: Promise<{
        page?: string;
        limit?: string;
        search?: string;
        isPublished?: string;
    }>;
}

export default function Page({ searchParams }: PageProps) {
    return (
        <DashShell>
            <div className="flex flex-col items-center justify-between gap-4 md:flex-row md:gap-2">
                <div className="space-y-1 text-center md:text-start">
                    <h1 className="text-2xl font-bold">Advertisements</h1>
                    <p className="text-balance text-sm text-muted-foreground">
                        Manage the platform&apos;s advertisements
                    </p>
                </div>

                <Button
                    asChild
                    className="h-9 px-3 text-xs md:h-10 md:px-4 md:text-sm"
                >
                    <Link href="/dashboard/general/advertisements/new">
                        <Icons.PlusCircle className="size-5" />
                        Create New Advertisement
                    </Link>
                </Button>
            </div>

            <Suspense fallback={<TableSkeleton />}>
                <AdvertisementsFetch searchParams={searchParams} />
            </Suspense>
        </DashShell>
    );
}

async function AdvertisementsFetch({ searchParams }: PageProps) {
    const {
        page: pageRaw,
        limit: limitRaw,
        search: searchRaw,
        isPublished: isPublishedRaw,
    } = await searchParams;

    const limit =
        limitRaw && !isNaN(parseInt(limitRaw)) ? parseInt(limitRaw) : 10;
    const page = pageRaw && !isNaN(parseInt(pageRaw)) ? parseInt(pageRaw) : 1;
    const isPublished =
        isPublishedRaw === undefined || isPublishedRaw === "true"
            ? true
            : false;
    const search = searchRaw?.length ? searchRaw : undefined;

    const data = await advertisementQueries.getAdvertisements({
        limit,
        page,
        search,
        isPublished,
    });

    return <AdvertisementsTable initialData={data} />;
}
