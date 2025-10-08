"use client";

import { cn, convertPaiseToRupees } from "@/lib/utils";
import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { Icons } from "@/components/icons"; // Assuming you have an icons utility

// --- INTERFACES ---
interface Product {
  slug: any;
  id: string;
  media: { mediaItem: { url: string } }[];
  title: string;
  variants?: {
    price: number;
  }[];
  price?: number;
}

interface ProductWrapper {
  id: string;
  category: string; // ✅ category comes from the backend
  product: Product;
}

interface ProductGridProps extends React.HTMLAttributes<HTMLDivElement> {
  products: ProductWrapper[];
  title?: string;
}

// --- CATEGORY CONSTANT ---
const CATEGORIES = ["Most Ordered", "In Season", "Fresh Deals", "Limited Offer", "Best Value"];

// --- MAIN COMPONENT ---
export function ProductGridNewArrivals({
  className,
  products,
  ...props
}: ProductGridProps) {
  const [activeTab, setActiveTab] = useState("Most Ordered");

  // Debug log
  console.log("Products data received:", products);

  if (!products || !Array.isArray(products) || products.length === 0) {
    return null;
  }

  // ✅ Filter products based on the top-level 'category' field
  const filteredProducts = products.filter(
    (item) => item.category === activeTab
  );

  return (
    <section className={cn("w-full py-12 bg-[#F4F0EC]", className)} {...props}>
      <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Tab Navigation */}
        <div className="flex justify-center border-b border-gray-200 mb-8">
          <div className="flex space-x-4 sm:space-x-8 overflow-x-auto pb-1">
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

        {/* Product Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-7 gap-4 sm:gap-6">
          {filteredProducts.map(({ product }) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      </div>
    </section>
  );
}

// --- PRODUCT CARD COMPONENT ---
function ProductCard({ product }: { product: Product }) {
  const rawPrice = product.variants?.[0]?.price || product.price || 0;
  const price = rawPrice; // If prices are in paise, use convertPaiseToRupees(rawPrice)

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    console.log(`Added ${product.title} to cart`);
    // toast.success(`${product.title} added to cart!`);
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
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 20vw"
          />
        </div>
        <div className="p-2 text-center">
          <h3 className="text-sm font-normal text-gray-700 truncate">
            {product.title}
          </h3>
          <div className="flex justify-center items-center space-x-3 mt-1">
            <p className="text-sm font-medium text-gray-900">
              ₹{typeof price === "number" ? price.toFixed(2) : price}
            </p>
            <button
              onClick={handleAddToCart}
              className="flex items-center justify-center w-6 h-6 rounded-full bg-blue-100 text-blue-600 hover:bg-blue-500 hover:text-white transition-colors"
              aria-label="Add to cart"
            >
              <Icons.Plus className="w-4 h-4" />
            </button>
          </div>
        </div>
      </Link>
    </div>
  );
}
