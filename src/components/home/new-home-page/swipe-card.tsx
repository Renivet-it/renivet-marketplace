"use client";

import { useSpring, animated, useSprings } from "@react-spring/web";
import { useDrag } from "react-use-gesture";
import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
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

// --- MAIN COMPONENT ---
export function SwipeCard({ products }: SwipeableProductCardProps) {
  const [gone] = useState(() => new Set());
  const [props, api] = useSprings(products.length, i => ({
    x: 0,
    y: 0,
    scale: 1,
    rot: 0,
  }));

  // --- PROFESSIONAL SWIPE-AWAY LOGIC ---
  const bind = useDrag(({ args: [index], down, movement: [mx], direction: [xDir], velocity }) => {
    const trigger = velocity > 0.2;
    const dir = xDir < 0 ? -1 : 1;

    if (!down && trigger) gone.add(index);

    api.start(i => {
      if (index !== i) return;
      const isGone = gone.has(index);
      
      // The card is animated off-screen
      const x = isGone ? (200 + window.innerWidth) * dir : down ? mx : 0;
      const rot = mx / 100 + (isGone ? dir * 10 * velocity : 0);
      const scale = down ? 1.05 : 1;

      return {
        x,
        rot,
        scale,
        delay: undefined,
        config: { friction: 50, tension: down ? 800 : isGone ? 220 : 500 },
        // After the animation, if the card is gone, hide it to prevent layout issues
        onRest: () => {
          if (isGone) {
            api.start(j => (j === index ? { display: 'none' } : {}));
          }
        },
      };
    });

    if (!down && gone.size === products.length) {
      setTimeout(() => {
        gone.clear();
        // Reset all cards to be visible and in their initial state
        api.start(i => ({ x: 0, y: 0, scale: 1, rot: 0, display: 'flex' }));
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
        onRest: () => api.start(j => (j === index ? { display: 'none' } : {})),
      };
    });
    if (gone.size === products.length) {
      setTimeout(() => {
        gone.clear();
        api.start(i => ({ x: 0, y: 0, scale: 1, rot: 0, display: 'flex' }));
      }, 600);
    }
  };

  return (
    <div className="w-full min-h-screen bg-[#F8F5F2] p-8 lg:p-16">
      <h1 className="text-2xl font-serif text-gray-800 mb-8">select what matters</h1>
      {/* --- LAYOUT NOW HANDLES SINGLE COLUMN GRACEFULLY --- */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
        {/* Column 1: Swipeable Product Card */}
        <div className="relative w-full max-w-md mx-auto h-[450px] flex items-center justify-center">
          {props.map(({ x, y, rot, scale, display }, i) => {
            const currentProduct = products[i]?.product;
            if (!currentProduct) return null;

            const shortDescription =
              currentProduct.description && currentProduct.description.length > 100
                ? `${currentProduct.description.substring(0, 100)}...`
                : currentProduct.description || "Lorem ipsum dolor sit amet, consectetur adipiscing elit.";

            return (
              <animated.div
                key={currentProduct.id}
                style={{ x, y, display }}
                className="absolute w-full h-full flex items-center justify-center"
              >
                <animated.div
                  {...bind(i)}
                  style={{ transform: rot.to(r => `rotateZ(${r}deg)`), scale }}
                  className="bg-white rounded-2xl shadow-lg w-full h-full max-w-sm touch-none cursor-grab active:cursor-grabbing flex flex-col"
                >
                  <div className="relative w-full flex-grow overflow-hidden rounded-t-2xl">
                    <Image
                      src={currentProduct.media[0]?.mediaItem?.url || "/placeholder-product.jpg"}
                      alt={currentProduct.title}
                      fill
                      className="object-cover"
                      sizes="(max-width: 768px) 100vw, 50vw"
                      draggable="false"
                    />
                  </div>
                  <div className="p-6 flex-shrink-0">
                    <h3 className="text-2xl font-bold text-gray-900 capitalize">{currentProduct.title}</h3>
                    <p className="text-gray-500 mt-1 text-sm h-10">
                      {shortDescription}
                    </p>
                    <div className="flex justify-between items-center mt-4">
                      <button
                        onClick={() => triggerSwipe(i, -1)}
                        className="flex items-center justify-center w-10 h-10 rounded-full bg-red-500 text-white shadow-md hover:bg-red-600 transition-transform transform hover:scale-110"
                        aria-label="Dislike"
                      >
                        <Icons.X className="w-5 h-5" />
                      </button>
                      <button
                        onClick={() => triggerSwipe(i, 1)}
                        className="flex items-center justify-center w-10 h-10 rounded-full bg-green-500 text-white shadow-md hover:bg-green-600 transition-transform transform hover:scale-110"
                        aria-label="Like"
                      >
                        <Icons.Check className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                </animated.div>
              </animated.div>
            );
          })}
        </div>

        {/* Column 2: Static Info Card */}
        <div className="w-full max-w-md mx-auto rounded-2xl shadow-lg p-8 text-left bg-white/30 backdrop-blur-lg border border-white/40">
          <h2 className="text-3xl font-serif text-gray-800">Slow Fashion Guide</h2>
          <p className="mt-4 text-gray-700">
            Learn How Choosing Well Makes An Impact.
              

            Read Our Short Guide.
          </p>
          <Link href="/slow-fashion-guide" className="inline-block mt-6">
            <Icons.ArrowRight className="w-8 h-8 text-gray-800 hover:text-black transition-colors" />
          </Link>
        </div>
      </div>
    </div>
  );
}
