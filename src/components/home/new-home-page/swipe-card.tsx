"use client";

import { Icons } from "@/components/icons";
import { useGuestWishlist } from "@/lib/hooks/useGuestWishlist";
import { trpc } from "@/lib/trpc/client";
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
}

interface SwipeableProductCardProps {
    products: {
        category: string;
        product: Product;
    }[];
    userId?: string;
}

/* --------------------------------------------------------
   SWIPE GUIDE
-------------------------------------------------------- */
const AnimatedSwipeGuide = () => (
    <div className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center">
        <div className="flex animate-pulse items-center gap-2 rounded-full bg-black/60 px-4 py-2 text-sm text-white">
            <Icons.MoreHorizontal className="size-4" />
            Swipe left or right
        </div>
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

    const to = (i: number) => ({
        x: 0,
        y: i * -4,
        scale: 1,
        rot: -10 + Math.random() * 20,
        delay: i * 100,
    });

    const from = (_i: number) => ({ x: 0, rot: 0, scale: 1.2, y: -1000 });

    const [springs, api] = useSprings(filteredProducts.length, (i) => ({
        ...to(i),
        from: from(i),
    }));

    const { mutateAsync: addToWishlist } =
        trpc.general.users.wishlist.addProductInWishlist.useMutation({
            onSuccess: () => toast.success("Added to Wishlist!"),
            onError: (err) =>
                toast.error(err.message || "Could not add to wishlist."),
        });

    const handleSwipe = async (index: number, dir: number) => {
        if (goneCards.has(index)) return;
        setHasInteracted(true);
        setGoneCards((prev) => new Set(prev).add(index));

        const product = filteredProducts[index]?.product;
        if (!product) return;

        api.start((i) =>
            i === index
                ? {
                      x: (window.innerWidth + 200) * dir,
                      rot: dir * 20,
                      scale: 1,
                      config: { tension: 200, friction: 40 },
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
            api.start((i) =>
                i === index ? { display: "none", immediate: true } : {}
            );
        }, 400);
    };

    const bind = useDrag(
        ({
            args: [index],
            down,
            movement: [mx],
            direction: [xDir],
            velocity,
        }) => {
            if (goneCards.has(index)) return;
            setHasInteracted(true);

            const trigger = velocity > 0.2;
            const dir = xDir < 0 ? -1 : 1;

            if (!down && trigger) {
                handleSwipe(index, dir);
                return;
            }

            api.start((i) =>
                i === index
                    ? {
                          x: down ? mx : 0,
                          rot: mx / 15,
                          scale: down ? 1.05 : 1,
                      }
                    : {}
            );
        }
    );

    const showGuide =
        !hasInteracted && goneCards.size === 0 && filteredProducts.length > 0;

    return (
        <section className="w-full bg-[#FCFBF4] px-4 py-10 md:px-16">
            <h2 className="mb-6 py-4 text-center font-serif text-xl text-[#7A6A3A] md:mb-10 md:text-3xl">
                Select What Matters
            </h2>

            {/* ================= MOBILE ================= */}
            <div className="grid grid-cols-2 items-start justify-center gap-4 md:hidden">
                {/* --- MOBILE SWIPE CARD --- */}
                <div className="relative mx-auto h-[203px] w-[139px]">
                    {showGuide && <AnimatedSwipeGuide />}

                    {springs.map(({ x, y, rot, scale }, i) => {
                        const product = filteredProducts[i]?.product;
                        if (!product || goneCards.has(i)) return null;

                        return (
                            <animated.div
                                key={product.id}
                                {...bind(i)}
                                className="absolute h-[203px] w-[139px] rounded-xl bg-white shadow-lg"
                                style={{
                                    transform: interpolate(
                                        [x, y, rot, scale],
                                        (x, y, r, s) =>
                                            `translate3d(${x}px,${y}px,0) rotate(${r}deg) scale(${s})`
                                    ),
                                }}
                            >
                                {/* Image */}
                                <div className="relative h-[120px] w-full overflow-hidden">
                                    <Image
                                        src={
                                            product.media?.[0]?.mediaItem
                                                ?.url ||
                                            "https://4o4vm2cu6g.ufs.sh/f/HtysHtJpctzNNQhfcW4g0rgXZuWwadPABUqnljV5RbJMFsx1"
                                        }
                                        alt={product.title}
                                        fill
                                        className="object-cover"
                                    />
                                </div>

                                {/* Content */}
                                <div className="p-2">
                                    <h3 className="text-[10px] font-medium leading-tight tracking-tight text-muted-foreground">
                                        {product.title}
                                    </h3>

                                    <div className="mt-2 flex items-center justify-between">
                                        <button
                                            onClick={() => handleSwipe(i, -1)}
                                            className="flex size-6 items-center justify-center rounded-full bg-red-500 text-white"
                                        >
                                            <Icons.X className="size-3" />
                                        </button>

                                        <button
                                            onClick={() => handleSwipe(i, 1)}
                                            className="flex size-6 items-center justify-center rounded-full bg-green-500 text-white"
                                        >
                                            <Icons.Heart className="size-3" />
                                        </button>
                                    </div>
                                </div>
                            </animated.div>
                        );
                    })}
                </div>

                {/* --- MOBILE CTA CARD --- */}

<Link
  href="/curious-shift" // ✅ redirect changed here
  className="block h-[193px] w-[169px]
             border border-white/40
             bg-gradient-to-br from-[#B7D3EA] to-[#F7F6E7]
             px-5 pt-6 shadow-lg
             transition
             hover:scale-[1.03] hover:shadow-xl
             focus:outline-none
             focus:ring-2 focus:ring-black focus:ring-offset-2 active:scale-[0.98]
             [-webkit-tap-highlight-color:transparent]
             "
>
  {/* Title */}
  <h2 className="font-serif text-xl font-semibold leading-tight text-gray-900">
    Got <br />
    curiosity?
  </h2>

  <br />

  {/* Subtitle + arrow */}
  <div className="flex items-center gap-3">
    <p className="text-sm italic leading-snug text-gray-600">
      We’ve Got <br /> Secrets.
    </p>

    <Icons.ArrowRight className="size-5 text-gray-800" />
  </div>
</Link>
            </div>

            {/* ================= DESKTOP ================= */}
            <div className="hidden grid-cols-2 items-center gap-12 md:grid">
                {/* Desktop Swipe Cards */}
                <div className="relative mx-auto flex h-[450px] w-full max-w-md items-center justify-center">
                    {showGuide && <AnimatedSwipeGuide />}

                    {springs.map(({ x, y, rot, scale }, i) => {
                        const product = filteredProducts[i]?.product;
                        if (!product || goneCards.has(i)) return null;

                        return (
                            <animated.div
                                key={product.id}
                                {...bind(i)}
                                className="absolute flex size-full max-w-sm cursor-grab flex-col rounded-2xl bg-white shadow-lg"
                                style={{
                                    transform: interpolate(
                                        [x, y, rot, scale],
                                        (x, y, r, s) =>
                                            `translate3d(${x}px,${y}px,0) rotate(${r}deg) scale(${s})`
                                    ),
                                }}
                            >
                                <div className="relative h-[65%] w-full overflow-hidden rounded-t-2xl">
                                    <Image
                                        src={
                                            product.media?.[0]?.mediaItem
                                                ?.url ||
                                            "https://4o4vm2cu6g.ufs.sh/f/HtysHtJpctzNNQhfcW4g0rgXZuWwadPABUqnljV5RbJMFsx1"
                                        }
                                        alt={product.title}
                                        fill
                                        className="object-cover"
                                    />
                                </div>

                                <div className="p-6">
                                    <h3 className="text-2xl font-bold capitalize">
                                        {product.title}
                                    </h3>

                                    <div className="mt-4 flex justify-between">
                                        <button
                                            onClick={() => handleSwipe(i, -1)}
                                            className="size-10 rounded-full bg-red-500 text-white"
                                        >
                                            <Icons.X className="mx-auto size-5" />
                                        </button>

                                        <button
                                            onClick={() => handleSwipe(i, 1)}
                                            className="size-10 rounded-full bg-green-500 text-white"
                                        >
                                            <Icons.Heart className="mx-auto size-5" />
                                        </button>
                                    </div>
                                </div>
                            </animated.div>
                        );
                    })}
                </div>

                {/* Desktop CTA */}
              <Link
  href="/curious-shift"
  className="mx-auto block w-full max-w-md rounded-2xl border
             bg-gradient-to-r from-[#B7D3EA] to-[#F7F6E7]
             p-8 shadow-lg transition
             hover:scale-[1.02] hover:shadow-xl
             focus:outline-none focus:ring-2 focus:ring-black focus:ring-offset-2  [-webkit-tap-highlight-color:transparent]"
>
  <h2 className="font-serif text-3xl text-gray-900">
    Got curiosity?
  </h2>

  <p className="mt-6 italic text-gray-600">
    We’ve Got Secrets.
  </p>

  <Icons.ArrowRight className="mt-4 size-7" />
</Link>
            </div>
        </section>
    );
}
