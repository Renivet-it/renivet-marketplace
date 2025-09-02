import { GeneralShell } from "@/components/globals/layouts";
import { ShopEventProducts, ShopEventFilters, ShopProducts, ShopSortBy } from "@/components/shop";
import { Label } from "@/components/ui/label";
// import { SearchInput } from "@/components/ui/search-input";
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
  brandIds?: string; // comma separated ids from nuqs
  colors?: string; // comma separated values
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

// pages/your-event-page-file.tsx  (or wherever the Page component lives)
export default async function Page({ searchParams }: PageProps) {
  const resolvedParams = await searchParams;

  return (
    <GeneralShell>
      <div className="flex flex-col gap-5 md:flex-row">
        <Suspense fallback={<ShopFiltersSkeleton />}>
          <ShopFiltersFetch className="w-full basis-1/6 space-y-4" />
        </Suspense>

        <div className="hidden w-px bg-border md:inline-block" />

        <div className="w-full basis-5/6 space-y-5">
          <div className="flex justify-end">
            <ShopSortBy />
          </div>

          <Separator />

          <Suspense fallback={<ShopProductsSkeleton />}>
            {/* pass resolved params here */}
            <ShopProductsFetch searchParams={resolvedParams} />
          </Suspense>
        </div>
      </div>
    </GeneralShell>
  );
}


async function ShopFiltersFetch(props: GenericProps) {
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

// 🔹 NEW: Using your new event page data model
async function ShopProductsFetch({ searchParams }: { searchParams?: SearchParamsShape }) {
  const { userId } = await auth();

  // build a simple filters object from query params
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
