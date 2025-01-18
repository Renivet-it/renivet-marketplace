import { PublicPage } from "@/components/dashboard/brands/page";
import { DashShell } from "@/components/globals/layouts";
import { brandCache } from "@/lib/redis/methods";
import { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";

export const metadata: Metadata = {
    title: "Brand Page",
    description: "Manage the brand's public page",
};

interface PageProps {
    params: Promise<{ bId: string }>;
}

export default function Page(props: PageProps) {
    return (
        <DashShell className="gap-4">
            <Suspense>
                <PageFetch {...props} />
            </Suspense>
        </DashShell>
    );
}

async function PageFetch({ params }: PageProps) {
    const { bId } = await params;

    const brand = await brandCache.get(bId);
    if (!brand) notFound();

    return <PublicPage brand={brand} />;
}
