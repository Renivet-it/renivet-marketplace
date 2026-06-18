"use client";

import { Button } from "@/components/ui/button-general";
import { Spinner } from "@/components/ui/spinner";
import { trpc } from "@/lib/trpc/client";
import { convertPaiseToRupees, formatPriceTag, handleClientError } from "@/lib/utils";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { Gift, Search } from "lucide-react";
import Image from "next/image";

export function RewardSelectionPage() {
    const router = useRouter();
    const [search, setSearch] = useState("");
    const [selectedVariants, setSelectedVariants] = useState<Record<string, string>>({});
    const { data, isLoading } =
        trpc.general.swapRewards.getEligibleRewardProducts.useQuery(
            search ? { search } : undefined
        );

    const { mutateAsync: redeemSwapReward, isPending } =
        trpc.general.swapRewards.redeemSwapReward.useMutation({
            onError: (err) => handleClientError(err),
        });

    const products = useMemo(() => data ?? [], [data]);

    return (
        <div className="space-y-6">
            <div className="rounded-[28px] border border-[#dac79f] bg-[linear-gradient(135deg,#f8efdf_0%,#fffaf1_100%)] p-6">
                <div className="inline-flex items-center gap-2 rounded-full border border-[#d8c195] bg-white/75 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.24em] text-[#8a6b2b]">
                    <Gift className="size-3.5" />
                    Reward Selection
                </div>
                <h1 className="mt-3 font-serif text-3xl font-bold text-[#3d2c0f]">
                    Choose Your Thoughtful Reward
                </h1>
                <p className="mt-2 max-w-2xl text-sm leading-6 text-[#695633]">
                    Pick one approved product priced at {formatPriceTag(1499)} or
                    below. Your reward checkout will show a final payable amount of
                    {` ${formatPriceTag(0)} `}.
                </p>
                <div className="mt-5 flex items-center gap-3 rounded-2xl border border-[#e3d3b0] bg-white px-4 py-3">
                    <Search className="size-4 text-[#9e8552]" />
                    <input
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="Search by product or brand"
                        className="w-full bg-transparent text-sm text-[#3d2c0f] outline-none placeholder:text-[#a08c67]"
                    />
                </div>
            </div>

            {isLoading ? (
                <div className="flex justify-center py-16">
                    <Spinner className="size-8 animate-spin" />
                </div>
            ) : !products.length ? (
                <div className="rounded-3xl border border-dashed border-[#d9c59b] bg-white/70 p-10 text-center text-sm text-[#78633b]">
                    No eligible reward products are available right now.
                </div>
            ) : (
                <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
                    {products.map((product: any) => {
                        const variantOptions = product.eligibleVariants ?? [];
                        const selectedVariantId = selectedVariants[product.id];
                        const selectedVariant = variantOptions.find(
                            (item: any) => item.id === selectedVariantId
                        );
                        const imageSrc =
                            selectedVariant?.mediaItem?.url ??
                            product.media?.[0]?.mediaItem?.url ??
                            "/placeholder.png";
                        const rewardPrice = selectedVariant
                            ? selectedVariant.price
                            : product.price;

                        return (
                            <div
                                key={product.id}
                                className="overflow-hidden rounded-[26px] border border-[#e4d8bc] bg-white shadow-[0_18px_45px_-35px_rgba(98,68,26,0.45)]"
                            >
                                <div className="relative aspect-[4/3] bg-[#f7efe0]">
                                    <Image
                                        src={imageSrc}
                                        alt={product.title}
                                        fill
                                        className="object-cover"
                                    />
                                </div>
                                <div className="space-y-3 p-4">
                                    <div>
                                        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#967744]">
                                            {product.brand?.name}
                                        </p>
                                        <h2 className="mt-1 line-clamp-2 text-lg font-semibold text-[#35240d]">
                                            {product.title}
                                        </h2>
                                    </div>

                                    <p className="text-lg font-bold text-[#8d5e34]">
                                        {formatPriceTag(
                                            +convertPaiseToRupees(rewardPrice ?? 0)
                                        )}
                                    </p>

                                    {variantOptions.length > 0 && (
                                        <select
                                            className="h-11 w-full rounded-xl border border-[#dccaa4] bg-[#fffaf1] px-3 text-sm text-[#43311a] outline-none"
                                            value={selectedVariantId ?? ""}
                                            onChange={(e) =>
                                                setSelectedVariants((current) => ({
                                                    ...current,
                                                    [product.id]: e.target.value,
                                                }))
                                            }
                                        >
                                            <option value="">Choose a variant</option>
                                            {variantOptions.map((variant: any) => (
                                                <option key={variant.id} value={variant.id}>
                                                    {variant.title ||
                                                        variant.combinations
                                                            ?.map((item: any) => item.value)
                                                            .join(" / ") ||
                                                        variant.sku}
                                                </option>
                                            ))}
                                        </select>
                                    )}

                                    <Button
                                        className="h-11 w-full rounded-xl bg-[#9f6840] text-white hover:bg-[#875532]"
                                        disabled={
                                            isPending ||
                                            (variantOptions.length > 0 &&
                                                !selectedVariantId)
                                        }
                                        onClick={async () => {
                                            const result =
                                                await redeemSwapReward({
                                                    productId: product.id,
                                                    ...(selectedVariantId
                                                        ? {
                                                              variantId:
                                                                  selectedVariantId,
                                                          }
                                                        : {}),
                                                });
                                            router.push(result.checkoutHref);
                                        }}
                                    >
                                        {isPending ? "Preparing..." : "Redeem This Reward"}
                                    </Button>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
