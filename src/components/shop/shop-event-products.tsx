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
import { useEffect, useState, useTransition } from "react";
import { getEventProducts } from "@/actions/event-page";

interface ShopEventProductsProps extends GenericProps {
  initialData: any[];
  initialWishlist?: CachedWishlist[];
  userId?: string;
}

export function ShopEventProducts({
  className,
  initialData,
  initialWishlist,
  userId,
  ...props
}: ShopEventProductsProps) {
  const wishlist = initialWishlist ?? [];

  // 🔹 Query states (sync with ShopFilters)
  const [page, setPage] = useQueryState("page", parseAsInteger.withDefault(1));
  const [brandIds] = useQueryState("brandIds", parseAsArrayOf(parseAsString, ",").withDefault([]));
  const [categoryId] = useQueryState("categoryId", parseAsString.withDefault(""));
  const [subCategoryId] = useQueryState("subcategoryId", parseAsString.withDefault(""));
  const [productTypeId] = useQueryState("productTypeId", parseAsString.withDefault(""));
  const [minPrice] = useQueryState("minPrice", parseAsInteger.withDefault(0));
  const [maxPrice] = useQueryState("maxPrice", parseAsInteger.withDefault(10000));
  const [sortBy] = useQueryState("sortBy", parseAsStringLiteral(["price", "createdAt"] as const).withDefault("createdAt"));
  const [sortOrder] = useQueryState("sortOrder", parseAsStringLiteral(["asc", "desc"] as const).withDefault("desc"));

  const [products, setProducts] = useState(initialData);
  const [isPending, startTransition] = useTransition();

  // 🔹 Refetch whenever filters or page change
useEffect(() => {
  startTransition(async () => {
    // build clean payload
    const filters: Record<string, any> = {
      page,
      limit: 24,
      sortBy,
      sortOrder,
    };

    if (brandIds.length > 0) filters.brandIds = brandIds;
    if (categoryId) filters.categoryId = categoryId;
    if (subCategoryId) filters.subCategoryId = subCategoryId;
    if (productTypeId) filters.productTypeId = productTypeId;
    if (minPrice > 0) filters.minPrice = minPrice;
    if (maxPrice < 10000) filters.maxPrice = maxPrice;

    const data = await getEventProducts(filters);
    setProducts(data);
  });
}, [
  page,
  brandIds,
  categoryId,
  subCategoryId,
  productTypeId,
  minPrice,
  maxPrice,
  sortBy,
  sortOrder,
]);

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
      {/* 🔹 Products */}
      <div
        className={cn(
          "grid grid-cols-2 gap-4 md:grid-cols-3 md:gap-20 lg:grid-cols-3 xl:grid-cols-4",
          className
        )}
        {...props}
      >
        {products.map((eventItem) => {
          const product = eventItem.product;
          const isWishlisted =
            wishlist?.some((item) => item.productId === product.id) ?? false;

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

      {/* 🔹 Pagination */}
      <div className="flex justify-center gap-2 mt-6">
        <Button
          disabled={page <= 1 || isPending}
          onClick={() => setPage(page - 1)}
        >
          Prev
        </Button>
        <span className="px-4 py-2">{page}</span>
        <Button disabled={isPending} onClick={() => setPage(page + 1)}>
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
