import {
    ShopByCategoriesTable,
    ShopByCategoryTitle,
} from "@/components/dashboard/general/shop-by-categories";
import { DashShell } from "@/components/globals/layouts";
import { TableSkeleton } from "@/components/globals/skeletons";
import { Icons } from "@/components/icons";
import { Button } from "@/components/ui/button-dash";
import {
    homeShopByCategoryQueries,
    homeShopByCategoryTitleQueries,
} from "@/lib/db/queries";
import { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";

export const metadata: Metadata = {
    title: "Shop by Category",
    description: "Manage the platform's shop by category",
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
                    <h1 className="text-2xl font-bold">Shop by Category</h1>
                    <p className="text-balance text-sm text-muted-foreground">
                        Manage the platform&apos;s shop by category
                    </p>
                </div>

                <Button
                    asChild
                    className="h-9 px-3 text-xs md:h-10 md:px-4 md:text-sm"
                >
                    <Link href="/dashboard/general/shop-by-category/new">
                        <Icons.PlusCircle className="size-5" />
                        New Shop by Category
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

    const [data, titleData] = await Promise.all([
        homeShopByCategoryQueries.getHomeShopByCategories({
            limit,
            page,
        }),
        homeShopByCategoryTitleQueries.getHomeShopByCategoryTitle(),
    ]);

    return (
        <>
            <ShopByCategoryTitle titleData={titleData} />
            <ShopByCategoriesTable initialData={data} />
        </>
    );
}
