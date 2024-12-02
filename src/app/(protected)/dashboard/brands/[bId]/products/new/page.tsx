import { ProductManageForm } from "@/components/globals/forms";
import { DashShell } from "@/components/globals/layouts";
import { brandCache } from "@/lib/redis/methods";
import { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";

interface PageProps {
    params: Promise<{ bId: string }>;
}

export const metadata: Metadata = {
    title: "Create New Product",
    description: "Create a new product for the brand",
};

export default function Page({ params }: PageProps) {
    return (
        <DashShell>
            <div className="space-y-1">
                <div className="text-2xl font-semibold">Create New Product</div>
                <p className="text-sm text-muted-foreground">
                    Create a new product for the brand
                </p>
            </div>

            <Suspense>
                <BrandFetch params={params} />
            </Suspense>
        </DashShell>
    );
}

async function BrandFetch({ params }: PageProps) {
    const { bId } = await params;
    const cachedBrand = await brandCache.get(bId);
    if (!cachedBrand) notFound();

    return <ProductManageForm brandId={bId} />;
}
