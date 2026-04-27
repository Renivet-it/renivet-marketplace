"use client";

import { getEstimatedDelivery } from "@/actions/shiprocket/get-estimate-delivery";
import { ProductCartAddForm } from "@/components/globals/forms";
import { ProductShareModal } from "@/components/globals/modals";
import { trpc } from "@/lib/trpc/client";
import { cn } from "@/lib/utils";
import { CachedCart, ProductWithBrand } from "@/lib/validations";
import { Leaf, Package2, RefreshCw, ShieldCheck, Truck } from "lucide-react";
import { useEffect, useState, useTransition } from "react";

interface PageProps extends GenericProps {
    initialCart?: CachedCart[];
    product: ProductWithBrand;
    isWishlisted: boolean;
    userId?: string;
}

function seededRandom(seed: number) {
    const x = Math.sin(seed) * 10000;
    return x - Math.floor(x);
}

function stringToSeed(str: string) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        hash = str.charCodeAt(i) + ((hash << 5) - hash);
    }
    return Math.abs(hash);
}

function getRandomRatingAndReviews(seed: number) {
    const rating = Math.round((4.0 + seededRandom(seed) * 0.6) * 10) / 10;
    const reviews = Math.floor(seededRandom(seed + 1) * 71) + 10;
    return { rating, reviews };
}

