import { GeneralShell } from "@/components/globals/layouts";
import { ProductPage } from "@/components/products/product";
import { siteConfig } from "@/config/site";
import { productQueries } from "@/lib/db/queries";
import { getAbsoluteURL } from "@/lib/utils";
import { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";

interface PageProps {
    params: Promise<{
        slug: string;
    }>;
}

export async function generateMetadata({
    params,
}: PageProps): Promise<Metadata> {
    const { slug } = await params;

    const existingProduct = await productQueries.getProductBySlug(
        slug,
        "published"
    );
    if (!existingProduct)
        return {
            title: "Product not found",
            description: "The requested product was not found.",
        };

    return {
        title: `${existingProduct.name} by ${existingProduct.brand.name}`,
        description: existingProduct.description,
        authors: [
            {
                name: existingProduct.brand.name,
                url: getAbsoluteURL(`/brands/${existingProduct.brand.id}`),
            },
        ],
        openGraph: {
            type: "website",
            locale: "en_US",
            url: getAbsoluteURL(`/products/${slug}`),
            title: `${existingProduct.name} by ${existingProduct.brand.name}`,
            description: existingProduct.description,
            siteName: siteConfig.name,
            images: [
                {
                    url: existingProduct.imageUrls[0],
                    alt: existingProduct.name,
                    height: 1000,
                    width: 1000,
                },
            ],
        },
        twitter: {
            card: "summary_large_image",
            title: `${existingProduct.name} by ${existingProduct.brand.name}`,
            description: existingProduct.description,
            images: [
                {
                    url: existingProduct.imageUrls[0],
                    alt: existingProduct.name,
                    height: 1000,
                    width: 1000,
                },
            ],
        },
    };
}

export default function Page({ params }: PageProps) {
    return (
        <GeneralShell>
            <Suspense fallback={<>Loading...</>}>
                <ProductFetch params={params} />
            </Suspense>
        </GeneralShell>
    );
}

async function ProductFetch({ params }: PageProps) {
    const { slug } = await params;

    const existingProduct = await productQueries.getProductBySlug(
        slug,
        "published"
    );
    if (!existingProduct) notFound();

    return <ProductPage product={existingProduct} />;
}
