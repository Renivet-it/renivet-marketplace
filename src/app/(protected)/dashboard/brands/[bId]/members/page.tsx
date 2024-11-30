import { MembersTable } from "@/components/dashboard/brands/members";
import { DashShell } from "@/components/globals/layouts";
import { TableSkeleton } from "@/components/globals/skeletons";
import { brandMemberQueries } from "@/lib/db/queries";
import { Metadata } from "next";
import { Suspense } from "react";

export const metadata: Metadata = {
    title: "Members",
    description: "Manage the brand's team members",
};

interface PageProps {
    searchParams: Promise<{
        page?: string;
        limit?: string;
        search?: string;
    }>;
    params: Promise<{ bId: string }>;
}

export default function Page(props: PageProps) {
    return (
        <DashShell>
            <div className="flex flex-col items-center justify-between gap-4 md:flex-row md:gap-2">
                <div className="space-y-1 text-center md:text-start">
                    <div className="text-2xl font-semibold">Members</div>
                    <p className="text-balance text-sm text-muted-foreground">
                        Manage the brand&apos;s team members
                    </p>
                </div>
            </div>

            <Suspense fallback={<TableSkeleton />}>
                <MembersFetch {...props} />
            </Suspense>
        </DashShell>
    );
}

async function MembersFetch({ searchParams, params }: PageProps) {
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

    const data = await brandMemberQueries.getBrandMembers({
        brandId: bId,
        limit,
        page,
        search,
    });

    return <MembersTable brandId={bId} initialData={data} />;
}
