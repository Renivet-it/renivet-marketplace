"use client";

import { useState, useMemo } from "react";
import { useSprings, animated, to as interpolate } from "@react-spring/web";
import { useDrag } from "react-use-gesture";
import Image from "next/image";
import Link from "next/link";
import { Icons } from "@/components/icons";
import { trpc } from "@/lib/trpc/client";
import { toast } from "sonner";
import { useGuestWishlist } from "@/lib/hooks/useGuestWishlist";

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
  <div className="absolute inset-0 z-10 flex items-center justify-center pointer-events-none">
    <div className="flex items-center gap-2 rounded-full bg-black/60 px-4 py-2 text-sm text-white animate-pulse">
      <Icons.MoreHorizontal className="h-4 w-4" />
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
    ({ args: [index], down, movement: [mx], direction: [xDir], velocity }) => {
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
<h2 className="mb-6 text-center font-serif text-xl text-[#7A6A3A] md:mb-10 md:text-3xl py-4">
  Select What Matters
</h2>

    {/* ================= MOBILE ================= */}
      <div className="grid grid-cols-2 gap-4 md:hidden justify-center items-start">


      {/* --- MOBILE SWIPE CARD --- */}
      <div className="relative h-[203px] w-[139px] mx-auto">
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
              <div className="relative h-[120px] w-full overflow-hidden ">
                <Image
                  src={
                    product.media?.[0]?.mediaItem?.url ||
                    "https://4o4vm2cu6g.ufs.sh/f/HtysHtJpctzNNQhfcW4g0rgXZuWwadPABUqnljV5RbJMFsx1"
                  }
                  alt={product.title}
                  fill
                  className="object-cover"
                />
              </div>

              {/* Content */}
              <div className="p-2">
     <h3 className="text-[10px] font-medium tracking-tight leading-tight text-muted-foreground">
  {product.title}
</h3>


                <div className="mt-2 flex items-center justify-between">
                  <button
                    onClick={() => handleSwipe(i, -1)}
                    className="flex h-6 w-6 items-center justify-center rounded-full bg-red-500 text-white"
                  >
                    <Icons.X className="h-3 w-3" />
                  </button>

                  <button
                    onClick={() => handleSwipe(i, 1)}
                    className="flex h-6 w-6 items-center justify-center rounded-full bg-green-500 text-white"
                  >
                    <Icons.Heart className="h-3 w-3" />
                  </button>
                </div>
              </div>
            </animated.div>
          );
        })}
      </div>

{/* --- MOBILE CTA CARD --- */}
<div
  className="
    h-[193px] w-[169px]
    border border-white/40
    bg-gradient-to-br from-[#B7D3EA] to-[#F7F6E7]
    px-5 pt-6
    shadow-lg
  "
>
  {/* Title */}
  <h2 className="font-serif text-xl font-semibold leading-tight text-gray-900">
    Got <br />
    curiosity?
  </h2>
<br />
  {/* Subtitle block — intentionally NOT flex */}
  <div className=" flex items-center gap-3">
    <p className="text-sm italic leading-snug text-gray-600">
      We’ve Got <br /> Secrets.
    </p>

    <Link href="/shop">
      <Icons.ArrowRight className="h-5 w-5 text-gray-800" />
    </Link>
  </div>
</div>




    </div>

    {/* ================= DESKTOP ================= */}
    <div className="hidden md:grid grid-cols-2 gap-12 items-center">

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
                    product.media?.[0]?.mediaItem?.url ||
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
                    className="h-10 w-10 rounded-full bg-red-500 text-white"
                  >
                    <Icons.X className="h-5 w-5 mx-auto" />
                  </button>

                  <button
                    onClick={() => handleSwipe(i, 1)}
                    className="h-10 w-10 rounded-full bg-green-500 text-white"
                  >
                    <Icons.Heart className="h-5 w-5 mx-auto" />
                  </button>
                </div>
              </div>
            </animated.div>
          );
        })}
      </div>

      {/* Desktop CTA */}
      <div className="mx-auto w-full max-w-md rounded-2xl border bg-gradient-to-r from-[#B7D3EA] to-[#F7F6E7] p-8 shadow-lg">
        <h2 className="font-serif text-3xl text-gray-900">
          Got curiosity?
        </h2>
        <p className="mt-6 italic text-gray-600">
          We’ve Got Secrets.
        </p>
        <Link href="/shop" className="mt-4 inline-block">
          <Icons.ArrowRight className="h-7 w-7" />
        </Link>
      </div>

    </div>
  </section>
  );
}
