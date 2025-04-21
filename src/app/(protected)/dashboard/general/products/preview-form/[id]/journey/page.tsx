import { ProductJourneyManageForm } from "@/components/globals/forms";
import { DashShell } from "@/components/globals/layouts";
import { productQueries } from "@/lib/db/queries";
import { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";

interface PageProps {
    params: Promise<{
        bId: string;
        id: string;
    }>;
}

export async function generateMetadata({
    params,
}: PageProps): Promise<Metadata> {
    const { id } = await params;

    const existingProduct = await productQueries.getProduct({ productId: id });
    if (!existingProduct)
        return {
            title: "Product not found",
            description: "The requested product was not found",
        };

    // if (existingProduct.brand.id !== bId)
    //     return {
    //         title: "Product not found",
    //         description: "The requested product was not found",
    //     };

    return {
        title: `Edit Journey for "${existingProduct.title}"`,
        description: existingProduct.description,
    };
}

export default function Page({ params }: PageProps) {
    return (
        <DashShell>
            <div className="space-y-1">
                <h1 className="text-2xl font-bold">Product Journey</h1>
                <p className="text-sm text-muted-foreground">
                    Edit the product journey and update it on the platform
                </p>
            </div>

            <Suspense>
                <ProductJourneyFetch params={params} />
            </Suspense>
        </DashShell>
    );
}

async function ProductJourneyFetch({ params }: PageProps) {
    const { bId, id } = await params;

    const existingProduct = await productQueries.getProduct({ productId: id });
    if (!existingProduct) notFound();
    // if (existingProduct.brand.id !== bId) notFound();

    return <ProductJourneyManageForm brandId={bId} product={existingProduct} />;
}
