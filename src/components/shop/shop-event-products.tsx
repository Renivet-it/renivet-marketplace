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
import { Separator } from "../ui/separator";
import { trackProductClick } from "@/actions/track-product";
import {
  useQueryState,
  parseAsInteger,
  parseAsArrayOf,
  parseAsString,
  parseAsStringLiteral,
} from "nuqs";
import { useState, useTransition, useEffect, useRef } from "react";
import { getEventProducts } from "@/actions/event-page";
import { ExhibitionCarousel } from "./carousel-component";

interface ShopEventProductsProps {
  className?: string;
  initialData: any[];
  initialWishlist?: CachedWishlist[];
  userId?: string;
}

export function ShopEventProducts({
  className,
  initialData,
  initialWishlist,
  userId,
}: ShopEventProductsProps) {
  const wishlist = initialWishlist ?? [];

  const [page, setPage] = useQueryState("page", parseAsInteger.withDefault(1));
  const [brandIds] = useQueryState("brandIds", parseAsArrayOf(parseAsString, ",").withDefault([]));
  const [categoryId] = useQueryState("categoryId", parseAsString.withDefault(""));
  const [subCategoryId] = useQueryState("subCategoryId", parseAsString.withDefault(""));
  const [minPrice] = useQueryState("minPrice", parseAsInteger);
  const [maxPrice] = useQueryState("maxPrice", parseAsInteger);
  const [sortBy] = useQueryState("sortBy", parseAsStringLiteral(["price", "createdAt"] as const).withDefault("createdAt"));
  const [sortOrder] = useQueryState("sortOrder", parseAsStringLiteral(["asc", "desc"] as const).withDefault("desc"));

  const [products, setProducts] = useState(initialData);
  const [hasMore, setHasMore] = useState(initialData.length === 24);
  const [isPending, startTransition] = useTransition();

  const prevFilters = useRef({
    brandIds: brandIds.join(','),
    categoryId,
    subCategoryId,
    minPrice,
    maxPrice,
    sortBy,
    sortOrder
  });

  const fetchProducts = (targetPage: number = page) => {
    startTransition(async () => {
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
      setProducts(data);
      setHasMore(data.length === 24);
    });
  };

  useEffect(() => {
    const currentFilters = {
      brandIds: brandIds.join(","),
      categoryId,
      subCategoryId,
      minPrice,
      maxPrice,
      sortBy,
      sortOrder
    };

    const filtersChanged = JSON.stringify(currentFilters) !== JSON.stringify(prevFilters.current);

    if (filtersChanged) {
      fetchProducts(1);
      setPage(1);
      prevFilters.current = currentFilters;
    }
  }, [brandIds, categoryId, subCategoryId, minPrice, maxPrice, sortBy, sortOrder]);

  const handlePageChange = (newPage: number) => {
    fetchProducts(newPage);
    setPage(newPage);
  };

  const handleProductClick = async (productId: string, brandId: string) => {
    try {
      await trackProductClick(productId, brandId);
    } catch (error) {
      console.error("Failed to track click:", error);
    }
  };

  if (!products.length) return <NoProductCard />;

  return (
    <>
      {/* ✅ Mobile Hero Section */}
<div className="block md:hidden mb-6">
  <ExhibitionCarousel slides={[
    {
      title: "Hyderabad Exhibition 2025",
      date: "September 2025",
      description: "Discover Exclusive Handcrafted Pieces, Sustainable Fashion, And Beauty Products Showcased Only At Our Hyderabad Event.",
      imageUrl: "/images/event1.jpg", // Add your actual path
      url: "/events/hyderabad",
    },
    {
      title: "New Collection Launch",
      date: "October 2025",
      description: "Be the first to explore our latest designs and handcrafted pieces this festive season.",
      imageUrl: "/images/event2.jpg",
      url: "/events/launch",
    },
    {
      title: "Special Festive Discounts",
      date: "November 2025",
      description: "Enjoy exclusive discounts on curated items for a limited time.",
      imageUrl: "/images/event3.jpg",
      url: "/offers/festive",
    },
  ]} />
</div>

      {/* ✅ Product Grid */}
      <div
        className={cn(
          "grid grid-cols-2 gap-4 md:grid-cols-3 md:gap-20 lg:grid-cols-3 xl:grid-cols-4",
          className
        )}
      >
        {products.map((eventItem) => {
          const product = eventItem.product;
          const isWishlisted = wishlist?.some((item) => item.productId === product.id) ?? false;

          return (
            <div
              key={product.id}
              onClick={() => handleProductClick(product.id, product.brandId)}
              className="cursor-pointer"
            >
              <ProductCard
                product={product}
                isWishlisted={isWishlisted}
                userId={userId}
              />
            </div>
          );
        })}
      </div>

      <Separator />

      <div className="flex justify-center gap-2 mt-6">
        <Button
          disabled={page <= 1 || isPending}
          onClick={() => handlePageChange(page - 1)}
        >
          Prev
        </Button>
        <span className="px-4 py-2">{page}</span>
        <Button
          disabled={isPending || !hasMore}
          onClick={() => handlePageChange(page + 1)}
        >
          Next
        </Button>
      </div>
    </>
  );
}

function NoProductCard() {
  return (
    <div className="flex flex-col items-center justify-center gap-5 p-6">
      <EmptyPlaceholder
        isBackgroundVisible={false}
        className="w-full max-w-full border-none"
      >
        <EmptyPlaceholderIcon>
          <Icons.AlertTriangle className="size-10" />
        </EmptyPlaceholderIcon>

        <EmptyPlaceholderContent>
          <EmptyPlaceholderTitle>No products found</EmptyPlaceholderTitle>
          <EmptyPlaceholderDescription>
            We couldn&apos;t find any event products. Try adjusting your filters.
          </EmptyPlaceholderDescription>
        </EmptyPlaceholderContent>

        <Button asChild>
          <Link href="/">Go back</Link>
        </Button>
      </EmptyPlaceholder>
    </div>
  );
}
