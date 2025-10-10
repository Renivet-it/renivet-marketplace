"use client";

import { useState, useMemo, useEffect } from "react";
import { useSprings, animated, to as interpolate } from "@react-spring/web";
import { useDrag } from "react-use-gesture";
import Image from "next/image";
import Link from "next/link";
import { Icons } from "@/components/icons";
import { trpc } from "@/lib/trpc/client";
import { toast } from "sonner";

// ==========================================================
// 🔹 1. Guest Cart Hook
// ==========================================================
function useGuestCart() {
  const [guestCart, setGuestCart] = useState<any[]>([]);

  useEffect(() => {
    try {
      const stored = localStorage.getItem("guest_cart");
      if (stored) setGuestCart(JSON.parse(stored));
    } catch {
      setGuestCart([]);
    }
  }, []);

  const syncGuestCart = () => {
    try {
      const stored = localStorage.getItem("guest_cart");
      setGuestCart(stored ? JSON.parse(stored) : []);
    } catch {
      setGuestCart([]);
    }
  };

  useEffect(() => {
    window.addEventListener("guestCartUpdated", syncGuestCart);
    window.addEventListener("storage", syncGuestCart);
    return () => {
      window.removeEventListener("guestCartUpdated", syncGuestCart);
      window.removeEventListener("storage", syncGuestCart);
    };
  }, []);

  const addToGuestCart = (item: any) => {
    setGuestCart((prev) => {
      const existing = prev.find(
        (x) =>
          x.productId === item.productId &&
          (x.variantId || null) === (item.variantId || null)
      );

      const updated = existing
        ? prev.map((x) =>
            x.productId === item.productId &&
            (x.variantId || null) === (item.variantId || null)
              ? { ...x, quantity: x.quantity + item.quantity }
              : x
          )
        : [...prev, item];

      localStorage.setItem("guest_cart", JSON.stringify(updated));
      window.dispatchEvent(new Event("guestCartUpdated"));
      toast.success(existing ? "Increased quantity in Cart" : "Added to Cart!");
      return updated;
    });
  };

  return { guestCart, addToGuestCart };
}

// ==========================================================
// 🔹 2. Types
// ==========================================================
interface Product {
  id: string;
  slug: string;
  media: { mediaItem: { url: string } }[];
  title: string;
  description?: string;
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
// 🔹 3. SwipeCard Component
// ==========================================================
export function SwipeCard({ products, userId }: SwipeableProductCardProps) {
  const { addToGuestCart } = useGuestCart();

  const filteredProducts = useMemo(
    () => products.filter((p) => p.category === "Swipe Left or Right"),
    [products]
  );

  const [goneCards, setGoneCards] = useState<Set<number>>(new Set());

  // Initial spring setup
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

  const { mutateAsync: addToCart } =
    trpc.general.users.cart.addProductToCart.useMutation();

  // --------------------------------------------------------
  // 🔸 Swipe logic (left/right)
  // --------------------------------------------------------
  const handleSwipe = async (index: number, dir: number) => {
    if (goneCards.has(index)) return;
    setGoneCards((prev) => new Set([...prev, index])); // mark as gone

    const product = filteredProducts[index]?.product;
    if (!product) return;

    // Animate card out
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

    // Handle cart addition
    if (dir === 1) {
      try {
        if (userId) {
          await addToCart({
            productId: product.id,
            variantId: null,
            quantity: 1,
            userId,
          });
          toast.success("Added to Cart!");
        } else {
          addToGuestCart({
            productId: product.id,
            variantId: null,
            quantity: 1,
            title: product.title,
            brand: product.brand?.name,
            price: product.price,
            image: product.media?.[0]?.mediaItem?.url ?? null,
            sku: null,
            fullProduct: product,
          });
        }
      } catch (err: any) {
        toast.error(err.message || "Could not add to cart.");
      }
    }

    // Keep it gone visually
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

  // --------------------------------------------------------
  // 🔸 Gesture binding
  // --------------------------------------------------------
  const bind = useDrag(
    ({
      args: [index],
      down,
      movement: [mx],
      direction: [xDir],
      velocity,
    }) => {
      if (goneCards.has(index)) return;
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

  // --------------------------------------------------------
  // 🔸 UI
  // --------------------------------------------------------
  return (
    <div className=" w-full bg-[#F8F5F2] p-8 lg:p-16">

      <div className="grid grid-cols-1 items-center gap-12 lg:grid-cols-2">
        {/* --- Swipe Area --- */}
        <div className="relative mx-auto flex h-[450px] w-full max-w-md items-center justify-center">
          {springs.map(({ x, y, rot, scale }, i) => {
            const product = filteredProducts[i]?.product;
            if (!product || goneCards.has(i)) return null;

            const description =
              product.description && product.description.length > 100
                ? `${product.description.slice(0, 100)}...`
                : product.description ||
                  "Discover sustainable style that lasts.";

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
                      "/placeholder-product.jpg"
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
                  <p className="mt-1 h-10 text-sm text-gray-500">
                    {description}
                  </p>

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
                      <Icons.Check className="size-5" />
                    </button>
                  </div>
                </div>
              </animated.div>
            );
          })}
        </div>

        {/* --- Right Side Guide --- */}
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
