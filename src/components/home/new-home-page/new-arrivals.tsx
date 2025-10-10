"use client";

import { cn, convertPaiseToRupees } from "@/lib/utils";
import Image from "next/image";
import Link from "next/link";
import { useState, useEffect } from "react";
import { Icons } from "@/components/icons";
import { trpc } from "@/lib/trpc/client";
import { toast } from "sonner";

// ==========================================================
// 🔹 GUEST CART HOOK (Copied from your SwipeCard component for consistency)
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
              ? { ...x, quantity: x.quantity + item.quantity } // Use provided quantity
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


// --- INTERFACES ---
interface Product {
  slug: any;
  id: string;
  media: { mediaItem: { url: string } }[];
  title: string;
  brand?: { name: string }; // Added brand to match SwipeCard
  variants?: {
    id: string;
    price: number;
  }[];
  price?: number;
}

interface ProductWrapper {
  id: string;
  category: string;
  product: Product;
}

interface ProductGridProps extends React.HTMLAttributes<HTMLDivElement> {
  products: ProductWrapper[];
  title?: string;
  userId?: string;
}

// --- CATEGORY CONSTANT ---
const CATEGORIES = ["Most Ordered", "In Season", "Fresh Deals", "Limited Offer", "Best Value"];

// --- MAIN COMPONENT ---
export function ProductGridNewArrivals({
  className,
  products,
  userId,
  ...props
}: ProductGridProps) {
  const [activeTab, setActiveTab] = useState("Most Ordered");

  if (!products || !Array.isArray(products) || products.length === 0) {
    return null;
  }

  const filteredProducts = products.filter((item) => item.category === activeTab);

  return (
    <section className={cn("w-full py-12 bg-[#F4F0EC]", className)} {...props}>
      <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-center border-b border-gray-200 mb-8">
          <div className="flex space-x-4 sm:space-x-8 overflow-x-auto pb-1 scrollbar-hide">
            {CATEGORIES.map((category) => (
              <button
                key={category}
                onClick={() => setActiveTab(category)}
                className={cn(
                  "py-3 px-1 text-sm sm:text-base font-medium whitespace-nowrap transition-colors duration-200",
                  activeTab === category
                    ? "text-orange-600 border-b-2 border-orange-600"
                    : "text-gray-500 hover:text-gray-800"
                )}
              >
                {category}
              </button>
            ))}
          </div>
        </div>
        <div className="grid grid-cols-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-7 gap-3 sm:gap-6">
          {filteredProducts.map(({ product }) => (
            <ProductCard key={product.id} product={product} userId={userId} />
          ))}
        </div>
      </div>
    </section>
  );
}

// --- PRODUCT CARD COMPONENT (WITH CORRECTED API LOGIC) ---
function ProductCard({ product, userId }: { product: Product; userId?: string }) {
  const { addToGuestCart } = useGuestCart();
  const { mutateAsync: addToCart, isLoading } =
    trpc.general.users.cart.addProductToCart.useMutation();

  const rawPrice = product.variants?.[0]?.price || product.price || 0;
  const price = convertPaiseToRupees(rawPrice);
  const variantId = product.variants?.[0]?.id || null;

  const handleAddToCart = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    try {
      if (userId) {
        // --- LOGGED-IN USER ---
        await addToCart({
          productId: product.id,
          variantId: variantId,
          quantity: 1,
          userId,
        });
        toast.success("Added to Cart!"); // Simplified toast message for consistency
      } else {
        // --- GUEST USER (Logic from SwipeCard) ---
        addToGuestCart({
          productId: product.id,
          variantId: variantId,
          quantity: 1, // Add one item at a time
          title: product.title,
          brand: product.brand?.name,
          price: rawPrice, // Use raw price in paise
          image: product.media[0]?.mediaItem?.url ?? null,
          sku: null, // Assuming sku is not available here
          fullProduct: product, // Pass the full product object
        });
      }
    } catch (err: any) {
      toast.error(err.message || "Could not add to cart.");
    }
  };

  return (
    <div className="flex-shrink-0 group cursor-pointer bg-white rounded-lg shadow-sm overflow-hidden transition-all duration-300 hover:shadow-lg">
      <Link href={`/products/${product.slug}`} className="block">
        <div className="relative w-full aspect-[1/1]">
          <Image
            src={product.media[0]?.mediaItem?.url || "/placeholder-product.jpg"}
            alt={product.title}
            fill
            className="object-cover transition-transform duration-300 group-hover:scale-105"
            sizes="(max-width: 640px) 33vw, (max-width: 768px) 33vw, (max-width: 1024px) 25vw, 20vw"
          />
        </div>
        <div className="p-1.5 sm:p-2 text-center">
          <h3 className="text-xs sm:text-sm font-normal text-gray-700 truncate">
            {product.title}
          </h3>
          <div className="flex justify-center items-center space-x-2 sm:space-x-3 mt-1">
            <p className="text-xs sm:text-sm font-medium text-gray-900">₹{price}</p>
            <button
              onClick={handleAddToCart}
              disabled={isLoading}
              className="flex items-center justify-center w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-blue-100 text-blue-600 hover:bg-blue-500 hover:text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              aria-label="Add to cart"
            >
              {isLoading ? (
                <Icons.Spinner className="w-3 h-3 animate-spin" />
              ) : (
                <Icons.Plus className="w-3 h-3 sm:w-4 sm:h-4" />
              )}
            </button>
          </div>
        </div>
      </Link>
    </div>
  );
}
