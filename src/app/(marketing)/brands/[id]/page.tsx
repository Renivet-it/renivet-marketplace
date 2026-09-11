import { BrandPage } from "@/components/brands";
import { GeneralShell } from "@/components/globals/layouts";
import { siteConfig } from "@/config/site";
import { brandCache } from "@/lib/redis/methods";
import { getAbsoluteURL } from "@/lib/utils";
import { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { Suspense } from "react";

const UUID_PATTERN =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

interface PageProps {
    params: Promise<{
        id: string;
    }>;
    searchParams: Promise<{
        searchId?: string;
    }>;
}

export async function generateMetadata({
    params,
}: PageProps): Promise<Metadata> {
    const { id } = await params;

    const existingBrand = UUID_PATTERN.test(id)
        ? await brandCache.get(id)
        : await brandCache.getBySlug(id);
    if (!existingBrand)
        return {
            title: "Brand not found",
            description: "The requested brand was not found.",
        };

    const canonicalPath = UUID_PATTERN.test(id)
        ? `/brands/${existingBrand.id}`
        : `/brands/${existingBrand.slug}/shop`;

    return {
        title: existingBrand.name,
        description: existingBrand.bio,
        authors: [
            {
                name: `${existingBrand.owner.firstName} ${existingBrand.owner.lastName}`,
                url: getAbsoluteURL(canonicalPath),
            },
        ],
        openGraph: {
            type: "website",
            locale: "en_US",
            url: getAbsoluteURL(canonicalPath),
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

export default function Page({ params, searchParams }: PageProps) {
    return (
        <GeneralShell>
            <Suspense>
                <BrandFetch params={params} searchParams={searchParams} />
            </Suspense>
        </GeneralShell>
    );
}

async function BrandFetch({ params, searchParams }: PageProps) {
    const { id } = await params;

    if (!UUID_PATTERN.test(id)) {
        const brandBySlug = await brandCache.getBySlug(id);
        if (!brandBySlug) notFound();

        const { searchId } = await searchParams;
        const searchQuery = searchId
            ? `?searchId=${encodeURIComponent(searchId)}`
            : "";
        redirect(`/brands/${brandBySlug.slug}/shop${searchQuery}`);
    }

    const existingBrand = await brandCache.get(id);
    if (!existingBrand) notFound();

    return <BrandPage brand={existingBrand} />;
}
