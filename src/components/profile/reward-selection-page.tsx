"use client";

import { Renivet } from "@/components/svgs";
import { Button } from "@/components/ui/button-general";
import { Spinner } from "@/components/ui/spinner";
import { trpc } from "@/lib/trpc/client";
import {
    cn,
    convertPaiseToRupees,
    formatPriceTag,
    handleClientError,
    normalizeBrandName,
} from "@/lib/utils";
import { Gift, SlidersHorizontal } from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";

const REWARD_CAP = 1499;
const PAGE_SIZE = 8;
const LOADING_SKELETON_COUNT = 20;
const SORT_OPTIONS = [
    { value: "recommended", label: "Recommended" },
    { value: "price_asc", label: "Price: Low to High" },
    { value: "price_desc", label: "Price: High to Low" },
    { value: "newest", label: "Newest First" },
] as const;

export function RewardSelectionPage() {
    const router = useRouter();
    const [page, setPage] = useState(1);
    const [brandId, setBrandId] = useState("");
    const [categoryId, setCategoryId] = useState("");
    const [sortBy, setSortBy] = useState<
        "recommended" | "price_asc" | "price_desc" | "newest"
    >("recommended");
    const [allProducts, setAllProducts] = useState<any[]>([]);
    const [selectedVariants, setSelectedVariants] = useState<
        Record<string, string>
    >({});
    const [pendingAction, setPendingAction] = useState<{
        productId: string;
        mode: "checkout" | "cart";
    } | null>(null);
    const [nextPage, setNextPage] = useState<number | null>(null);
    const processedPagesRef = useRef(new Set<string>());
    const autoLoadTriggerRef = useRef<HTMLButtonElement | null>(null);

    const { data, isLoading, isFetching } =
        trpc.general.swapRewards.getEligibleRewardProducts.useQuery(
            {
                page,
                limit: PAGE_SIZE,
                brandId: brandId || undefined,
                categoryId: categoryId || undefined,
                sortBy,
            }
        );

    const { mutateAsync: redeemSwapReward } =
        trpc.general.swapRewards.redeemSwapReward.useMutation({
            onError: (err) => handleClientError(err),
        });

    useEffect(() => {
        processedPagesRef.current.clear();
        setAllProducts([]);
        setSelectedVariants({});
        setPendingAction(null);
        setPage(1);
        setNextPage(null);
    }, [brandId, categoryId, sortBy]);

    useEffect(() => {
        if (!data) return;

        const pageKey = `${brandId}|${categoryId}|${sortBy}|${data.page}`;
        if (processedPagesRef.current.has(pageKey)) return;
        processedPagesRef.current.add(pageKey);

        setAllProducts((current) => {
            if (data.page === 1) return data.items;

            const existingIds = new Set(current.map((product) => product.id));
            const nextItems = data.items.filter(
                (product: any) => !existingIds.has(product.id)
            );

            return [...current, ...nextItems];
        });

        setNextPage(data.nextPage);
    }, [brandId, categoryId, data, sortBy]);

    useEffect(() => {
        if (!autoLoadTriggerRef.current || !nextPage) return;

        const observer = new IntersectionObserver(
            (entries) => {
                if (!entries[0]?.isIntersecting) return;
                if (isFetching) return;
                if (!nextPage) return;
                setPage(nextPage);
            },
            {
                rootMargin: "0px 0px 500px 0px",
                threshold: 0,
            }
        );

        observer.observe(autoLoadTriggerRef.current);
        return () => observer.disconnect();
    }, [isFetching, nextPage]);

    const products = useMemo(() => allProducts, [allProducts]);

    const getVariantLabel = (product: any, variant: any) => {
        if (variant.title) return variant.title;

        const combinations = Array.isArray(variant.combinations)
            ? variant.combinations
            : Array.isArray(variant.combination)
              ? variant.combination
              : [];

        if (combinations.length > 0) {
            return combinations
                .map((item: any) => item?.value)
                .filter(Boolean)
                .join(" / ");
        }

        if (
            product?.options?.length &&
            variant?.combinations &&
            typeof variant.combinations === "object"
        ) {
            const labels = product.options
                .map((option: any) => {
                    const valueId = variant.combinations?.[option.id];
                    const matchedValue = option.values?.find(
                        (value: any) => value.id === valueId
                    );

                    return matchedValue?.name ?? null;
                })
                .filter(Boolean);

            if (labels.length > 0) {
                return labels.join(" / ");
            }
        }

        return variant.sku || "Variant";
    };

    const showGridLoading = (isLoading || isFetching) && !products.length;
    const brands = data?.facets?.brands ?? [];
    const categories = data?.facets?.categories ?? [];

    return (
        <div className="w-full space-y-6 md:space-y-8 md:basis-3/4">
            <section className="relative overflow-hidden rounded-[24px] border border-[#e0d2b9] bg-[linear-gradient(135deg,#fbf7ef_0%,#f6ecda_55%,#f2e3c3_100%)] shadow-[0_28px_70px_-48px_rgba(99,66,28,0.45)]">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(255,255,255,0.88),transparent_34%),radial-gradient(circle_at_bottom_right,rgba(211,171,99,0.14),transparent_26%)]" />
                <div className="absolute -right-10 top-8 hidden size-28 rounded-full bg-[#d7b06b]/12 blur-3xl md:block" />

                <div className="relative min-h-[200px] p-4 sm:min-h-[190px] sm:p-5 lg:p-5">
                    <div>
                        <div className="inline-flex items-center gap-2 rounded-full border border-[#dcc7a2] bg-white/80 px-3 py-1 text-xs font-semibold uppercase tracking-[0.24em] text-[#8a6830]">
                            <Gift className="size-3.5" />
                            Reward Selection
                        </div>

                        <h1 className="mt-3 max-w-[11ch] font-serif text-[1.45rem] font-semibold leading-[1.02] text-[#3f2b16] sm:text-[1.75rem] lg:text-[1.95rem]">
                            Choose your Renivet reward
                        </h1>

                        <p className="mt-2 max-w-xl text-[13px] leading-5 text-[#705938] sm:text-sm">
                            Pick one approved piece priced at{" "}
                            {formatPriceTag(REWARD_CAP)} or below. Reward
                            checkout completes at {formatPriceTag(0)}.
                        </p>

                        <div
                            className={cn(
                                "mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-4"
                            )}
                        >
                            <div className="flex h-12 w-full items-center gap-2 rounded-[16px] border border-[#e5d7bd] bg-white/80 px-3 py-2">
                                <SlidersHorizontal className="size-4 text-[#9d8351]" />
                                <span className="text-xs font-semibold uppercase tracking-[0.16em] text-[#9d8351]">
                                    Filters
                                </span>
                            </div>

                            <select
                                value={categoryId}
                                onChange={(e) => setCategoryId(e.target.value)}
                                className="h-12 w-full rounded-[16px] border border-[#e5d7bd] bg-white/80 px-3 text-sm text-[#43311a] outline-none transition focus:border-[#b98a57]"
                            >
                                <option value="">All categories</option>
                                {categories.map(
                                    (category: { id: string; name: string }) => (
                                        <option key={category.id} value={category.id}>
                                            {category.name}
                                        </option>
                                    )
                                )}
                            </select>

                            <select
                                value={brandId}
                                onChange={(e) => setBrandId(e.target.value)}
                                className="h-12 w-full rounded-[16px] border border-[#e5d7bd] bg-white/80 px-3 text-sm text-[#43311a] outline-none transition focus:border-[#b98a57]"
                            >
                                <option value="">All brands</option>
                                {brands.map((brand: { id: string; name: string }) => (
                                    <option key={brand.id} value={brand.id}>
                                        {brand.name}
                                    </option>
                                ))}
                            </select>

                            <select
                                value={sortBy}
                                onChange={(e) =>
                                    setSortBy(
                                        e.target.value as
                                            | "recommended"
                                            | "price_asc"
                                            | "price_desc"
                                            | "newest"
                                    )
                                }
                                className="h-12 w-full rounded-[16px] border border-[#e5d7bd] bg-white/80 px-3 text-sm text-[#43311a] outline-none transition focus:border-[#b98a57]"
                            >
                                {SORT_OPTIONS.map((option) => (
                                    <option key={option.value} value={option.value}>
                                        {option.label}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>
                </div>
            </section>

            {showGridLoading ? (
                <div
                    className="grid min-h-[calc(100vh-10rem)] grid-cols-2 gap-x-3 gap-y-6 pb-10 md:grid-cols-3 md:gap-x-4 md:gap-y-8 lg:grid-cols-4 lg:gap-x-4 lg:gap-y-8 xl:grid-cols-4"
                    aria-hidden="true"
                >
                    {Array.from({ length: LOADING_SKELETON_COUNT }).map(
                        (_, index) => (
                            <div
                                key={index}
                                className="flex h-full animate-pulse flex-col"
                            >
                                <div className="aspect-[3/4] rounded-sm bg-[#f3ebde]" />

                                <div className="min-h-[5.25rem] space-y-1.5 py-2">
                                    <div className="h-3 w-16 rounded-full bg-[#ece1d0]" />
                                    <div className="h-4 w-4/5 rounded-full bg-[#eadfcf]" />
                                    <div className="h-3 w-24 rounded-full bg-[#ece1d0]" />
                                </div>

                                <div className="mt-auto rounded-2xl border border-[#e9decb] bg-[#fffdfa] p-3">
                                    <div className="h-[52px] rounded-[14px] bg-[#f7efe2]" />
                                    <div className="mt-2 flex gap-2">
                                        <div className="h-10 flex-1 rounded-xl bg-[#efe3d4]" />
                                        <div className="h-10 flex-1 rounded-xl bg-[#f3e8d8]" />
                                    </div>
                                </div>
                            </div>
                        )
                    )}
                </div>
            ) : !products.length ? (
                <div className="rounded-[28px] border border-dashed border-[#dcc9a2] bg-[linear-gradient(180deg,#fffdf8_0%,#f9f2e6_100%)] p-10 text-center">
                    <h2 className="font-serif text-2xl font-semibold text-[#3d2c14]">
                        No rewards available right now
                    </h2>
                    <p className="mx-auto mt-2 max-w-xl text-sm leading-6 text-[#766240]">
                        We could not find any eligible items for these filters.
                    </p>
                </div>
            ) : (
                <>
                    <div className="grid min-h-[calc(100vh-10rem)] grid-cols-2 gap-x-3 gap-y-6 pb-10 md:grid-cols-3 md:gap-x-4 md:gap-y-8 lg:grid-cols-4 lg:gap-x-4 lg:gap-y-8 xl:grid-cols-4">
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
                            const canRedeem =
                                !variantOptions.length || !!selectedVariantId;
                            const isPreparingCheckout =
                                pendingAction?.productId === product.id &&
                                pendingAction.mode === "checkout";
                            const isPreparingCart =
                                pendingAction?.productId === product.id &&
                                pendingAction.mode === "cart";
                            const isCardBusy =
                                pendingAction?.productId === product.id;
                            const sizeOption =
                                product.options?.find((option: any) =>
                                    option.name?.toLowerCase().includes("size")
                                ) ?? null;
                            const canShowSizePills =
                                !!sizeOption &&
                                product.options?.length === 1 &&
                                variantOptions.length > 0 &&
                                variantOptions.every(
                                    (variant: any) =>
                                        variant.combinations &&
                                        typeof variant.combinations === "object"
                                );

                            return (
                                <article
                                    key={product.id}
                                    className="group flex h-full flex-col"
                                >
                                    <div className="relative aspect-[3/4] overflow-hidden bg-[#f5f5f5] rounded-sm">
                                        <Image
                                            src={imageSrc}
                                            alt={product.title}
                                            fill
                                            sizes="(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 25vw"
                                            className="object-cover transition-all duration-300 ease-in-out group-hover:scale-105"
                                        />

                                        <span className="absolute left-0 top-2 z-20 rounded-r-sm bg-[#b06f3f] px-2 py-0.5 text-[9px] font-bold uppercase tracking-wide text-white">
                                            Reward Edit
                                        </span>

                                        <span className="absolute right-3 top-3 z-20 rounded-full bg-white/88 px-2.5 py-1 text-[10px] font-semibold text-[#8a592d] backdrop-blur">
                                            {formatPriceTag(0)}
                                        </span>
                                    </div>

                                    <div className="min-h-[5.25rem] space-y-1.5 pb-2 pt-2">
                                        <p className="truncate text-[10px] text-[#7f7662]">
                                            {normalizeBrandName(
                                                product.brand?.name ?? "Renivet Edit"
                                            )}
                                        </p>

                                        <h2 className="line-clamp-2 text-[13px] font-normal leading-tight text-gray-800 sm:text-sm">
                                            {product.title}
                                        </h2>

                                        <div className="flex items-baseline gap-1.5">
                                            <span className="text-[12px] font-semibold text-gray-900">
                                                {formatPriceTag(0)}
                                            </span>
                                            <span className="text-[10px] text-gray-400 line-through">
                                                {formatPriceTag(
                                                    +convertPaiseToRupees(
                                                        rewardPrice ?? 0
                                                    )
                                                )}
                                            </span>
                                        </div>

                                        <div className="hidden flex-wrap items-center gap-2 pt-0.5 sm:flex">
                                            <span className="inline-flex items-center gap-1.5 rounded-md border border-[#e7e2d8] bg-[#fcfaf6] px-2 py-1 text-[10px] font-medium text-[#564c3d]">
                                                Free reward
                                            </span>
                                            <span className="inline-flex items-center gap-1.5 rounded-md border border-[#dde6f2] bg-[#f8fbff] px-2 py-1 text-[10px] font-medium text-[#355272]">
                                                Under {formatPriceTag(REWARD_CAP)}
                                            </span>
                                        </div>
                                    </div>

                                    <div className="mt-auto flex flex-1 flex-col justify-end rounded-xl border border-[#f3e9d8] bg-white p-3 shadow-xs">
                                        <div className="flex items-center justify-between gap-3 rounded-[12px] bg-gradient-to-br from-[#fdfbf7] to-[#f9f3e6] border border-[#f3e9d8]/80 p-2.5 shadow-2xs">
                                            <div>
                                                <p className="text-[9px] font-bold uppercase tracking-[0.14em] text-[#8a7251]">
                                                    Final payable
                                                </p>
                                                <p className="mt-0.5 text-sm font-bold text-[#b06f3f]">
                                                    {formatPriceTag(0)}
                                                </p>
                                            </div>

                                            <div className="h-6 w-px bg-[#ebdcb8]" />

                                            <div className="text-right">
                                                <p className="text-[9px] font-bold uppercase tracking-[0.14em] text-[#8a7251]">
                                                    Product value
                                                </p>
                                                <p className="mt-0.5 text-xs font-semibold text-gray-700 sm:text-sm">
                                                    {formatPriceTag(
                                                        +convertPaiseToRupees(
                                                            rewardPrice ?? 0
                                                        )
                                                    )}
                                                </p>
                                            </div>
                                        </div>

                                        {variantOptions.length > 0 &&
                                            canShowSizePills && (
                                                <div className="mt-3 space-y-2">
                                                    <label className="text-[9px] font-bold uppercase tracking-[0.18em] text-[#8a7251] block">
                                                        Choose size
                                                    </label>

                                                    <div className="flex flex-wrap gap-1.5">
                                                        {variantOptions.map(
                                                            (variant: any) => {
                                                                const valueId =
                                                                    variant
                                                                        .combinations?.[
                                                                        sizeOption
                                                                            .id
                                                                    ];
                                                                const matchedValue =
                                                                    sizeOption.values?.find(
                                                                        (
                                                                            value: any
                                                                        ) =>
                                                                            value.id ===
                                                                            valueId
                                                                    );
                                                                const label =
                                                                    matchedValue?.name ??
                                                                    getVariantLabel(
                                                                        product,
                                                                        variant
                                                                    );
                                                                const isSelected =
                                                                    selectedVariantId ===
                                                                    variant.id;

                                                                return (
                                                                    <button
                                                                        key={
                                                                            variant.id
                                                                        }
                                                                        type="button"
                                                                        onClick={() =>
                                                                            setSelectedVariants(
                                                                                (
                                                                                    current
                                                                                ) => ({
                                                                                    ...current,
                                                                                    [product.id]:
                                                                                        variant.id,
                                                                                })
                                                                            )
                                                                        }
                                                                        className={cn(
                                                                            "min-w-[48px] rounded-lg border px-2.5 py-1 text-xs font-semibold transition-all duration-200",
                                                                            isSelected
                                                                                ? "border-[#b06f3f] bg-[#b06f3f] text-white shadow-[0_8px_16px_-10px_rgba(176,111,63,0.8)]"
                                                                                : "border-[#e5decb] bg-white text-[#7d5530] hover:border-[#b06f3f] hover:bg-[#fffcf7]"
                                                                        )}
                                                                    >
                                                                        {label}
                                                                    </button>
                                                                );
                                                            }
                                                        )}
                                                    </div>
                                                </div>
                                            )}

                                        {variantOptions.length > 0 &&
                                            !canShowSizePills && (
                                                <div className="mt-3 space-y-1.5">
                                                    <label className="text-[9px] font-bold uppercase tracking-[0.18em] text-[#8a7251] block">
                                                        Choose a variant
                                                    </label>

                                                    <select
                                                        className="h-9 w-full rounded-lg border border-[#e5decb] bg-white px-3 text-xs font-semibold text-gray-700 outline-none transition-all hover:border-[#b06f3f] focus:border-[#b06f3f] focus:ring-1 focus:ring-[#b06f3f] cursor-pointer"
                                                        value={
                                                            selectedVariantId ??
                                                            ""
                                                        }
                                                        onChange={(e) =>
                                                            setSelectedVariants(
                                                                (current) => ({
                                                                    ...current,
                                                                    [product.id]:
                                                                        e.target
                                                                            .value,
                                                                })
                                                            )
                                                        }
                                                    >
                                                        <option value="">
                                                            Choose a variant
                                                        </option>
                                                        {variantOptions.map(
                                                            (variant: any) => (
                                                                <option
                                                                    key={
                                                                        variant.id
                                                                    }
                                                                    value={
                                                                        variant.id
                                                                    }
                                                                >
                                                                    {getVariantLabel(
                                                                        product,
                                                                        variant
                                                                    )}
                                                                </option>
                                                            )
                                                        )}
                                                    </select>
                                                </div>
                                            )}

                                        {variantOptions.length === 0 && (
                                            <div className="mt-3 h-[3.25rem] flex items-center justify-center rounded-lg bg-[#faf8f4] border border-dashed border-[#e6dcce]">
                                                <span className="text-[10px] font-semibold uppercase tracking-wider text-[#a49683]">
                                                    No variant required
                                                </span>
                                            </div>
                                        )}

                                        <div className="mt-3 flex gap-2">
                                            <Button
                                                className="h-9 flex-1 rounded-lg bg-[#b06f3f] text-xs font-semibold text-white shadow-[0_8px_16px_-10px_rgba(176,111,63,0.8)] transition hover:bg-[#975c31]"
                                                disabled={isCardBusy || !canRedeem}
                                                onClick={async () => {
                                                    try {
                                                        setPendingAction({
                                                            productId: product.id,
                                                            mode: "checkout",
                                                        });
                                                        const result =
                                                            await redeemSwapReward({
                                                                productId:
                                                                    product.id,
                                                                ...(selectedVariantId
                                                                    ? {
                                                                          variantId:
                                                                              selectedVariantId,
                                                                        }
                                                                    : {}),
                                                                mode: "checkout",
                                                            });

                                                        router.push(
                                                            result.checkoutHref
                                                        );
                                                    } finally {
                                                        setPendingAction(null);
                                                    }
                                                }}
                                            >
                                                {isPreparingCheckout
                                                    ? "Redeeming..."
                                                    : "Redeem now"}
                                            </Button>

                                            <Button
                                                variant="outline"
                                                className="h-9 flex-1 rounded-lg border-[#ebdcb8] bg-white text-xs font-semibold text-[#b06f3f] hover:bg-[#fffcf7] hover:border-[#b06f3f] hover:text-[#b06f3f]"
                                                disabled={isCardBusy || !canRedeem}
                                                onClick={async () => {
                                                    try {
                                                        setPendingAction({
                                                            productId: product.id,
                                                            mode: "cart",
                                                        });
                                                        const result =
                                                            await redeemSwapReward({
                                                                productId:
                                                                    product.id,
                                                                ...(selectedVariantId
                                                                    ? {
                                                                          variantId:
                                                                              selectedVariantId,
                                                                        }
                                                                    : {}),
                                                                mode: "cart",
                                                            });

                                                        router.push(
                                                            result.cartHref
                                                        );
                                                    } finally {
                                                        setPendingAction(null);
                                                    }
                                                }}
                                            >
                                                {isPreparingCart
                                                    ? "Adding..."
                                                    : "Add to cart"}
                                            </Button>
                                        </div>
                                    </div>
                                </article>
                            );
                        })}
                    </div>

                    <div className="mt-1 flex flex-col items-center gap-3 border-t border-[#e4e0d6] py-8">
                        {nextPage ? (
                            <Button
                                ref={
                                    autoLoadTriggerRef as React.RefObject<HTMLButtonElement>
                                }
                                onClick={() => setPage(nextPage)}
                                disabled={isFetching}
                                className="min-w-[180px] rounded-full border border-[#d2dbe5] bg-white px-7 text-[#243754] shadow-none hover:bg-[#f5f8fc]"
                            >
                                {isFetching && products.length > 0 ? (
                                    <span className="inline-flex items-center gap-2">
                                        <Spinner className="size-4 animate-spin" />
                                        Loading...
                                    </span>
                                ) : (
                                    "Show more"
                                )}
                            </Button>
                        ) : (
                            <p className="text-sm text-[#8b7650]">
                                You&apos;ve reached the end of the reward collection.
                            </p>
                        )}
                    </div>
                </>
            )}
        </div>
    );
}
