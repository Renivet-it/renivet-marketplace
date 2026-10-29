import { BannersTable } from "@/components/dashboard/general/banners";
import { DashShell } from "@/components/globals/layouts";
import { TableSkeleton } from "@/components/globals/skeletons";
import { Icons } from "@/components/icons";
import { Button } from "@/components/ui/button-dash";
import { bannerQueries } from "@/lib/db/queries";
import { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";

export const metadata: Metadata = {
    title: "Mobile Banners",
    description: "Manage mobile homepage banners",
};

export default function Page() {
    return (
        <DashShell>
            <div className="flex flex-col items-center justify-between gap-4 md:flex-row md:gap-2">
                <div className="space-y-1 text-center md:text-start">
                    <h1 className="text-2xl font-bold">Mobile Banners</h1>
                    <p className="text-balance text-sm text-muted-foreground">
                        Manage banners shown on mobile devices
                    </p>
                </div>
                <div className="flex gap-2">
                    <Button asChild variant="outline">
                        <Link href="/dashboard/general/banners">
                            Desktop Banners
                        </Link>
                    </Button>
                    <Button asChild>
                        <Link href="/dashboard/general/banners/mobile/new">
                            <Icons.PlusCircle className="size-5" />
                            Create Mobile Banner
                        </Link>
                    </Button>
                </div>
            </div>
            <Suspense fallback={<TableSkeleton />}>
                <MobileBannersFetch />
            </Suspense>
        </DashShell>
    );
}

async function MobileBannersFetch() {
    const data = await bannerQueries.getBanners({
        limit: 10,
        page: 1,
        isActive: true,
        isMobile: true,
    });
    return <BannersTable initialData={data} isMobile />;
}
