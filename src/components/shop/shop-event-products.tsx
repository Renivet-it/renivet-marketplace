"use client";

import { cn } from "@/lib/utils";
import { CachedWishlist } from "@/lib/validations";
import Link from "next/link";
import { ProductCard } from "../globals/cards";
import { Icons } from "../icons";
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
import confetti from "canvas-confetti"; // 🎉 celebration library

interface ShopEventProductsProps {
  className?: string;
  initialData: any[];
  initialWishlist?: CachedWishlist[];
  userId?: string;
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
}: ShopEventProductsProps) {
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

  // 🎉 Celebration effect on first mount
  useEffect(() => {
    confetti({
      particleCount: 200,
      spread: 100,
      origin: { y: 0.6 },
    });

    // small bursts for a few seconds
    const interval = setInterval(() => {
      confetti({
        particleCount: 50,
        spread: 70,
        origin: { x: Math.random(), y: Math.random() - 0.2 },
      });
    }, 1200);

    setTimeout(() => clearInterval(interval), 4000); // stop after 4s
  }, []);

  if (!products.length) return <NoProductCard />;

  return (
    <div className="min-h-screen bg-[#f4f0ec] relative overflow-hidden">
      {/* Mobile-only container for Carousel and Categories */}
      <div className="block md:hidden">
        <ExhibitionCarousel
          slides={[
            {
              title: "Hyderabad Exhibition 2025",
              date: "September 2025",
              description: "Discover Exclusive Handcrafted Pieces, Sustainable Fashion, And Beauty Products Showcased Only At Our Hyderabad Event.",
              imageUrl: "/images/event1.jpg",
              url: "/events/hyderabad",
            },
          ]}
        />

        {/* Category Section */}
        <div className="p-2 mb-2">
          <div className="rounded-2xl py-4 px-2 shadow-sm w-full overflow-hidden" style={{ backgroundColor: "#ece5f1" }}>
            <div className="grid grid-cols-5 gap-1 w-full">
              {categories.map((cat) => (
                <Link key={cat.id} href={`/event/${cat.id}`} className="flex flex-col items-center justify-center w-full">
                  <div className="rounded-full overflow-hidden mb-1 mx-auto" style={{ width: "45px", height: "43px", backgroundColor: "#5f3297" }}>
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
      </div>

      {/* Product Grid Section */}
      <div className="mx-2 rounded-3xl p-4 md:mx-0 md:rounded-none md:bg-transparent md:p-0" style={{ backgroundColor: "#e7e0e5" }}>
        <div className={cn("grid grid-cols-2 gap-4 md:grid-cols-3 md:gap-20 lg:grid-cols-3 xl:grid-cols-4", className)}>
          {products.map((eventItem) => {
            const product = eventItem.product;
            const isWishlisted = wishlist?.some((item) => item.productId === product.id) ?? false;

            return (
              <div key={product.id} className="cursor-pointer bg-transparent">
                <ProductCard product={product} isWishlisted={isWishlisted} userId={userId} />
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
