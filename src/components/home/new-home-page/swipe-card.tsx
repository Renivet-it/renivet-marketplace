"use client";

import { animated, useSprings } from "@react-spring/web";
import { useDrag } from "react-use-gesture";
import { useState, useMemo } from "react"; // Import useMemo
import Link from "next/link";
import Image from "next/image";
import { Icons } from "@/components/icons";

// --- INTERFACE UPDATED ---
// Added 'category' to the Product interface
interface Product {
  slug: any;
  id: string;
  media: { mediaItem: { url:string } }[];
  title: string;
  description?: string;
  category?: string; // Assuming category is an optional string
}

interface SwipeableProductCardProps {
  products: {
      category: string; product: Product
}[];
}

// --- MAIN COMPONENT ---
export function SwipeCard({ products }: SwipeableProductCardProps) {
  // --- FILTERING LOGIC ADDED ---
  // Use useMemo to filter products only when the products prop changes.
  // This prevents re-filtering on every render.
  console.log("Products data received in SwipeCard:", products);
  const filteredProducts = useMemo(() =>
    products.filter((p) => p.category === "Swipe Left or Right"),
    [products]
  );

  const [gone] = useState(() => new Set());
  // IMPORTANT: Initialize useSprings with the length of the *filtered* list
  const [props, api] = useSprings(filteredProducts.length, (i) => ({
    x: 0,
    y: 0,
    scale: 1,
    rot: 0,
    display: "flex",
  }));

  const bind = useDrag(({ args: [index], down, movement: [mx], direction: [xDir], velocity }) => {
    const trigger = velocity > 0.2;
    const dir = xDir < 0 ? -1 : 1;

    if (!down && trigger) gone.add(index);

    api.start((i) => {
      if (index !== i) return;
      const isGone = gone.has(index);

      const x = isGone ? (200 + window.innerWidth) * dir : down ? mx : 0;
      const rot = mx / 100 + (isGone ? dir * 10 * velocity : 0);
      const scale = down ? 1.05 : 1;

      return {
        x,
        rot,
        scale,
        delay: undefined,
        config: { friction: 50, tension: down ? 800 : isGone ? 220 : 500 },
        onRest: () => {
          if (isGone) {
            api.start((j) => (j === index ? { display: "none" } : {}));
          }
        },
      };
    });

    // Reset if all *filtered* cards are gone
    if (!down && gone.size === filteredProducts.length) {
      setTimeout(() => {
        gone.clear();
        api.start((i) => ({ x: 0, y: 0, scale: 1, rot: 0, display: "flex" }));
      }, 600);
    }
  });

  const triggerSwipe = (index: number, dir: -1 | 1) => {
    gone.add(index);
    api.start((i) => {
      if (index !== i) return;
      return {
        x: (200 + window.innerWidth) * dir,
        rot: dir * 15,
        config: { friction: 50, tension: 220 },
        onRest: () => api.start((j) => (j === index ? { display: "none" } : {})),
      };
    });
    if (gone.size === filteredProducts.length) {
      setTimeout(() => {
        gone.clear();
        api.start((i) => ({ x: 0, y: 0, scale: 1, rot: 0, display: "flex" }));
      }, 600);
    }
  };

  return (
    <div className="min-h-screen w-full bg-[#F8F5F2] p-8 lg:p-16">
      <h1 className="mb-8 font-serif text-2xl text-gray-800">select what matters</h1>
      <div className="grid grid-cols-1 items-center gap-12 lg:grid-cols-2">
        <div className="relative mx-auto flex h-[450px] w-full max-w-md items-center justify-center">
          {/* Map over the *filtered* props array */}
          {props.map(({ x, y, rot, scale, display }, i) => {
            // Get the product from the filtered list
            const currentProduct = filteredProducts[i]?.product;
            if (!currentProduct) return null;

            const shortDescription =
              currentProduct.description && currentProduct.description.length > 100
                ? `${currentProduct.description.substring(0, 100)}...`
                : currentProduct.description || "Lorem ipsum dolor sit amet, consectetur adipiscing elit.";

            return (
              <animated.div
                key={currentProduct.id}
                style={{ x, y, display }}
                className="absolute flex size-full items-center justify-center"
              >
                <animated.div
                  {...bind(i)}
                  style={{ transform: rot.to((r) => `rotateZ(${r}deg)`), scale }}
                  className="flex size-full max-w-sm cursor-grab touch-none flex-col rounded-2xl bg-white shadow-lg active:cursor-grabbing"
                >
                  <div className="relative w-full grow overflow-hidden rounded-t-2xl">
                    <Image
                      src={currentProduct.media[0]?.mediaItem?.url || "/placeholder-product.jpg"}
                      alt={currentProduct.title}
                      fill
                      className="object-cover"
                      sizes="(max-width: 768px) 100vw, 50vw"
                      draggable="false"
                    />
                  </div>
                  <div className="shrink-0 p-6">
                    <h3 className="text-2xl font-bold capitalize text-gray-900">{currentProduct.title}</h3>
                    <p className="mt-1 h-10 text-sm text-gray-500">
                      {shortDescription}
                    </p>
                    <div className="mt-4 flex items-center justify-between">
                      <button
                        onClick={() => triggerSwipe(i, -1)}
                        className="flex size-10 items-center justify-center rounded-full bg-red-500 text-white shadow-md transition-transform hover:scale-110 hover:bg-red-600"
                        aria-label="Dislike"
                      >
                        <Icons.X className="size-5" />
                      </button>
                      <button
                        onClick={() => triggerSwipe(i, 1)}
                        className="flex size-10 items-center justify-center rounded-full bg-green-500 text-white shadow-md transition-transform hover:scale-110 hover:bg-green-600"
                        aria-label="Like"
                      >
                        <Icons.Check className="size-5" />
                      </button>
                    </div>
                  </div>
                </animated.div>
              </animated.div>
            );
          })}
        </div>

        <div className="mx-auto w-full max-w-md rounded-2xl border border-white/40 bg-white/30 p-8 text-left shadow-lg backdrop-blur-lg">
          <h2 className="font-serif text-3xl text-gray-800">Slow Fashion Guide</h2>
          <p className="mt-4 text-gray-700">
            Learn How Choosing Well Makes An Impact.


            Read Our Short Guide.
          </p>
          <Link href="/slow-fashion-guide" className="mt-6 inline-block">
            <Icons.ArrowRight className="size-8 text-gray-800 transition-colors hover:text-black" />
          </Link>
        </div>
      </div>
    </div>
  );
}
