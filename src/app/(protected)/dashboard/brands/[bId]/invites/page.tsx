import {
    InvitesPage,
    InvitesTable,
} from "@/components/dashboard/brands/invites";
import { DashShell } from "@/components/globals/layouts";
import { TableSkeleton } from "@/components/globals/skeletons";
import { brandInviteQueries } from "@/lib/db/queries";
import { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";

interface PageProps {
    params: Promise<{ bId: string }>;
}

export const metadata: Metadata = {
    title: "Brand Invites",
    description: "Manage the brand's invites",
};

export default function Page({ params }: PageProps) {
    return (
        <DashShell>
            <div className="flex flex-col items-center justify-between gap-4 md:flex-row md:gap-2">
                <div className="space-y-1 text-center md:text-start">
                    <div className="text-2xl font-semibold">Brand Invites</div>
                    <p className="text-balance text-sm text-muted-foreground">
                        Manage the brand&apos;s invites
                    </p>
                </div>

                <Suspense fallback={null}>
                    <InvitePageFetch params={params} />
                </Suspense>
            </div>

            <Suspense fallback={<TableSkeleton />}>
                <InvitesFetch params={params} />
            </Suspense>
        </DashShell>
    );
}

async function InvitesFetch({ params }: PageProps) {
    const { bId } = await params;

    const cachedInvites = await brandInviteQueries.getBrandInvites(bId);
    if (!cachedInvites) notFound();

    return <InvitesTable brandId={bId} initialData={cachedInvites} />;
}

async function InvitePageFetch({ params }: PageProps) {
    const { bId } = await params;
    return <InvitesPage brandId={bId} />;
}
