import { BannersTable } from "@/components/dashboard/banners";
import { DashShell } from "@/components/globals/layouts";
import { TableSkeleton } from "@/components/globals/skeletons";
import { Icons } from "@/components/icons";
import { Button } from "@/components/ui/button-dash";
import { bannerQueries } from "@/lib/db/queries";
import { bannerCache } from "@/lib/redis/methods";
import { bannerSchema } from "@/lib/validations";
import { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";

export const metadata: Metadata = {
    title: "Banners",
    description: "Manage the platform's banners",
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
                    <div className="text-2xl font-semibold">Banners</div>
                    <p className="text-balance text-sm text-muted-foreground">
                        Manage the platform&apos;s banners
                    </p>
                </div>

                <Button
                    asChild
                    className="h-9 px-3 text-xs md:h-10 md:px-4 md:text-sm"
                >
                    <Link href="/dashboard/general/banners/new">
                        <Icons.PlusCircle className="size-5" />
                        Create New Banner
                    </Link>
                </Button>
            </div>

            <Suspense fallback={<TableSkeleton />}>
                <BannersFetch searchParams={searchParams} />
            </Suspense>
        </DashShell>
    );
}

async function BannersFetch({ searchParams }: PageProps) {
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

    const data = await bannerQueries.getBanners({
        limit,
        page,
        isActive,
        search,
    });

    await bannerCache.drop();
    await bannerCache.addBulk(
        bannerSchema
            .array()
            .parse(data.data.filter((banner) => banner.isActive))
    );

    return <BannersTable initialData={data} />;
}
