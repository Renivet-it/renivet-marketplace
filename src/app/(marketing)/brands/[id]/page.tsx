import { BrandPage } from "@/components/brands";
import { GeneralShell } from "@/components/globals/layouts";
import { siteConfig } from "@/config/site";
import { brandCache } from "@/lib/redis/methods";
import { getAbsoluteURL } from "@/lib/utils";
import { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";

interface PageProps {
    params: Promise<{
        id: string;
    }>;
}

export async function generateMetadata({
    params,
}: PageProps): Promise<Metadata> {
    const { id } = await params;

    const existingBrand = await brandCache.get(id);
    if (!existingBrand)
        return {
            title: "Brand not found",
            description: "The requested brand was not found.",
        };

    return {
        title: existingBrand.name,
        description: existingBrand.bio,
        authors: [
            {
                name: `${existingBrand.owner.firstName} ${existingBrand.owner.lastName}`,
                url: getAbsoluteURL(`/brands/${id}`),
            },
        ],
        openGraph: {
            type: "website",
            locale: "en_US",
            url: getAbsoluteURL(`/brands/${id}`),
            title: existingBrand.name,
            description: existingBrand.bio ?? "",
            siteName: siteConfig.name,
            images: [
                {
                    url: existingBrand.coverUrl ?? "",
                    alt: existingBrand.name,
                    height: 1000,
                    width: 1000,
                },
            ],
        },
        twitter: {
            card: "summary_large_image",
            title: existingBrand.name,
            description: existingBrand.bio ?? "",
            images: [
                {
                    url: existingBrand.coverUrl ?? "",
                    alt: existingBrand.name,
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
            <Suspense>
                <BrandFetch params={params} />
            </Suspense>
        </GeneralShell>
    );
}

async function BrandFetch({ params }: PageProps) {
    const { id } = await params;

    const existingBrand = await brandCache.get(id);
    if (!existingBrand) notFound();

    return <BrandPage brand={existingBrand} />;
}
