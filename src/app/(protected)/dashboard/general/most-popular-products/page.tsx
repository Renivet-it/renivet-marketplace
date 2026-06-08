import { MostPopularBestSellerAction } from "@/components/dashboard/general/products/most-popular-best-seller-action";
import { SafeAdminImage } from "@/components/dashboard/general/safe-admin-image";
import { DashShell } from "@/components/globals/layouts";
import { Icons } from "@/components/icons";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button-dash";
import { productQueries } from "@/lib/db/queries";
import { cn, formatINR, normalizeBrandName } from "@/lib/utils";
import { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
    title: "Most Popular Products",
    description: "Top 30 products ranked by 30-day popularity score.",
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
                    <p className="max-w-4xl text-sm text-muted-foreground">
                        Top 30 products ranked by a 30-day weighted popularity
                        score based on PDP views, wishlist adds, add-to-carts,
                        and purchases.
                    </p>
                    <p className="text-xs text-muted-foreground">
                        Score = (views x 1) + (wishlist adds x 3) + (add to
                        carts x 5) + (purchases x 8)
                    </p>
                </div>

                <Badge
                    variant="outline"
                    className="w-fit border-slate-300 bg-white text-slate-700"
                >
                    Live 30-day ranking
                </Badge>
            </div>

            <div className="overflow-hidden rounded-2xl border bg-background shadow-sm">
                <div className="overflow-x-auto">
                    <table className="min-w-[1500px] text-sm">
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
                                    PDP Views
                                </th>
                                <th className="px-4 py-3 font-semibold">
                                    Wishlist Adds
                                </th>
                                <th className="px-4 py-3 font-semibold">
                                    Add To Carts
                                </th>
                                <th className="px-4 py-3 font-semibold">
                                    Purchases
                                </th>
                                <th className="sticky right-0 z-10 min-w-[190px] bg-muted/40 px-4 py-3 text-right font-semibold shadow-[-8px_0_16px_-16px_rgba(15,23,42,0.45)]">
                                    Action
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
                                            <div className="flex min-w-[280px] items-start gap-3">
                                                <div className="relative size-14 overflow-hidden rounded-lg border bg-muted">
                                                    <SafeAdminImage
                                                        src={imageUrl}
                                                        alt={product.title}
                                                        fill
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
                                                className="border-slate-300 bg-slate-50 font-mono text-slate-700"
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
                                        <td className="sticky right-0 bg-background p-4 align-top shadow-[-8px_0_16px_-16px_rgba(15,23,42,0.45)]">
                                            <div className="flex min-w-[190px] items-center justify-end gap-2 whitespace-nowrap">
                                                <MostPopularBestSellerAction
                                                    productId={product.id}
                                                    isBestSeller={
                                                        product.isBestSeller
                                                    }
                                                    bestSellerPosition={
                                                        product.bestSellerPosition
                                                    }
                                                />
                                                <Link
                                                    href={`/products/${product.slug}`}
                                                    target="_blank"
                                                    title="View PDP"
                                                    className={cn(
                                                        buttonVariants({
                                                            size: "icon",
                                                            variant: "outline",
                                                        }),
                                                        "size-9 shrink-0 border-slate-200 bg-white text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                                                    )}
                                                >
                                                    <Icons.ExternalLink className="size-4" />
                                                    <span className="sr-only">
                                                        View PDP
                                                    </span>
                                                </Link>
                                                <Link
                                                    href={`/dashboard/general/products/${product.id}`}
                                                    title="Admin View"
                                                    className={cn(
                                                        buttonVariants({
                                                            size: "icon",
                                                            variant: "outline",
                                                        }),
                                                        "size-9 shrink-0 border-zinc-300 bg-zinc-900 text-white hover:bg-zinc-800 hover:text-white"
                                                    )}
                                                >
                                                    <Icons.Eye className="size-4" />
                                                    <span className="sr-only">
                                                        Admin View
                                                    </span>
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