export function ProductContent({
    className,
    initialCart,
    product,
    isWishlisted,
    userId,
    ...props
}: PageProps) {
    const [isProductShareModalOpen, setIsProductShareModalOpen] =
        useState(false);
    const [isProductWishlisted, setIsProductWishlisted] =
        useState(isWishlisted);
    const [, startTransition] = useTransition();
    const [, setZipCode] = useState<string | null>(null);
    const [estimatedDelivery, setEstimatedDelivery] = useState<string>("");

    const { data: brandDetails } =
        trpc.general.addresses.getBrandConfidential.useQuery({
            brandId: product.brand.id,
        });

    const { data: user } = trpc.general.users.currentUser.useQuery();

    const seed = stringToSeed(product.id || product.title);
    const { rating, reviews } = getRandomRatingAndReviews(seed);

    useEffect(() => {
        if (user?.addresses[0]?.zip && brandDetails?.warehousePostalCode) {
            startTransition(async () => {
                try {
                    const result = await getEstimatedDelivery({
                        pickupPostcode: Number(brandDetails.warehousePostalCode),
                        deliveryPostcode: Number(user.addresses[0].zip),
                    });

                    if (
                        result?.data?.data?.available_courier_companies?.length >
                        0
                    ) {
                        const estimatedDateStr =
                            result.data.data.available_courier_companies[0].etd;

                        if (!estimatedDateStr) return;

                        const estimatedDate = new Date(estimatedDateStr);
                        const today = new Date();

                        if (isNaN(estimatedDate.getTime())) return;
                        if (estimatedDate <= today) return;

                        const formattedDate = estimatedDate.toLocaleDateString(
                            "en-US",
                            {
                                weekday: "short",
                                month: "short",
                                day: "numeric",
                            }
                        );
                        setZipCode(user.addresses[0].zip);
                        setEstimatedDelivery(formattedDate);
                    }
                } catch {
                    // Silent fail
                }
            });
        }
    }, [user, brandDetails, startTransition]);

    return (
        <>
            <div className={cn("", className)} {...props}>
                {/* ── Brand name (small caps) ── */}
                <p className="mb-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-neutral-500">
                    {product.brand.name}
                </p>

                {/* ── Product title ── */}
                <h1 className="mb-2 font-sans text-[1.6rem] font-semibold leading-tight text-neutral-900 md:text-[1.85rem]">
                    {product.title}
                </h1>

                {/* ── Style number ── */}
                <p className="mb-4 text-[11px] uppercase tracking-[0.1em] text-neutral-400">
                    Style #{product.id.slice(0, 8).toUpperCase()}
                </p>

                {/* ── Star rating ── */}
                <div className="mb-5 flex items-center gap-2">
                    <div className="flex items-center gap-0.5">
                        {[...Array(5)].map((_, i) => {
                            const starValue = i + 1;
                            return (
                                <svg
                                    key={i}
                                    viewBox="0 0 24 24"
                                    className="size-4"
                                    fill={
                                        rating >= starValue
                                            ? "#1a1a1a"
                                            : rating >= starValue - 0.5
                                              ? "url(#half)"
                                              : "none"
                                    }
                                    stroke={
                                        rating >= starValue - 0.5
                                            ? "#1a1a1a"
                                            : "#d1d5db"
                                    }
                                    strokeWidth={1.5}
                                >
                                    <defs>
                                        <linearGradient id="half">
                                            <stop offset="50%" stopColor="#1a1a1a" />
                                            <stop offset="50%" stopColor="transparent" />
                                        </linearGradient>
                                    </defs>
                                    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                                </svg>
                            );
                        })}
                    </div>
                    <button className="text-[13px] font-medium text-neutral-500 underline underline-offset-2 hover:text-neutral-800 transition-colors">
                        {reviews} Reviews
                    </button>
                </div>

                {/* ── Divider ── */}
                <div className="mb-6 border-t border-neutral-200" />



                {/* ── Cart add form (prices + selectors + buttons) ── */}
                <ProductCartAddForm
                    product={product}
                    isWishlisted={isWishlisted}
                    isProductWishlisted={isProductWishlisted}
                    setIsProductWishlisted={setIsProductWishlisted}
                    initialCart={initialCart}
                    userId={userId}
                    initialZipCode={user?.addresses[0]?.zip}
                    warehousePincode={brandDetails?.warehousePostalCode}
                    estimatedDelivery={estimatedDelivery}
                    setZipCode={setZipCode}
                    setEstimatedDelivery={setEstimatedDelivery}
                />

                {/* ── Divider ── */}
                <div className="my-7 border-t border-neutral-200" />

                {/* ── Service promises (Patagonia icons row) ── */}
                <div className="mb-7 grid grid-cols-2 gap-3 sm:grid-cols-4">
                    {[
                        { icon: Truck, label: "Free Shipping", sub: "Orders ₹999+" },
                        {
                            icon: RefreshCw,
                            label: "Easy Returns",
                            sub: "15-day window",
                        },
                        { icon: ShieldCheck, label: "Genuine", sub: "100% Authentic" },
                        { icon: Leaf, label: "Mindful", sub: "Eco materials" },
                    ].map(({ icon: Icon, label, sub }) => (
                        <div
                            key={label}
                            className="flex flex-col items-center gap-1.5 rounded-xl border border-neutral-200 bg-neutral-50 px-2 py-3 text-center"
                        >
                            <Icon className="size-5 text-neutral-700" strokeWidth={1.5} />
                            <span className="block text-[11px] font-semibold uppercase tracking-[0.06em] text-neutral-800">
                                {label}
                            </span>
                            <span className="block text-[10px] text-neutral-400">
                                {sub}
                            </span>
                        </div>
                    ))}
                </div>

                {/* ── Sustainability badge strip ── */}
                <div className="mt-7 flex flex-wrap gap-2">
                    <span className="inline-flex items-center gap-1.5 rounded-full border border-green-200 bg-green-50 px-3 py-1 text-[11px] font-semibold text-green-800">
                        <Leaf className="size-3" />
                        Regenerative Materials
                    </span>
                    <span className="inline-flex items-center gap-1.5 rounded-full border border-neutral-200 bg-neutral-50 px-3 py-1 text-[11px] font-semibold text-neutral-700">
                        <Package2 className="size-3" />
                        Conscious Brand
                    </span>
                    <span className="inline-flex items-center gap-1.5 rounded-full border border-blue-100 bg-blue-50 px-3 py-1 text-[11px] font-semibold text-blue-800">
                        <ShieldCheck className="size-3" />
                        Renivet Verified
                    </span>
                </div>

            </div>

            <ProductShareModal
                isOpen={isProductShareModalOpen}
                setIsOpen={setIsProductShareModalOpen}
                product={product}
            />
        </>
    );
}
