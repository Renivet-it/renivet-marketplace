import {
    ShopByCategoriesTable,
} from "@/components/dashboard/general/women/new-collection/shop-by-categories-table";
import { DashShell } from "@/components/globals/layouts";
import { TableSkeleton } from "@/components/globals/skeletons";
import { Icons } from "@/components/icons";
import { Button } from "@/components/ui/button-dash";
import {
    homeShopByCategoryQueries,
    WomenHomeSectionQueries,
    homeShopByCategoryTitleQueries,
} from "@/lib/db/queries";
import { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";

export const metadata: Metadata = {
    title: "New Collection",
    description: "Manage the platform's New Collection",
};

interface PageProps {
    searchParams: Promise<{
        page?: string;
        limit?: string;
    }>;
}

export default function Page({ searchParams }: PageProps) {
    return (
        <DashShell>
            <div className="flex flex-col items-center justify-between gap-4 md:flex-row md:gap-2">
                <div className="space-y-1 text-center md:text-start">
                    <h1 className="text-2xl font-bold">New Collection</h1>
                    <p className="text-balance text-sm text-muted-foreground">
                        Manage the platform&apos;s New Collection
                    </p>
                </div>

                <Button
                    asChild
                    className="h-9 px-3 text-xs md:h-10 md:px-4 md:text-sm"
                >
                    <Link href="/dashboard/general/women-section/new-collection/new">
                        <Icons.PlusCircle className="size-5" />
                        New women New Collection
                    </Link>
                </Button>
            </div>

            <Suspense fallback={<TableSkeleton />}>
                <ShopByCategoriesFetch searchParams={searchParams} />
            </Suspense>
        </DashShell>
    );
}

async function ShopByCategoriesFetch({ searchParams }: PageProps) {
    const { page: pageRaw, limit: limitRaw } = await searchParams;

    const limit =
        limitRaw && !isNaN(parseInt(limitRaw)) ? parseInt(limitRaw) : 10;
    const page = pageRaw && !isNaN(parseInt(pageRaw)) ? parseInt(pageRaw) : 1;
// ts-ignore
    const [data] = await Promise.all([
        WomenHomeSectionQueries.getNewCollections({
            limit,
            page,
        }),
    ]);

    // Transform data to include required properties for ShopByCategoriesTable
    const transformedData = data.map((item, idx) => ({
        id: item.id,
        createdAt: item.createdAt,
        updatedAt: item.updatedAt,
        imageUrl: item.imageUrl ?? "",
        url: item.url ?? null,
        position: (item as any).position ?? idx, // fallback to index if position is missing
    }));

    return (
        <>
            {/* <ShopByCategoryTitle titleData={titleData} /> */}
            <ShopByCategoriesTable initialData={{ data: transformedData, count: transformedData.length }} />
        </>
    );
}
