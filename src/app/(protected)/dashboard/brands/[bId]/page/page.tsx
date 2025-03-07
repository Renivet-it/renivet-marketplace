import { PublicPage } from "@/components/dashboard/brands/page";
import { DashShell } from "@/components/globals/layouts";
import { productQueries } from "@/lib/db/queries";
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
        <DashShell className="max-w-7xl gap-4">
            <Suspense>
                <PageFetch {...props} />
            </Suspense>
        </DashShell>
    );
}

async function PageFetch({ params }: PageProps) {
    const { bId } = await params;

    const [brand, products] = await Promise.all([
        brandCache.get(bId),
        productQueries.getAllProducts({
            brandIds: [bId],
            isActive: true,
            isAvailable: true,
            isDeleted: false,
            isPublished: true,
            verificationStatus: "approved",
        }),
    ]);
    if (!brand) notFound();

    return <PublicPage initialBrand={brand} products={products} />;
}
