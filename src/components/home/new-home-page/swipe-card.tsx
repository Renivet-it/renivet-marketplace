"use client";

import { useSpring, animated, useSprings } from "@react-spring/web";
import { useDrag } from "react-use-gesture";
import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Icons } from "@/components/icons";
import { cn } from "@/lib/utils";

// --- INTERFACES (Unchanged) ---
interface Product {
  slug: any;
  id: string;
  media: { mediaItem: { url: string } }[];
  title: string;
  description?: string;
}

interface SwipeableProductCardProps {
  products: { product: Product }[];
}

// --- MAIN COMPONENT (Unchanged Logic) ---
export function SwipeCard({ products }: SwipeableProductCardProps) {
  const [gone] = useState(() => new Set());
  const [props, api] = useSprings(products.length, i => ({
    x: 0,
    y: 0,
    scale: 1,
    rot: 0,
  }));

  const bind = useDrag(({ args: [index], down, movement: [mx], direction: [xDir], velocity }) => {
    const trigger = velocity > 0.2;
    const dir = xDir < 0 ? -1 : 1;

    if (!down && trigger) gone.add(index);

    api.start(i => {
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
      };
    });

    if (!down && gone.size === products.length) {
      setTimeout(() => {
        gone.clear();
        api.start(i => ({ x: 0, y: 0, scale: 1, rot: 0 }));
      }, 600);
    }
  });

  const triggerSwipe = (index: number, dir: -1 | 1) => {
    gone.add(index);
    api.start(i => {
      if (index !== i) return;
      return {
        x: (200 + window.innerWidth) * dir,
        rot: dir * 15,
        config: { friction: 50, tension: 220 },
      };
    });
    if (gone.size === products.length) {
      setTimeout(() => {
        gone.clear();
        api.start(i => ({ x: 0, y: 0, scale: 1, rot: 0 }));
      }, 600);
    }
  };

  return (
    // Using the centered layout from our previous step
    <div className="flex flex-col items-center gap-12 w-full px-4">
      {/* Section 1: Swipeable Product Card */}
      <div className="relative w-full max-w-md mx-auto h-[550px] flex items-center justify-center">
        {props.map(({ x, y, rot, scale }, i) => {
          const currentProduct = products[i]?.product;
          if (!currentProduct) return null;

          const shortDescription =
            currentProduct.description && currentProduct.description.length > 100
              ? `${currentProduct.description.substring(0, 100)}...`
              : currentProduct.description || "Lorem ipsum dolor sit amet, consectetur adipiscing elit.";

          return (
            <animated.div
              key={currentProduct.id}
              style={{ x, y }}
              className="absolute w-full h-full flex items-center justify-center"
            >
              <animated.div
                {...bind(i)}
                style={{ transform: rot.to(r => `rotateZ(${r}deg)`), scale }}
                className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-sm touch-none cursor-grab active:cursor-grabbing"
              >
                {/* --- VISUAL FEEDBACK OVERLAYS (FIXED) --- */}
                <animated.div
                  style={{ opacity: x.to(x => Math.abs(x) / 100), transform: rot.to(r => `rotate(${-r}deg)`) }}
                  className={cn(
                    "absolute top-10 left-10 text-6xl font-bold uppercase text-red-500 border-4 border-red-500 rounded-lg px-4 py-2 transform -rotate-12 pointer-events-none",
                    // FIX: Show "Nope" only when dragging left (x is negative)
                    x.get() >= 0 && "hidden"
                  )}
                >
                  Nope
                </animated.div>
                <animated.div
                  style={{ opacity: x.to(x => Math.abs(x) / 100), transform: rot.to(r => `rotate(${-r}deg)`) }}
                  className={cn(
                    "absolute top-10 right-10 text-6xl font-bold uppercase text-green-500 border-4 border-green-500 rounded-lg px-4 py-2 transform rotate-12 pointer-events-none",
                    // FIX: Show "Like" only when dragging right (x is positive)
                    x.get() <= 0 && "hidden"
                  )}
                >
                  Like
                </animated.div>

                <div className="relative w-full h-80 mb-4 overflow-hidden rounded-lg">
                  <Image
                    src={currentProduct.media[0]?.mediaItem?.url || "/placeholder-product.jpg"}
                    alt={currentProduct.title}
                    fill
                    className="object-contain"
                    sizes="(max-width: 768px) 100vw, 50vw"
                    draggable="false"
                  />
                </div>
                <h3 className="text-2xl font-bold text-gray-800 text-center">{currentProduct.title}</h3>
                <p className="text-gray-500 mt-1 text-sm text-center h-10">
                  {shortDescription}
                </p>
                
                <div className="flex justify-between items-center mt-6 px-4">
                  <button
                    onClick={() => triggerSwipe(i, -1)}
                    className="flex items-center justify-center w-14 h-14 rounded-full bg-red-500 text-white shadow-lg hover:bg-red-600 transition-transform transform hover:scale-110"
                    aria-label="Dislike"
                  >
                    <Icons.X className="w-7 h-7" />
                  </button>
                  <button
                    onClick={() => triggerSwipe(i, 1)}
                    className="flex items-center justify-center w-14 h-14 rounded-full bg-green-500 text-white shadow-lg hover:bg-green-600 transition-transform transform hover:scale-110"
                    aria-label="Like"
                  >
                    <Icons.Check className="w-7 h-7" />
                  </button>
                </div>
              </animated.div>
            </animated.div>
          );
        })}
      </div>

      {/* Section 2: Static Info Card */}
      <div className="w-full max-w-md mx-auto bg-gradient-to-br from-blue-100 via-blue-50 to-gray-50 rounded-2xl shadow-lg p-8 text-center">
        <h2 className="text-3xl font-serif text-gray-800">Slow Fashion Guide</h2>
        <p className="mt-4 text-gray-600">
          Learn How Choosing Well Makes An Impact. Read Our Short Guide.
        </p>
        <Link href="/slow-fashion-guide" className="inline-block mt-6">
          <Icons.ArrowRight className="w-8 h-8 text-gray-700 hover:text-black transition-colors" />
        </Link>
      </div>
    </div>
  );
}
