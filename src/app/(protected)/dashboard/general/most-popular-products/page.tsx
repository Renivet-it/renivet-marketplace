import { DashShell } from "@/components/globals/layouts";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { productQueries } from "@/lib/db/queries";
import { cn, formatINR, normalizeBrandName } from "@/lib/utils";
import { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";

export const metadata: Metadata = {
    title: "Most Popular Products",
    description: "Review the current global popularity ranking for products.",
};

const PLACEHOLDER_IMAGE_URL =
    "https://4o4vm2cu6g.ufs.sh/f/HtysHtJpctzNNQhfcW4g0rgXZuWwadPABUqnljV5RbJMFsx1";

function getProductDisplayPrice(product: {
    costPerItem?: number | null;
    price?: number | null;
    variants?: Array<{ price?: number | null }>;
}) {
    const paiseAmount =
        product.costPerItem ??
        product.price ??
        product.variants?.find((variant) => (variant.price ?? 0) > 0)?.price ??
        0;

    return formatINR((paiseAmount ?? 0) / 100);
}

export default async function Page() {
    const products = await productQueries.getMostPopularProducts({
        limit: 30,
        days: 30,
    });
    const safeProducts = JSON.parse(JSON.stringify(products));

    return (
        <DashShell className="max-w-8xl">
            <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
                <div className="space-y-1">
                    <h1 className="text-2xl font-bold">
                        Most Popular Products
                    </h1>
                    <p className="max-w-3xl text-sm text-muted-foreground">
                        Global top 30 products ranked from the last 30 days of
                        views, wishlist adds, add-to-carts, and purchases.
                    </p>
                </div>

                <Badge variant="secondary" className="w-fit">
                    Live 30-day ranking
                </Badge>
            </div>

            <div className="overflow-hidden rounded-2xl border bg-background shadow-sm">
                <div className="overflow-x-auto">
                    <table className="min-w-full text-sm">
                        <thead className="bg-muted/40 text-left">
                            <tr className="border-b">
                                <th className="px-4 py-3 font-semibold">
                                    Rank
                                </th>
                                <th className="px-4 py-3 font-semibold">
                                    Product
                                </th>
                                <th className="px-4 py-3 font-semibold">
                                    Brand
                                </th>
                                <th className="px-4 py-3 font-semibold">
                                    Price
                                </th>
                                <th className="px-4 py-3 font-semibold">
                                    Score
                                </th>
                                <th className="px-4 py-3 font-semibold">
                                    Views
                                </th>
                                <th className="px-4 py-3 font-semibold">
                                    Wishlists
                                </th>
                                <th className="px-4 py-3 font-semibold">
                                    ATC
                                </th>
                                <th className="px-4 py-3 font-semibold">
                                    Purchases
                                </th>
                                <th className="px-4 py-3 font-semibold">
                                    Actions
                                </th>
                            </tr>
                        </thead>
                        <tbody>
                            {safeProducts.map((product, index) => {
                                const imageUrl =
                                    product.media?.[0]?.mediaItem?.url ??
                                    PLACEHOLDER_IMAGE_URL;
                                const metrics = product.popularityMetrics;

                                return (
                                    <tr
                                        key={product.id}
                                        className="border-b last:border-0"
                                    >
                                        <td className="p-4 align-top">
                                            <div className="font-semibold text-foreground">
                                                #{index + 1}
                                            </div>
                                        </td>
                                        <td className="p-4 align-top">
                                            <div className="flex min-w-[260px] items-start gap-3">
                                                <div className="relative size-14 overflow-hidden rounded-lg border bg-muted">
                                                    <Image
                                                        src={imageUrl}
                                                        alt={product.title}
                                                        fill
                                                        sizes="56px"
                                                        className="object-cover"
                                                    />
                                                </div>
                                                <div className="space-y-1">
                                                    <div className="font-medium text-foreground">
                                                        {product.title}
                                                    </div>
                                                    <div className="text-xs text-muted-foreground">
                                                        {product.slug}
                                                    </div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="p-4 align-top text-muted-foreground">
                                            {normalizeBrandName(
                                                product.brand?.name
                                            )}
                                        </td>
                                        <td className="p-4 align-top font-medium">
                                            {getProductDisplayPrice(product)}
                                        </td>
                                        <td className="p-4 align-top">
                                            <Badge
                                                variant="outline"
                                                className="font-mono"
                                            >
                                                {product.popularityScore}
                                            </Badge>
                                        </td>
                                        <td className="p-4 align-top">
                                            {metrics.views}
                                        </td>
                                        <td className="p-4 align-top">
                                            {metrics.wishlists}
                                        </td>
                                        <td className="p-4 align-top">
                                            {metrics.addToCarts}
                                        </td>
                                        <td className="p-4 align-top">
                                            {metrics.purchases}
                                        </td>
                                        <td className="p-4 align-top">
                                            <div className="flex min-w-[180px] flex-wrap gap-2">
                                                <Link
                                                    href={`/products/${product.slug}`}
                                                    target="_blank"
                                                    className={cn(
                                                        buttonVariants({
                                                            size: "sm",
                                                            variant: "outline",
                                                        })
                                                    )}
                                                >
                                                    View PDP
                                                </Link>
                                                <Link
                                                    href={`/dashboard/general/products/${product.id}`}
                                                    className={cn(
                                                        buttonVariants({
                                                            size: "sm",
                                                            variant: "secondary",
                                                        })
                                                    )}
                                                >
                                                    Admin View
                                                </Link>
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </div>
        </DashShell>
    );
}
