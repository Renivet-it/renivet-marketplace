"use client";

import { cn } from "@/lib/utils";
import { CachedWishlist } from "@/lib/validations";
import Link from "next/link";
import { EventProductCard } from "../globals/cards";
import { Icons } from "../icons"; // Make sure to have ChevronRight in your Icons object
import { Button } from "../ui/button-general";
import {
  EmptyPlaceholder,
  EmptyPlaceholderContent,
  EmptyPlaceholderDescription,
  EmptyPlaceholderIcon,
  EmptyPlaceholderTitle,
} from "../ui/empty-placeholder-general";
import { getEventProducts } from "@/actions/event-page";
import { ExhibitionCarousel } from "./carousel-component";
import {
  useQueryState,
  parseAsInteger,
  parseAsArrayOf,
  parseAsString,
  parseAsStringLiteral,
} from "nuqs";
import { useState, useEffect, useRef } from "react";
import { Loader2 } from "lucide-react";

// --- 1. Final, Accurate PromoBanner Component ---
const PromoBanner = () => {
  const imageUrl1 = "https://4o4vm2cu6g.ufs.sh/f/HtysHtJpctzNoKrKNg0WvnGEidmOVIP6xXt4S7befYUykMJq";
  const imageUrl2 = "https://4o4vm2cu6g.ufs.sh/f/HtysHtJpctzNzE3GE0wvAfHxUCD4uo0de9jTMakKRhw8ctYL";

  return (
    <div className="relative mb-4">
      {/* Main banner container with increased height */}
      <div className="relative flex h-[250px] items-center overflow-hidden bg-[#eaddf7] p-4">
        {/* Left side - Images container */}
        <div className="flex w-1/2 h-full">
          {/* Female Model Image */}
          <div className="relative w-1/2 h-full">
            <img
              src={imageUrl1}
              alt="Female model"
              className="w-full h-full object-contain object-center"
            />
            {/* Clickable dot on female model */}
            <Link
              href="/product/female-coord-set"
              className="absolute z-10"
              style={{ top: '60%', left: '70%' }}
            >
              <div className="h-3 w-3 cursor-pointer rounded-full bg-white ring-2 ring-black shadow-md hover:scale-110 transition-transform" />
            </Link>
          </div>
          
          {/* Male Model Image */}
          <div className="relative w-1/2 h-full ml-[-2px]">
            <img
              src={imageUrl2}
              alt="Male model"
              className="w-full h-full object-contain object-center"
            />
            {/* Clickable dot on male model */}
            <Link
              href="/product/male-coord-set"
              className="absolute z-10"
              style={{ top: '70%', left: '30%' }}
            >
              <div className="h-3 w-3 cursor-pointer rounded-full bg-white ring-2 ring-black shadow-md hover:scale-110 transition-transform" />
            </Link>
          </div>
        </div>

        {/* Right side - Text content */}
        <div className="flex flex-col justify-center w-1/2 pl-6 text-left">
          <h3 className="text-sm font-bold tracking-wider text-black mb-1">RENIVET</h3>
          <h2 className="text-lg font-bold text-black leading-tight mb-2" style={{ fontStyle: 'italic' }}>
            Conscious Looks For Modern Duos
          </h2>
          <p className="text-xs text-black mb-4 leading-relaxed">
            Step Into Effortless Style With Co-Ord Sets Designed To Match Your Vibe. Ethically Made For Those Who Care.
          </p>
          <Link href="/collections/renivet">
            <div className="inline-flex items-center justify-center rounded-md border border-black bg-transparent px-4 py-2 text-xs font-medium text-black hover:bg-black hover:text-white transition-colors">
              Buy Now
            </div>
          </Link>
        </div>

        {/* Top right category icon */}
        {/* <div className="absolute top-4 right-4 w-12 h-12 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
          <div className="w-8 h-8 rounded-full bg-gray-600 flex items-center justify-center">
            <span className="text-white text-xs font-semibold">W</span>
          </div>
        </div> */}
      </div>
    </div>
  );
};

interface ShopEventProductsProps {
  className?: string;
  initialData: any[];
  initialWishlist?: CachedWishlist[];
  userId?: string;
  showCarousel?: boolean;
}

