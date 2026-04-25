"use client";

import { Icons } from "@/components/icons";
import { useGuestWishlist } from "@/lib/hooks/useGuestWishlist";
import { trpc } from "@/lib/trpc/client";
import { cn, convertPaiseToRupees } from "@/lib/utils";
import { animated, to as interpolate, useSprings } from "@react-spring/web";
import Image from "next/image";
import Link from "next/link";
import { useMemo, useState } from "react";
import { useDrag } from "react-use-gesture";
import { toast } from "sonner";

/* --------------------------------------------------------
   TYPES
-------------------------------------------------------- */
interface Product {
    id: string;
    slug: string;
    media: { mediaItem: { url: string } }[];
    title: string;
    price: number;
    brand?: { name: string };
    variants?: { price: number; compareAtPrice?: number }[];
    compareAtPrice?: number;
}

interface SwipeableProductCardProps {
    products: {
        category: string;
        product: Product;
    }[];
    userId?: string;
}

/* --------------------------------------------------------
   SWIPE HINT OVERLAY (shown on first card until interacted)
-------------------------------------------------------- */
const SwipeHint = () => (
    <div className="pointer-events-none absolute inset-0 z-30 flex flex-col items-center justify-center gap-3">
        <div className="flex items-center gap-6">
            {/* Left arrow */}
            <div className="flex flex-col items-center gap-1 opacity-80">
                <div className="flex h-10 w-10 items-center justify-center rounded-full border-2 border-white/60 bg-black/40 backdrop-blur-sm">
                    <svg className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                    </svg>
                </div>
                <span className="text-[9px] font-bold uppercase tracking-[0.15em] text-white/70">Skip</span>
            </div>

            {/* Hand swipe icon */}
            <div className="flex h-14 w-14 animate-bounce items-center justify-center rounded-full border-2 border-white/40 bg-white/20 backdrop-blur-md shadow-lg">
                <svg className="h-7 w-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M7 11.5V14m0-2.5v-6a1.5 1.5 0 113 0m-3 6a1.5 1.5 0 00-3 0v2a7.5 7.5 0 0015 0v-5a1.5 1.5 0 00-3 0m-6-3V11m0-5.5v-1a1.5 1.5 0 013 0v1m0 0V11m0-5.5a1.5 1.5 0 013 0V11" />
                </svg>
            </div>

            {/* Right arrow */}
            <div className="flex flex-col items-center gap-1 opacity-80">
                <div className="flex h-10 w-10 items-center justify-center rounded-full border-2 border-white/60 bg-[#c8a96e]/60 backdrop-blur-sm">
                    <Icons.Heart className="h-4 w-4 text-white fill-white" />
                </div>
                <span className="text-[9px] font-bold uppercase tracking-[0.15em] text-white/70">Save</span>
            </div>
        </div>
        <span className="rounded-full bg-black/50 px-4 py-1.5 text-[10px] font-semibold uppercase tracking-[0.18em] text-white/90 backdrop-blur-sm">
            Swipe to discover
        </span>
    </div>
);

