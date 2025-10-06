import { GeneralShell } from "@/components/globals/layouts";
import { ShopFilters, ShopProducts, ShopSortBy } from "@/components/shop";
import { Label } from "@/components/ui/label";
import { SearchInput } from "@/components/ui/search-input";
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

interface PageProps {
    searchParams: Promise<{
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
        sizes?: string;
    }>;
}

export default async function Page({ searchParams }: PageProps) {
  const productTypes = await productTypeCache.getAll();

  return (
    <GeneralShell>
      <div className="flex flex-col gap-5 md:flex-row">
        {/* Desktop filters - Fixed sidebar */}
        <aside className="hidden md:block md:basis-1/5 md:sticky md:top-4 md:self-start md:max-h-[calc(100vh-2rem)] md:overflow-y-auto">
          <Suspense fallback={<ShopFiltersSkeleton />}>
            <ShopFiltersFetch className="space-y-4 pr-2" />
          </Suspense>
        </aside>

        {/* Divider */}
        <div className="hidden w-px bg-border md:inline-block" />

        {/* Main content */}
        <main className="w-full md:basis-4/5 space-y-5">
          {/* Mobile search and filters */}
          <div className="block md:hidden space-y-4">
            <SearchInput
              type="search"
              placeholder="Search for a product..."
              className="h-12 text-base"
            />
            <Suspense fallback={<ShopFiltersSkeleton />}>
              <ShopFiltersFetch className="space-y-4" />
            </Suspense>
          </div>

          {/* Desktop search and sort */}
          <div className="hidden md:flex md:items-center md:justify-between md:gap-4">
            <div className="flex-1 max-w-md">
              <SearchInput
                type="search"
                placeholder="Search for a product..."
                className="h-10"
              />
            </div>
            <ShopSortBy />
          </div>

          {/* Mobile Product Types */}
          <div className="block md:hidden">
            <ProductTypesRow
              productTypes={productTypes}
              productTypeId={(await searchParams).productTypeId ?? ""}
            />
          </div>

          {/* Desktop Product Types (limit 10) */}
          <div className="hidden md:block">
            <ProductTypesRowDesktop
              productTypes={productTypes.slice(0, 10)}
              productTypeId={(await searchParams).productTypeId ?? ""}
            />
          </div>

          <Separator />

          <Suspense fallback={<ShopProductsSkeleton />}>
            <ShopProductsFetch searchParams={searchParams} />
          </Suspense>
        </main>
      </div>
    </GeneralShell>
  );
}

function ProductTypesRowDesktop({
  productTypes,
  productTypeId,
}: {
  productTypes: { id: string; name: string }[];
  productTypeId?: string;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      <a
        href="?productTypeId="
        className={cn(
          "whitespace-nowrap rounded-lg border px-4 py-2 text-sm font-medium transition-colors hover:bg-gray-50",
          productTypeId === "" && "bg-black text-white border-black hover:bg-gray-900"
        )}
      >
        All Items
      </a>

      {productTypes.map((type) => (
        <a
          key={type.id}
          href={`?productTypeId=${type.id}`}
          className={cn(
            "whitespace-nowrap rounded-lg border px-4 py-2 text-sm font-medium transition-colors hover:bg-gray-50",
            productTypeId === type.id && "bg-black text-white border-black hover:bg-gray-900"
          )}
        >
          {type.name}
        </a>
      ))}
    </div>
  );
}

function ProductTypesRow({
  productTypes,
  productTypeId,
}: {
  productTypes: { id: string; name: string }[];
  productTypeId?: string;
}) {
  return (
    <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
      <a
        href="?productTypeId="
        className={cn(
          "whitespace-nowrap rounded-lg border px-4 py-2 text-sm font-medium transition-colors active:scale-95",
          productTypeId === "" && "bg-black text-white border-black"
        )}
      >
        All Items
      </a>

      {productTypes.map((type) => (
        <a
          key={type.id}
          href={`?productTypeId=${type.id}`}
          className={cn(
            "whitespace-nowrap rounded-lg border px-4 py-2 text-sm font-medium transition-colors active:scale-95",
            productTypeId === type.id && "bg-black text-white border-black"
          )}
        >
          {type.name}
        </a>
      ))}
    </div>
  );
}

async function ShopFiltersFetch(props: GenericProps) {
    const [categories, subCategories, productTypes, allBrands, colors, alphaSize, numSize] =
        await Promise.all([
            categoryCache.getAll(),
            subCategoryCache.getAll(),
            productTypeCache.getAll(),
            brandCache.getAll(),
            productQueries.getUniqueColors(),
            productQueries.getAlphaSizes(),
            productQueries.getNumericSizes(),
        ]);

    console.log("numsize fetched:", numSize);
    console.log("size fetched:", alphaSize);

    const brandsMeta = brandMetaSchema.array().parse(allBrands);

    return (
        <ShopFilters
            sizes={[]}
            categories={categories}
            subCategories={subCategories}
            productTypes={productTypes}
            brandsMeta={brandsMeta}
            colors={colors}
            alphaSize={alphaSize}
            numSize={numSize}
            {...props}
        />
    );
}

