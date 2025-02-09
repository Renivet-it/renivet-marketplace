import { ProductValuesManageForm } from "@/components/globals/forms";
import { DashShell } from "@/components/globals/layouts";
import { productQueries } from "@/lib/db/queries";
import { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";

interface PageProps {
    params: Promise<{
        bId: string;
        pId: string;
    }>;
}

export async function generateMetadata({
    params,
}: PageProps): Promise<Metadata> {
    const { bId, pId } = await params;

    const existingProduct = await productQueries.getProduct({ productId: pId });
    if (!existingProduct)
        return {
            title: "Product not found",
            description: "The requested product was not found",
        };

    if (existingProduct.brand.id !== bId)
        return {
            title: "Product not found",
            description: "The requested product was not found",
        };

    return {
        title: `Edit Values for "${existingProduct.title}"`,
        description: existingProduct.description,
    };
}

export default function Page({ params }: PageProps) {
    return (
        <DashShell>
            <div className="space-y-1">
                <h1 className="text-2xl font-bold">Product Values</h1>
                <p className="text-sm text-muted-foreground">
                    Edit the product values and update it on the platform
                </p>
            </div>

            <Suspense>
                <ProductValuesFetch params={params} />
            </Suspense>
        </DashShell>
    );
}

async function ProductValuesFetch({ params }: PageProps) {
    const { bId, pId } = await params;

    const existingProduct = await productQueries.getProduct({ productId: pId });
    if (!existingProduct) notFound();
    if (existingProduct.brand.id !== bId) notFound();

    return <ProductValuesManageForm brandId={bId} product={existingProduct} />;
}
