"use client";

import { useEffect, useState } from "react";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import {
  EmptyPlaceholder,
  EmptyPlaceholderContent,
  EmptyPlaceholderDescription,
  EmptyPlaceholderIcon,
  EmptyPlaceholderTitle,
} from "@/components/ui/empty-placeholder-general";
import { Icons } from "@/components/icons";
import { Button } from "@/components/ui/button-general";
import Link from "next/link";
import { cn, convertPaiseToRupees, formatPriceTag } from "@/lib/utils";
import Image from "next/image";

interface GuestWishlistItem {
  fullProduct: any;
  id: string;
  title: string;
  slug: string;
  brand: string;
  price: number;
  media?: string[];
}

export default function GuestWishlistPage() {
  const [items, setItems] = useState<GuestWishlistItem[] | null>(null);
  const [removing, setRemoving] = useState<string | null>(null);

  // Load wishlist from localStorage
  useEffect(() => {
    try {
      const raw = localStorage.getItem("guest_wishlist");
      setItems(raw ? JSON.parse(raw) : []);
    } catch {
      setItems([]);
    }
  }, []);

  // Remove single item with smooth animation
  const removeItem = (id: string) => {
    setRemoving(id);
    setTimeout(() => {
      const next = (items ?? []).filter((i) => i.id !== id);
      setItems(next);
      localStorage.setItem("guest_wishlist", JSON.stringify(next));
      setRemoving(null);
    }, 200); // match animation duration
  };

  if (items === null) return <WishlistSkeleton />;
  if (items.length === 0) return <NoWishlistCard />;

  return (
    <div className="relative space-y-5 md:basis-3/4">
      {/* Login prompt */}
      <div className="sticky top-2 z-10 flex justify-center">
        <div className="rounded-lg bg-primary/10 px-4 py-2 text-sm text-primary shadow-md">
          <span>Sign in to save your wishlist permanently.</span>
          <Button size="sm" variant="link" className="ml-2 px-1 text-primary underline">
            <Link href="/auth/signin">Login</Link>
          </Button>
        </div>
      </div>

      <Card className="w-full rounded-2xl shadow-sm border border-border">
        <CardHeader className="px-4 md:p-6">
          <CardTitle className="text-xl font-bold">Your Wishlist</CardTitle>
          <CardDescription>Products you’ve saved for later</CardDescription>
        </CardHeader>
        <Separator />

        <div className="grid grid-cols-2 gap-5 p-4 md:grid-cols-3 md:p-6 xl:grid-cols-4">
          {items.map((item) => (
            <GuestWishlistedProductCard
              key={item.id}
              item={item}
              onRemove={() => removeItem(item.id)}
              isRemoving={removing === item.id}
            />
          ))}
        </div>
      </Card>
    </div>
  );
}

function GuestWishlistedProductCard({
  item,
  onRemove,
  isRemoving,
}: {
  item: GuestWishlistItem;
  onRemove: () => void;
  isRemoving: boolean;
}) {
  return (
    <div
      className={cn(
        "group relative rounded-lg border bg-background shadow-sm transition-all duration-200 hover:shadow-md",
        isRemoving && "opacity-0 scale-95"
      )}
    >
      <Link href={`/products/${item.slug}`} target="_blank" rel="noreferrer">
        <div className="relative aspect-[3/4] overflow-hidden rounded-t-lg">
          <Image
            src={
              item.fullProduct?.media?.[0]?.mediaItem?.url ||
              "https://4o4vm2cu6g.ufs.sh/f/HtysHtJpctzNNQhfcW4g0rgXZuWwadPABUqnljV5RbJMFsx1"
            }
            alt={item.title}
            width={800}
            height={800}
            className="h-full w-full object-cover transition-transform duration-200 group-hover:scale-105"
          />
          <button
            className="absolute top-2 right-2 hidden size-7 items-center justify-center rounded-full bg-foreground/40 text-background transition hover:bg-foreground/80 group-hover:flex"
            onClick={(e) => {
              e.preventDefault();
              onRemove();
            }}
          >
            <Icons.X className="size-4" />
            <span className="sr-only">Remove {item.title}</span>
          </button>
        </div>
      </Link>

      <div className="space-y-1 p-3">
        <p className="truncate text-sm font-medium">{item.title}</p>
        <p className="text-xs text-muted-foreground">{item.brand}</p>
        <p className="text-sm font-semibold">
          {formatPriceTag(parseFloat(convertPaiseToRupees(item.price)), true)}
        </p>
      </div>

      {/* Mobile remove button */}
      <div className="p-3 md:hidden">
        <Button
          size="sm"
          variant="outline"
          className="h-8 w-full text-xs"
          onClick={onRemove}
        >
          Remove
        </Button>
      </div>
    </div>
  );
}

function NoWishlistCard() {
  return (
    <div className="flex flex-col items-center justify-center gap-5 p-6">
      <EmptyPlaceholder isBackgroundVisible={false} className="border-none text-center">
        <EmptyPlaceholderIcon>
          <Icons.Heart className="size-10 text-muted-foreground" />
        </EmptyPlaceholderIcon>
        <EmptyPlaceholderContent>
          <EmptyPlaceholderTitle>No items yet</EmptyPlaceholderTitle>
          <EmptyPlaceholderDescription>
            Your wishlist is empty. Sign in to save your favorites and shop anytime.
          </EmptyPlaceholderDescription>
        </EmptyPlaceholderContent>
        <div className="flex gap-2">
          <Button asChild>
            <Link href="/shop">Continue Shopping</Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/auth/signin">Login</Link>
          </Button>
        </div>
      </EmptyPlaceholder>
    </div>
  );
}

function WishlistSkeleton() {
  return (
    <div className="grid grid-cols-2 gap-5 p-6 md:grid-cols-3 xl:grid-cols-4">
      {Array.from({ length: 8 }).map((_, i) => (
        <div key={i} className="space-y-2">
          <Skeleton className="aspect-[3/4] w-full rounded-lg" />
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-3 w-1/2" />
        </div>
      ))}
    </div>
  );
}