const categories = [
  { id: "08ce51fe-adb8-4086-acfd-759772767ec8", name: "Beauty and Care", image: "https://4o4vm2cu6g.ufs.sh/f/HtysHtJpctzNtkiuyIRj63QywZkxrW40qSphaIEcmUdXDAVl" },
  { id: "0b7046fc-6962-4469-81c2-412ed6949c02", name: "Men", image: "https://4o4vm2cu6g.ufs.sh/f/HtysHtJpctzNbth2WVuZc50VbmLPHAdU9KwxEkCINyqDWJRr"},
  { id: "16d40bb3-3061-4790-b9b7-253cb078dfe1", name: "Women", image: "https://4o4vm2cu6g.ufs.sh/f/HtysHtJpctzNLFiqLIFUt5ndSiE7wT2jaklrZXQ6vYpAbfHy" },
  { id: "173e1e71-e298-4301-b542-caa29d3950bf", name: "Home and Living", image: "https://4o4vm2cu6g.ufs.sh/f/HtysHtJpctzNmWeViQNpGL6AgslOfF3vz5Wa1NUerQXMBIPZ" },
  { id: "22816fa3-d57e-4e3b-bc0e-72edf4635124", name: "Kids", image: "https://4o4vm2cu6g.ufs.sh/f/HtysHtJpctzNdshBBwb4imNMJ6l9SbIRxWLcDyX3vTqk2UVG" }
];

