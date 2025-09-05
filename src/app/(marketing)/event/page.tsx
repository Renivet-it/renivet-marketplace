import { GeneralShellEvent } from "@/components/globals/layouts";
import { ShopEventProducts, ShopEventFilters, ShopProducts, ShopSortBy } from "@/components/shop";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { productQueries } from "@/lib/db/queries";
import {
  brandCache,
  categoryCache,
  productTypeCache,
  subCategoryCache,
  userWishlistCache,
} from "@/lib/redis/methods";
import { cn } from "@/lib/utils";
import { brandMetaSchema } from "@/lib/validations";
import { auth } from "@clerk/nextjs/server";
import { Suspense } from "react";

type SearchParamsShape = {
  page?: string;
  limit?: string;
  search?: string;
  brandIds?: string;
  colors?: string;
  minPrice?: string;
  maxPrice?: string;
  categoryId?: string;
  subCategoryId?: string;
  productTypeId?: string;
  sortBy?: "price" | "createdAt";
  sortOrder?: "asc" | "desc";
};

type EventFilters = {
  page?: number;
  limit?: number;
  search?: string;
  brandIds?: string[];
  colors?: string[];
  minPrice?: number | undefined;
  maxPrice?: number | undefined;
  categoryId?: string | undefined;
  subCategoryId?: string | undefined;
  productTypeId?: string | undefined;
  sortBy?: "price" | "createdAt" | undefined;
  sortOrder?: "asc" | "desc" | undefined;
};

export default async function Page({ searchParams }: { searchParams: Promise<SearchParamsShape> }) {
  const resolvedParams = await searchParams;

  return (
    <GeneralShellEvent>
      <div className="flex flex-col gap-5 md:flex-row">
        {/* ✅ Filters - Desktop Only */}
        <Suspense fallback={<ShopFiltersSkeleton />}>
          <div className="hidden md:block w-full basis-1/6 space-y-4">
            <ShopFiltersFetch />
          </div>
        </Suspense>

        {/* ✅ Divider for Desktop */}
        <div className="hidden md:inline-block w-px bg-border" />

        <div className="w-full basis-5/6 space-y-5">
          {/* ✅ SortBy - Desktop Only */}
          <div className="hidden md:flex justify-end">
            <ShopSortBy />
          </div>

          {/* ✅ Separator - Desktop Only */}
          <div className="hidden md:block">
            <Separator />
          </div>

          {/* ✅ Products */}
          <Suspense fallback={<ShopProductsSkeleton />}>
            <ShopProductsFetch searchParams={resolvedParams} />
          </Suspense>
        </div>
      </div>
    </GeneralShellEvent>
  );
}

async function ShopFiltersFetch(props: { className?: string }) {
  const [categories, subCategories, productTypes, allBrands] =
    await Promise.all([
      categoryCache.getAll(),
      subCategoryCache.getAll(),
      productTypeCache.getAll(),
      brandCache.getAll(),
    ]);

  const brandsMeta = brandMetaSchema.array().parse(allBrands);

  return (
    <ShopEventFilters
      categories={categories}
      subCategories={subCategories}
      brandsMeta={brandsMeta}
      {...props}
    />
  );
}

async function ShopProductsFetch({ searchParams }: { searchParams?: SearchParamsShape }) {
  const { userId } = await auth();

  const filters: EventFilters = {
    page: searchParams?.page ? Number(searchParams.page) : 1,
    limit: searchParams?.limit ? Number(searchParams.limit) : 24,
    search: searchParams?.search?.trim() || undefined,
    brandIds: searchParams?.brandIds ? searchParams.brandIds.split(",").filter(Boolean) : [],
    colors: searchParams?.colors ? searchParams.colors.split(",").filter(Boolean) : [],
    minPrice: searchParams?.minPrice ? Number(searchParams.minPrice) : undefined,
    maxPrice: searchParams?.maxPrice ? Number(searchParams.maxPrice) : undefined,
    categoryId: searchParams?.categoryId || undefined,
    subCategoryId: searchParams?.subCategoryId || undefined,
    productTypeId: searchParams?.productTypeId || undefined,
    sortBy: (searchParams?.sortBy as EventFilters["sortBy"]) || "createdAt",
    sortOrder: (searchParams?.sortOrder as EventFilters["sortOrder"]) || "desc",
  };

  const [data, userWishlist] = await Promise.all([
    productQueries.getNewEventPage(filters),
    userId ? userWishlistCache.get(userId) : undefined,
  ]);

  return (
    <ShopEventProducts
      initialData={data}
      initialWishlist={userWishlist}
      userId={userId ?? undefined}
    />
  );
}

function ShopFiltersSkeleton() {
  return (
    <div className="w-full basis-1/6 space-y-4">
      <h4 className="text-lg">Filters</h4>
      <Separator />
      <div className="space-y-1">
        <Label className="font-semibold uppercase">Category</Label>
        <Skeleton className="h-10" />
      </div>
      <Separator />
      <div className="space-y-1">
        <Label className="font-semibold uppercase">Brand</Label>
        <Skeleton className="h-10" />
      </div>
      <Separator />
      <div className="space-y-1">
        <div className="space-y-2">
          <Label className="font-semibold uppercase">Price</Label>
          <Skeleton className="h-6" />
        </div>
        <Skeleton className="h-4 w-1/2" />
      </div>
      <Separator />
      <div className="space-y-1">
        <Label className="font-semibold uppercase">Colors</Label>
        <Skeleton className="h-10" />
      </div>
      <Separator />
      <div className="space-y-1">
        <Label className="font-semibold uppercase">Sort By</Label>
        <Skeleton className="h-10" />
      </div>
    </div>
  );
}

function ShopProductsSkeleton() {
  return (
    <>
      <div className="grid grid-cols-1 gap-5 md:grid-cols-5">
        {[...Array(8)].map((_, i) => (
          <div key={i}>
            <div>
              <Skeleton className="aspect-[3/4] size-full" />
            </div>
            <div className="space-y-2 py-2">
              <div className="space-y-1">
                <Skeleton className="h-5 w-full" />
                <Skeleton className="h-3 w-1/2" />
              </div>
              <Skeleton className="h-5 w-1/3" />
            </div>
          </div>
        ))}
      </div>
      <Separator />
      <div className="flex w-full items-center justify-center gap-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton
            key={i}
            className={cn("size-10", {
              "w-20": i === 0 || i === 3,
              "hidden md:inline-block": i === 1 || i === 2,
            })}
          />
        ))}
      </div>
    </>
  );
}