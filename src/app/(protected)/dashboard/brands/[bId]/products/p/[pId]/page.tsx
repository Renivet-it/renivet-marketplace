import { ProductManageForm } from "@/components/globals/forms";
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

    const existingProduct = await productQueries.getProduct(pId);
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
        title: `Edit "${existingProduct.name}"`,
        description: existingProduct.description,
    };
}

export default function Page({ params }: PageProps) {
    return (
        <DashShell>
            <div className="space-y-1">
                <div className="text-2xl font-semibold">Edit Product</div>
                <p className="text-sm text-muted-foreground">
                    Edit the product and update it on the platform
                </p>
            </div>

            <Suspense fallback={<>Loading...</>}>
                <ProductEditFetch params={params} />
            </Suspense>
        </DashShell>
    );
}

async function ProductEditFetch({ params }: PageProps) {
    const { bId, pId } = await params;

    const existingProduct = await productQueries.getProduct(pId);
    if (!existingProduct) notFound();

    if (existingProduct.brand.id !== bId) notFound();

    return <ProductManageForm brandId={bId} product={existingProduct} />;
}