export function ShopEventProducts({
  className,
  initialData,
  initialWishlist,
  userId,
  showCarousel = true,
}: ShopEventProductsProps  ) {
  const wishlist = initialWishlist ?? [];

  const [page, setPage] = useQueryState("page", parseAsInteger.withDefault(1));
  const [brandIds] = useQueryState("brandIds", parseAsArrayOf(parseAsString, ",").withDefault([]));
  const [categoryId, setCategoryId] = useQueryState("categoryId", parseAsString.withDefault(""));
  const [subCategoryId] = useQueryState("subCategoryId", parseAsString.withDefault(""));
  const [minPrice] = useQueryState("minPrice", parseAsInteger);
  const [maxPrice] = useQueryState("maxPrice", parseAsInteger);
  const [sortBy] = useQueryState("sortBy", parseAsStringLiteral(["price", "createdAt"] as const).withDefault("createdAt"));
  const [sortOrder] = useQueryState("sortOrder", parseAsStringLiteral(["asc", "desc"] as const).withDefault("desc"));

  const [products, setProducts] = useState(initialData);
  const [hasMore, setHasMore] = useState(initialData.length === 24);
  const [loading, setLoading] = useState(false);
  const observerRef = useRef<HTMLDivElement | null>(null);

  const prevFilters = useRef({
    brandIds: brandIds.join(","),
    categoryId,
    subCategoryId,
    minPrice,
    maxPrice,
    sortBy,
    sortOrder,
  });

  const fetchProducts = async (targetPage: number, append = false) => {
    if (!hasMore && append) return;

    setLoading(true);
    const filters = {
      page: targetPage,
      limit: 24,
      brandIds: brandIds,
      categoryId: categoryId || undefined,
      subCategoryId: subCategoryId || undefined,
      minPrice: minPrice || undefined,
      maxPrice: maxPrice || undefined,
      sortBy: sortBy,
      sortOrder: sortOrder,
    };

    const data = await getEventProducts(filters);

    if (data.length === 0) {
      setHasMore(false);
    } else {
      setProducts((prev) => (append ? [...prev, ...data] : data));
      setHasMore(data.length === 24);
    }

    setLoading(false);
  };

  useEffect(() => {
    const currentFilters = {
      brandIds: brandIds.join(","),
      categoryId,
      subCategoryId,
      minPrice,
      maxPrice,
      sortBy,
      sortOrder,
    };

    const filtersChanged = JSON.stringify(currentFilters) !== JSON.stringify(prevFilters.current);

    if (filtersChanged) {
      fetchProducts(1, false);
      setPage(1);
      prevFilters.current = currentFilters;
    }
  }, [brandIds, categoryId, subCategoryId, minPrice, maxPrice, sortBy, sortOrder]);

  useEffect(() => {
    if (!observerRef.current || !hasMore) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !loading) {
          const nextPage = page + 1;
          setPage(nextPage);
          fetchProducts(nextPage, true);
        }
      },
      { threshold: 1.0 }
    );

    observer.observe(observerRef.current);

    return () => observer.disconnect();
  }, [page, hasMore, loading]);


  if (!products.length) return <NoProductCard />;
  return (
    <div className="min-h-screen bg-[#f4f0ec] relative overflow-hidden">
      {/* Mobile-only container for Carousel and Categories */}
      <div className="block md:hidden bg-[#eaddf7]">
        {showCarousel && (
          <ExhibitionCarousel
            slides={[
              {
                title: "Hyderabad Exhibition 2025",
                date: "September 2025",
                description:
                  "Discover Exclusive Handcrafted Pieces, Sustainable Fashion, And Beauty Products Showcased Only At Our Hyderabad Event.",
                imageUrl: "/images/event1.jpg",
                url: "/events/hyderabad",
              },
            ]}
          />
        )}

        {/* Category Section */}
        <div className="mt-2 mb-2 bg-[#e2d4ee]">
          <div className="rounded-2xl py-4 px-2 shadow-sm w-full overflow-hidden" style={{ backgroundColor: "#e1d5ea" }}>
            <div className="grid grid-cols-5 gap-1 w-full">
              {categories.map((cat) => (
                <Link key={cat.id} href={`/events/${cat.id}`} className="flex flex-col items-center justify-center w-full">
                  <div className="rounded-full overflow-hidden mb-1 mx-auto" style={{ width: "48px", height: "45px", backgroundColor: "#5f3297" }}>
                    <img src={cat.image || "/images/placeholder.png"} alt={cat.name} className="w-full h-full object-cover" />
                  </div>
                  <span
                    className={cn("text-center leading-tight w-full", categoryId === cat.id ? "text-purple-600" : "text-gray-600")}
                    style={{ fontSize: "9px", lineHeight: "10px", wordBreak: "break-word", hyphens: "auto" }}
                  >
                    {cat.name}
                  </span>
                </Link>
              ))}
            </div>
          </div>
        </div>
        
        {/* --- 2. Final, Accurate PromoBanner is placed here --- */}
        <PromoBanner />

      </div>

      {/* Product Grid Section */}
      <div className="mx-2 rounded-3xl p-4 md:mx-0 md:rounded-none md:bg-transparent md:p-0" style={{ backgroundColor: "#e7e0e5" }}>
        <div className={cn("grid grid-cols-2 gap-4 md:grid-cols-3 md:gap-20 lg:grid-cols-3 xl:grid-cols-4", className)}>
          {products.map((eventItem) => {
            const product = eventItem.product;
            const isWishlisted = wishlist?.some((item) => item.productId === product.id) ?? false;

            return (
              <div key={product.id} className="cursor-pointer bg-transparent">
                <EventProductCard product={product} isWishlisted={isWishlisted} userId={userId} />
              </div>
            );
          })}
        </div>

        {loading && (
          <div className="flex justify-center items-center mt-4">
            <Loader2 className="h-8 w-8 animate-spin text-gray-600" />
          </div>
        )}

        {hasMore && !loading && <div ref={observerRef} className="h-10"></div>}

        {!hasMore && !loading && <p className="text-center mt-4 text-gray-500">No more products to show.</p>}
      </div>
    </div>
  );
}

function NoProductCard() {
  return (
    <div className="flex flex-col items-center justify-center gap-5 p-6">
      <EmptyPlaceholder isBackgroundVisible={false} className="w-full max-w-full border-none">
        <EmptyPlaceholderIcon>
          <Icons.AlertTriangle className="size-10" />
        </EmptyPlaceholderIcon>

        <EmptyPlaceholderContent>
          <EmptyPlaceholderTitle>No products found</EmptyPlaceholderTitle>
          <EmptyPlaceholderDescription>We couldn&apos;t find any event products. Try adjusting your filters.</EmptyPlaceholderDescription>
        </EmptyPlaceholderContent>

        <Button asChild>
          <Link href="/">Go back</Link>
        </Button>
      </EmptyPlaceholder>
    </div>
  );
}
