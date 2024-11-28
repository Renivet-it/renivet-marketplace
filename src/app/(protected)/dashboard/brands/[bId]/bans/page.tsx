import { BansTable } from "@/components/dashboard/brands/bans";
import { DashShell } from "@/components/globals/layouts";
import { TableSkeleton } from "@/components/globals/skeletons";
import { bannedBrandMemberQueries } from "@/lib/db/queries";
import { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";

interface PageProps {
    searchParams: Promise<{
        page?: string;
        limit?: string;
        search?: string;
    }>;
    params: Promise<{ bId: string }>;
}

export const metadata: Metadata = {
    title: "Bans",
    description: "Manage the brand's bans",
};

export default function Page(props: PageProps) {
    return (
        <DashShell>
            <div className="flex flex-col items-center justify-between gap-4 md:flex-row md:gap-2">
                <div className="space-y-1 text-center md:text-start">
                    <div className="text-2xl font-semibold">Bans</div>
                    <p className="text-balance text-sm text-muted-foreground">
                        Manage the brand&apos;s bans
                    </p>
                </div>
            </div>

            <Suspense fallback={<TableSkeleton />}>
                <BansFetch {...props} />
            </Suspense>
        </DashShell>
    );
}

async function BansFetch({ params, searchParams }: PageProps) {
    const {
        page: pageRaw,
        limit: limitRaw,
        search: searchRaw,
    } = await searchParams;
    const { bId } = await params;

    const limit =
        limitRaw && !isNaN(parseInt(limitRaw)) ? parseInt(limitRaw) : 10;
    const page = pageRaw && !isNaN(parseInt(pageRaw)) ? parseInt(pageRaw) : 1;
    const search = searchRaw?.length ? searchRaw : undefined;

    const data = await bannedBrandMemberQueries.getBannedMembers({
        brandId: bId,
        limit,
        page,
        search,
    });
    if (!data) notFound();

    return <BansTable brandId={bId} initialData={data} />;
}