/* --------------------------------------------------------
   MAIN COMPONENT
-------------------------------------------------------- */
export function SwipeCard({ products, userId }: SwipeableProductCardProps) {
    const { addToGuestWishlist } = useGuestWishlist();

    const filteredProducts = useMemo(
        () => products.filter((p) => p.category === "Swipe Left or Right"),
        [products]
    );

    const [goneCards, setGoneCards] = useState<Set<number>>(new Set());
    const [hasInteracted, setHasInteracted] = useState(false);
    const [swipeDir, setSwipeDir] = useState<Record<number, "left" | "right">>({});

    // Spring config: slight tilt, stacked cards
    const to = (i: number) => ({
        x: 0,
        y: i * -6,
        scale: 1 - i * 0.04,
        rot: -5 + Math.random() * 10,
        delay: i * 80,
        opacity: 1,
    });

    const from = (_i: number) => ({ x: 0, rot: 0, scale: 1.1, y: -800, opacity: 0 });

    const [springs, api] = useSprings(filteredProducts.length, (i) => ({
        ...to(i),
        from: from(i),
    }));

    const { mutateAsync: addToWishlist } =
        trpc.general.users.wishlist.addProductInWishlist.useMutation({
            onSuccess: () => toast.success("Added to Wishlist!"),
            onError: (err) => toast.error(err.message || "Could not add to wishlist."),
        });

    const handleSwipe = async (index: number, dir: number) => {
        if (goneCards.has(index)) return;
        setHasInteracted(true);
        setSwipeDir((prev) => ({ ...prev, [index]: dir === 1 ? "right" : "left" }));
        setGoneCards((prev) => new Set(prev).add(index));

        const product = filteredProducts[index]?.product;
        if (!product) return;

        api.start((i) =>
            i === index
                ? {
                      x: (window.innerWidth + 300) * dir,
                      rot: dir * 25,
                      scale: 1,
                      opacity: 0,
                      config: { tension: 220, friction: 30 },
                  }
                : {}
        );

        if (dir === 1) {
            if (userId) {
                await addToWishlist({ productId: product.id });
            } else {
                addToGuestWishlist({
                    productId: product.id,
                    variantId: null,
                    title: product.title,
                    brand: product.brand?.name,
                    price: product.price,
                    image: product.media?.[0]?.mediaItem?.url ?? null,
                    sku: null,
                    fullProduct: product,
                });
                toast.success("Added to Wishlist!");
            }
        }

        setTimeout(() => {
            api.start((i) => (i === index ? { display: "none", immediate: true } : {}));
        }, 350);
    };

    const bind = useDrag(({ args: [index], down, movement: [mx], direction: [xDir], velocity }) => {
        if (goneCards.has(index)) return;
        setHasInteracted(true);

        const trigger = velocity > 0.25;
        const dir = xDir < 0 ? -1 : 1;

        if (!down && trigger) {
            handleSwipe(index, dir);
            return;
        }

        api.start((i) =>
            i === index
                ? {
                      x: down ? mx : 0,
                      rot: mx / 12,
                      scale: down ? 1.04 : 1,
                  }
                : {}
        );
    });

    const allGone = goneCards.size === filteredProducts.length && filteredProducts.length > 0;
    const showGuide = !hasInteracted && goneCards.size === 0 && filteredProducts.length > 0;

    if (!filteredProducts.length) return null;

    return (
        <section className="w-full bg-white py-10 md:py-14">
            <div className="mx-auto max-w-screen-3xl px-4 sm:px-6 lg:px-8">

                {/* — Header — */}
                <div className="mb-10 md:mb-14">
                    <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-gray-500 md:text-[11px]">
                        Curated For You
                    </span>
                    <h2 className="mt-2 font-playfair text-[28px] font-normal uppercase leading-[1.3] text-gray-900 md:text-[36px]">
                        Swipe &amp; Discover
                    </h2>
                </div>

                {/* — Two-column layout — */}
                <div className="flex flex-col items-center gap-10 md:flex-row md:items-center md:gap-16">

                    {/* ======= SWIPE STACK ======= */}
                    <div className="relative flex h-[420px] w-full max-w-[340px] shrink-0 items-center justify-center self-center md:h-[500px] md:max-w-[400px]">

                        {/* Direction Labels */}
                        <div className="pointer-events-none absolute inset-x-0 top-1/2 z-40 flex -translate-y-1/2 items-center justify-between px-3">
                            <span className="rounded-full bg-black/70 px-3 py-1 text-[9px] font-bold uppercase tracking-widest text-white opacity-0 transition-opacity duration-150 data-[show=true]:opacity-100" data-show={String(hasInteracted)}>
                                Skip
                            </span>
                            <span className="rounded-full bg-[#c8a96e]/90 px-3 py-1 text-[9px] font-bold uppercase tracking-widest text-white opacity-0 transition-opacity duration-150 data-[show=true]:opacity-100" data-show={String(hasInteracted)}>
                                Save ♡
                            </span>
                        </div>

                        {showGuide && <SwipeHint />}

                        {/* Empty state */}
                        {allGone && (
                            <div className="flex flex-col items-center gap-4 text-center">
                                <div className="flex h-16 w-16 items-center justify-center rounded-full border border-gray-200 bg-white">
                                    <Icons.Heart className="h-7 w-7 text-[#c8a96e]" />
                                </div>
                                <p className="text-sm font-medium text-gray-600">You&apos;ve seen everything!</p>
                                <p className="text-xs text-gray-400">Check your wishlist for saved items</p>
                                <Link href="/wishlist" className="mt-2 inline-flex items-center gap-1.5 rounded-sm border border-gray-900 bg-gray-900 px-5 py-2.5 text-[11px] font-bold uppercase tracking-[0.12em] text-white transition hover:bg-transparent hover:text-gray-900">
                                    View Wishlist
                                </Link>
                            </div>
                        )}

                        {/* Cards */}
                        {springs.map(({ x, y, rot, scale }, i) => {
                            const item = filteredProducts[i];
                            const product = item?.product;
                            if (!product || goneCards.has(i)) return null;

                            const imageUrl = product.media?.[0]?.mediaItem?.url || "https://4o4vm2cu6g.ufs.sh/f/HtysHtJpctzNNQhfcW4g0rgXZuWwadPABUqnljV5RbJMFsx1";
                            const rawPrice = product.variants?.[0]?.price ?? product.price ?? 0;
                            const price = Math.round(Number(convertPaiseToRupees(rawPrice)));
                            const originalPrice = product.variants?.[0]?.compareAtPrice ?? product.compareAtPrice;
                            const comparePrice = originalPrice && originalPrice > rawPrice ? Math.round(Number(convertPaiseToRupees(originalPrice))) : null;
                            const isTop = i === filteredProducts.length - 1 - goneCards.size;

                            return (
                                <animated.div
                                    key={product.id}
                                    {...bind(i)}
                                    style={{
                                        transform: interpolate(
                                            [x, y, rot, scale],
                                            (x, y, r, s) => `translate3d(${x}px,${y}px,0) rotate(${r}deg) scale(${s})`
                                        ),
                                        zIndex: i,
                                        touchAction: "none",
                                    }}
                                    className="absolute h-full w-full max-w-[340px] cursor-grab overflow-hidden rounded-xl bg-white shadow-xl active:cursor-grabbing md:max-w-[400px]"
                                >
                                    {/* Product image — tall */}
                                    <div className="relative h-[75%] w-full overflow-hidden bg-[#F5F5F5]">
                                        <Image
                                            src={imageUrl}
                                            alt={product.title}
                                            fill
                                            sizes="(max-width: 768px) 340px, 400px"
                                            className="object-cover"
                                            draggable={false}
                                        />
                                        {/* Gradient overlay at bottom */}
                                        <div className="absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-black/50 to-transparent" />

                                        {/* Brand tag */}
                                        {product.brand?.name && (
                                            <div className="absolute left-3 top-3 rounded-sm bg-white/90 px-2 py-0.5 text-[8px] font-bold uppercase tracking-[0.15em] text-gray-700 backdrop-blur-sm">
                                                {product.brand.name}
                                            </div>
                                        )}

                                        {/* Price on image */}
                                        <div className="absolute bottom-3 left-3 flex items-baseline gap-2">
                                            <span className="text-lg font-semibold text-white">₹{price.toLocaleString()}</span>
                                            {comparePrice && (
                                                <span className="text-xs text-white/60 line-through">₹{comparePrice.toLocaleString()}</span>
                                            )}
                                        </div>
                                    </div>

                                    {/* Card bottom: title + actions */}
                                    <div className="flex items-center justify-between px-4 py-3.5">
                                        <div className="flex-1 pr-4">
                                            <h3 className="truncate text-sm font-medium leading-snug text-gray-900">
                                                {product.title}
                                            </h3>
                                            {isTop && (
                                                <p className="mt-0.5 text-[10px] font-medium uppercase tracking-[0.12em] text-gray-400">
                                                    Swipe to decide
                                                </p>
                                            )}
                                        </div>

                                        {/* Action buttons */}
                                        <div className="flex items-center gap-2.5">
                                            {/* Skip */}
                                            <button
                                                onClick={(e) => { e.stopPropagation(); handleSwipe(i, -1); }}
                                                className="flex h-10 w-10 items-center justify-center rounded-full border-2 border-gray-200 bg-white text-gray-500 shadow-sm transition-all hover:border-gray-900 hover:text-gray-900 hover:scale-110 active:scale-95"
                                                title="Skip"
                                            >
                                                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                                                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                                                </svg>
                                            </button>

                                            {/* View */}
                                            <Link
                                                href={`/products/${product.slug}`}
                                                onClick={(e) => e.stopPropagation()}
                                                className="flex h-10 w-10 items-center justify-center rounded-full border-2 border-gray-200 bg-white text-gray-500 shadow-sm transition-all hover:border-gray-900 hover:text-gray-900 hover:scale-110 active:scale-95"
                                                title="View product"
                                            >
                                                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                                    <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                                </svg>
                                            </Link>

                                            {/* Wishlist / Save */}
                                            <button
                                                onClick={(e) => { e.stopPropagation(); handleSwipe(i, 1); }}
                                                className="flex h-10 w-10 items-center justify-center rounded-full border-2 border-[#c8a96e] bg-[#c8a96e] text-white shadow-sm transition-all hover:bg-[#b8965e] hover:scale-110 active:scale-95"
                                                title="Save to wishlist"
                                            >
                                                <Icons.Heart className="h-4 w-4 fill-white text-white" />
                                            </button>
                                        </div>
                                    </div>
                                </animated.div>
                            );
                        })}
                    </div>

                    {/* ======= RIGHT PANEL ======= */}
                    <div className="flex w-full flex-col gap-4">

                        {/* Got Curiosity Card */}
                        <Link
                            href="/curious-shift"
                            className="group relative flex flex-col justify-between overflow-hidden border border-gray-100 bg-[#fdf8f2] p-7 transition-all duration-300 hover:border-[#d4b896] hover:shadow-lg md:p-8"
                            style={{ minHeight: "220px" }}
                        >
                            <span className="text-[9px] font-bold uppercase tracking-[0.22em] text-[#b8965e]">
                                Renivet Exclusives
                            </span>
                            <div className="my-4">
                                <h3 className="font-playfair text-[32px] font-normal leading-[1.15] text-gray-900 md:text-[38px]">
                                    Got<br />
                                    <em className="not-italic text-gray-400">curiosity?</em>
                                </h3>
                                <p className="mt-2 text-sm italic text-gray-400">
                                    We&apos;ve Got Secrets.
                                </p>
                            </div>
                            <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.16em] text-gray-700 transition-all group-hover:text-gray-900">
                                Explore
                                <svg className="h-3 w-3 transition-transform duration-300 group-hover:translate-x-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" />
                                </svg>
                            </div>
                        </Link>

                        {/* Swipe guide — compact 3-column */}
                        <div className="flex items-stretch gap-3">
                            <div className="flex flex-1 flex-col items-center gap-1.5 border border-gray-100 bg-white py-4">
                                <div className="flex h-8 w-8 items-center justify-center bg-gray-100">
                                    <svg className="h-3.5 w-3.5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                </div>
                                <p className="text-[9px] font-bold uppercase tracking-wider text-gray-400">Skip</p>
                                <p className="text-[8px] text-gray-300">swipe left</p>
                            </div>
                            <div className="flex flex-1 flex-col items-center gap-1.5 border border-[#e8d5b0] bg-[#fdf8f2] py-4">
                                <div className="flex h-8 w-8 items-center justify-center bg-[#f5e8d0]">
                                    <Icons.Heart className="h-3.5 w-3.5 text-[#b8965e]" />
                                </div>
                                <p className="text-[9px] font-bold uppercase tracking-wider text-[#b8965e]">Save</p>
                                <p className="text-[8px] text-gray-400">swipe right</p>
                            </div>
                            <div className="flex flex-1 flex-col items-center gap-1.5 border border-gray-100 bg-white py-4">
                                <div className="flex h-8 w-8 items-center justify-center bg-gray-100">
                                    <svg className="h-3.5 w-3.5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                    </svg>
                                </div>
                                <p className="text-[9px] font-bold uppercase tracking-wider text-gray-400">View</p>
                                <p className="text-[8px] text-gray-300">tap icon</p>
                            </div>
                        </div>

                        {/* Wishlist tracker */}
                        <Link
                            href="/wishlist"
                            className={cn(
                                "group flex items-center justify-between border border-gray-100 bg-white px-4 py-3.5 transition-all hover:border-gray-300",
                                goneCards.size === 0 && "pointer-events-none opacity-35"
                            )}
                        >
                            <div className="flex items-center gap-2.5">
                                <Icons.Heart className="h-3.5 w-3.5 text-[#b8965e]" />
                                <div>
                                    <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-gray-700">Saved Items</p>
                                    <p className="text-[9px] text-gray-400">
                                        {goneCards.size > 0
                                            ? `${[...goneCards].filter(i => swipeDir[i] === "right").length} saved · ${[...goneCards].filter(i => swipeDir[i] === "left").length} skipped`
                                            : "Start swiping"}
                                    </p>
                                </div>
                            </div>
                            <svg className="h-3.5 w-3.5 text-gray-300 transition-transform duration-200 group-hover:translate-x-1 group-hover:text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" />
                            </svg>
                        </Link>
                    </div>
                </div>
            </div>
        </section>
    );
}
