"use client";

import { useQueryStates } from "nuqs";
import { parseAsArrayOf, parseAsInteger, parseAsString, parseAsStringLiteral } from "nuqs";
import { useEffect } from "react";
import { ShopEventProducts } from "./shop-event-products";

interface ShopProductsWrapperProps {
  initialData: any[];
  initialWishlist?: any[];
  userId?: string;
}

export function ShopProductsWrapper({ 
  initialData,
  initialWishlist,
  userId
}: ShopProductsWrapperProps) {
  const [queryStates] = useQueryStates({
    brandIds: parseAsArrayOf(parseAsString, ",").withDefault([]),
    categoryId: parseAsString.withDefault(""),
    subCategoryId: parseAsString.withDefault(""),
    minPrice: parseAsInteger,
    maxPrice: parseAsInteger,
    sortBy: parseAsStringLiteral(["price", "createdAt"] as const).withDefault("createdAt"),
    sortOrder: parseAsStringLiteral(["asc", "desc"] as const).withDefault("desc"),
    page: parseAsInteger.withDefault(1),
  });

  // This component will re-render when any query state changes,
  // which will cause the ShopEventProducts to re-render with new props

  return (
    <ShopEventProducts
      initialData={initialData}
      initialWishlist={initialWishlist}
      userId={userId}
    />
  );
}