async function ShopProductsFetch({ searchParams }: PageProps) {
    const { userId } = await auth();

    const {
        page: pageRaw,
        limit: limitRaw,
        search: searchRaw,
        brandIds: brandIdsRaw,
        minPrice: minPriceRaw,
        maxPrice: maxPriceRaw,
        categoryId: categoryIdRaw,
        subCategoryId: subCategoryIdRaw,
        productTypeId: productTypeIdRaw,
        sortBy: sortByRaw,
        sortOrder: sortOrderRaw,
        colors: colorsRaw,
        sizes: sizesRaw,
    } = await searchParams;

    const limit =
        limitRaw && !isNaN(parseInt(limitRaw)) ? parseInt(limitRaw) : 30;
    const page = pageRaw && !isNaN(parseInt(pageRaw)) ? parseInt(pageRaw) : 1;
    const search = !!searchRaw?.length ? searchRaw : undefined;
    const brandIds = !!brandIdsRaw?.length ? brandIdsRaw.split(",") : undefined;
    const minPrice =
        minPriceRaw && !isNaN(parseInt(minPriceRaw))
            ? parseInt(minPriceRaw) < 0
                ? 0
                : parseInt(minPriceRaw)
            : 0;
    const maxPrice =
        maxPriceRaw && !isNaN(parseInt(maxPriceRaw))
            ? parseInt(maxPriceRaw) > 10000
                ? 10000
                : parseInt(maxPriceRaw)
            : 10000;
    const categoryId = !!categoryIdRaw?.length ? categoryIdRaw : undefined;
    const subCategoryId = !!subCategoryIdRaw?.length
        ? subCategoryIdRaw
        : undefined;
    const productTypeId = !!productTypeIdRaw?.length
        ? productTypeIdRaw
        : undefined;
    const sortBy = !!sortByRaw?.length ? sortByRaw : undefined;
    const sortOrder = !!sortOrderRaw?.length ? sortOrderRaw : undefined;
    const colors = !!colorsRaw?.length ? colorsRaw.split(",") : undefined;
    const sizes = !!sizesRaw?.length ? sizesRaw.split(",") : undefined;

    const [data, userWishlist] = await Promise.all([
        productQueries.getProducts({
            page,
            limit,
            search,
            isAvailable: true,
            isActive: true,
            isPublished: true,
            isDeleted: false,
            verificationStatus: "approved",
            brandIds,
            minPrice,
            maxPrice,
            categoryId: !!categoryId?.length ? categoryId : undefined,
            subcategoryId: !!subCategoryId?.length ? subCategoryId : undefined,
            productTypeId: !!productTypeId?.length ? productTypeId : undefined,
            sortBy,
            sortOrder,
            colors,
            sizes,
        }),
        userId ? userWishlistCache.get(userId) : undefined,
    ]);

    return (
        <ShopProducts
            initialData={data}
            initialWishlist={userWishlist}
            userId={userId ?? undefined}
        />
    );
}

function ShopFiltersSkeleton() {
    return (
        <div className="w-full space-y-4">
            <div className="flex items-center justify-between">
                <h4 className="text-lg font-semibold">Filters</h4>
                <Skeleton className="h-8 w-16" />
            </div>

            <Separator />

            <div className="space-y-3">
                <Label className="text-xs font-semibold uppercase tracking-wide">Category</Label>
                <Skeleton className="h-10" />
            </div>

            <Separator />

            <div className="space-y-3">
                <Label className="text-xs font-semibold uppercase tracking-wide">Brand</Label>
                <Skeleton className="h-10" />
            </div>

            <Separator />

            <div className="space-y-3">
                <Label className="text-xs font-semibold uppercase tracking-wide">Price Range</Label>
                <div className="space-y-2">
                    <Skeleton className="h-6" />
                    <div className="flex gap-2">
                        <Skeleton className="h-4 flex-1" />
                        <Skeleton className="h-4 flex-1" />
                    </div>
                </div>
            </div>

            <Separator />

            <div className="space-y-3">
                <Label className="text-xs font-semibold uppercase tracking-wide">Colors</Label>
                <Skeleton className="h-20" />
            </div>

            <Separator />

            <div className="space-y-3">
                <Label className="text-xs font-semibold uppercase tracking-wide">Sizes</Label>
                <Skeleton className="h-24" />
            </div>
        </div>
    );
}

function ShopProductsSkeleton() {
    return (
        <>
            <div className="grid grid-cols-2 gap-4 md:grid-cols-4 lg:grid-cols-5">
                {[...Array(10)].map((_, i) => (
                    <div key={i} className="space-y-3">
                        <Skeleton className="aspect-[3/4] w-full rounded-lg" />
                        <div className="space-y-2">
                            <Skeleton className="h-4 w-full" />
                            <Skeleton className="h-3 w-2/3" />
                            <Skeleton className="h-5 w-1/3" />
                        </div>
                    </div>
                ))}
            </div>

            <Separator />

            <div className="flex w-full items-center justify-center gap-2">
                {Array.from({ length: 5 }).map((_, i) => (
                    <Skeleton
                        key={i}
                        className={cn("size-10 rounded", {
                            "w-20": i === 0 || i === 4,
                            "hidden md:inline-block": i === 1 || i === 3,
                        })}
                    />
                ))}
            </div>
        </>
    );
}