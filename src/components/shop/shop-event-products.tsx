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

interface ShopEventProductsProps extends GenericProps {
  initialData: any[]; // coming from getNewEventPage()
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
  const products = initialData ?? [];
  const wishlist = initialWishlist ?? [];

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