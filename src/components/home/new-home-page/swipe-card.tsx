"use client";

import { useState, useMemo, useEffect } from "react";
import { useSprings, animated, to as interpolate } from "@react-spring/web";
import { useDrag } from "react-use-gesture";
import Image from "next/image";
import Link from "next/link";
import { Icons } from "@/components/icons";
import { trpc } from "@/lib/trpc/client";
import { toast } from "sonner";
import { useGuestWishlist } from "@/lib/hooks/useGuestWishlist";

// ==========================================================
// 🔹 1. Types
// ==========================================================
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

// ==========================================================
// 🔹 2. Animated Text Guide
// ==========================================================
const AnimatedSwipeGuide = () => (
  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-10 pointer-events-none">
    <div className="flex items-center space-x-2 p-2 bg-black/50 text-white rounded-full text-sm font-medium animate-pulse">
      <Icons.MoreHorizontal className="h-4 w-4" />
      <span>Swipe left or right</span>
    </div>
  </div>
);

// ==========================================================
// 🔹 3. SwipeCard Component (Updated with Toast)
// ==========================================================
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

  // ✅ Corrected tRPC hook name and added toast on success
  const { mutateAsync: addToWishlist } =
    trpc.general.users.wishlist.addProductInWishlist.useMutation({
      onSuccess: () => {
        toast.success("Added to Wishlist!");
      },
      onError: (err) => {
        toast.error(err.message || "Could not add to wishlist.");
      },
    });

  const handleSwipe = async (index: number, dir: number) => {
    if (goneCards.has(index)) return;
    if (!hasInteracted) setHasInteracted(true);
    setGoneCards((prev) => new Set([...prev, index]));

    const product = filteredProducts[index]?.product;
    if (!product) return;

    api.start((i) => {
      if (i !== index) return;
      const x = (200 + window.innerWidth) * dir;
      const rot = dir * 20;
      return {
        x,
        rot,
        scale: 1,
        config: { friction: 50, tension: 200 },
      };
    });

    if (dir === 1) { // On right swipe, add to wishlist
      try {
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
          // ✅ Manually trigger toast for guest users
          toast.success("Added to Wishlist!");
        }
      } catch (err: any) {
        // This will now primarily catch errors from the guest wishlist logic
        toast.error(err.message || "Could not add to wishlist.");
      }
    }

    setTimeout(() => {
      api.start((i) =>
        i === index
          ? {
              display: "none",
              immediate: true,
            }
          : {}
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
      if (down && !hasInteracted) setHasInteracted(true);
      const trigger = velocity > 0.2;
      const dir = xDir < 0 ? -1 : 1;

      if (!down && trigger) {
        handleSwipe(index, dir);
        return;
      }

      api.start((i) => {
        if (i !== index) return;
        const isActive = down && !goneCards.has(index);
        const x = isActive ? mx : 0;
        const rot = mx / 20;
        const scale = isActive ? 1.05 : 1;
        return {
          x,
          rot,
          scale,
          config: { friction: 50, tension: isActive ? 800 : 500 },
        };
      });
    }
  );

  const showGuide = !hasInteracted && goneCards.size === 0 && filteredProducts.length > 0;

  return (
    <div className=" w-full bg-[#F8F5F2] p-8 lg:p-16">
      <div className="grid grid-cols-1 items-center gap-12 lg:grid-cols-2">
        <div className="relative mx-auto flex h-[450px] w-full max-w-md items-center justify-center">
          {showGuide && <AnimatedSwipeGuide />}

          {springs.map(({ x, y, rot, scale }, i) => {
            const product = filteredProducts[i]?.product;
            if (!product || goneCards.has(i)) return null;

            return (
              <animated.div
                key={product.id}
                {...bind(i)}
                className="absolute flex size-full max-w-sm cursor-grab flex-col rounded-2xl bg-white shadow-lg active:cursor-grabbing"
                style={{
                  transform: interpolate(
                    [x, y, rot, scale],
                    (x, y, r, s) =>
                      `translate3d(${x}px,${y}px,0) rotate(${r}deg) scale(${s})`
                  ),
                }}
              >
                <div className="relative w-full grow overflow-hidden rounded-t-2xl">
                  <Image
                    src={
                      product.media[0]?.mediaItem?.url ||
                      "https://4o4vm2cu6g.ufs.sh/f/HtysHtJpctzNNQhfcW4g0rgXZuWwadPABUqnljV5RbJMFsx1"
                    }
                    alt={product.title}
                    fill
                    className="object-cover"
                    sizes="(max-width: 768px) 100vw, 50vw"
                    draggable={false}
                  />
                </div>

                <div className="p-6">
                  <h3 className="text-2xl font-bold capitalize text-gray-900">
                    {product.title}
                  </h3>
                  <div className="mt-4 flex items-center justify-between">
                    <button
                      onClick={() => handleSwipe(i, -1)}
                      className="flex size-10 items-center justify-center rounded-full bg-red-500 text-white shadow-md transition-transform hover:scale-110 hover:bg-red-600"
                      aria-label="Dislike"
                    >
                      <Icons.X className="size-5" />
                    </button>
                    <button
                      onClick={() => handleSwipe(i, 1)}
                      className="flex size-10 items-center justify-center rounded-full bg-green-500 text-white shadow-md transition-transform hover:scale-110 hover:bg-green-600"
                      aria-label="Like"
                    >
                      <Icons.Heart className="size-5" />
                    </button>
                  </div>
                </div>
              </animated.div>
            );
          })}
        </div>

        <div className="mx-auto w-full max-w-md rounded-2xl border border-white/40 bg-white/30 p-8 text-left shadow-lg backdrop-blur-lg">
          <h2 className="font-serif text-3xl text-gray-800">
            Slow Fashion Guide
          </h2>
          <p className="mt-4 text-gray-700">
            Learn how mindful shopping makes an impact. Read our quick guide.
          </p>
          <Link href="/shop" className="mt-6 inline-block">
            <Icons.ArrowRight className="size-8 text-gray-800 transition-colors hover:text-black" />
          </Link>
        </div>
      </div>
    </div>
  );
}
