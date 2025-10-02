"use client";

import { cn, formatPriceTag } from "@/lib/utils";
import {
  BrandMeta,
  CachedCategory,
  CachedProductType,
  CachedSubCategory,
} from "@/lib/validations";
import { useMediaQuery } from "@mantine/hooks";
import {
  parseAsArrayOf,
  parseAsInteger,
  parseAsString,
  parseAsStringLiteral,
  useQueryState,
} from "nuqs";
import { useState } from "react";
import { Icons } from "../icons";
import { Button } from "../ui/button-general";
import { Label } from "../ui/label";
import { ProductSearch } from "../ui/product-search";
import { Separator } from "../ui/separator";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "../ui/sheet";
import { Slider } from "../ui/slider";
import { Checkbox } from "../ui/checkbox";

interface PageProps extends GenericProps {
  brandsMeta: BrandMeta[];
  categories: CachedCategory[];
  subCategories: CachedSubCategory[];
  productTypes: CachedProductType[];
}

const sortByWithOrderTypes = [
  { label: "Price: High to Low", value: "price:desc" },
  { label: "Price: Low to High", value: "price:asc" },
  { label: "Newest First", value: "createdAt:desc" },
  { label: "Oldest First", value: "createdAt:asc" },
];

export function ShopFilters({
  className,
  brandsMeta,
  categories,
  subCategories,
  productTypes,
  ...props
}: PageProps) {
  const isMobile = useMediaQuery("(max-width: 768px)");

  return isMobile ? (
    <>
      <Sheet>
        <SheetTrigger asChild>
          <Button>
            <Icons.Filter />
            Filters
          </Button>
        </SheetTrigger>

        <SheetContent
          side="bottom"
          className="h-screen overflow-auto p-0 [&>button]:hidden"
          style={{ scrollbarWidth: "none" }}
        >
          <SheetHeader className="sr-only p-4 text-start">
            <SheetTitle>Select Filters</SheetTitle>
          </SheetHeader>

          <ShopFiltersSection
            className={cn("w-auto basis-full p-4", className)}
            brandsMeta={brandsMeta}
            categories={categories}
            subCategories={subCategories}
            productTypes={productTypes}
            {...props}
          />

          <div className="sticky bottom-0 space-y-4 border-t bg-background p-4">
            <SheetFooter>
              <SheetClose asChild>
                <Button>Close</Button>
              </SheetClose>
            </SheetFooter>
          </div>
        </SheetContent>
      </Sheet>

      <Separator />
    </>
  ) : (
    <ShopFiltersSection
      className={cn("", className)}
      brandsMeta={brandsMeta}
      categories={categories}
      subCategories={subCategories}
      productTypes={productTypes}
      {...props}
    />
  );
}

function ShopFiltersSection({
  className,
  brandsMeta,
  categories,
  subCategories,
  productTypes,
  ...props
}: PageProps) {
  const [brandIds, setBrandIds] = useQueryState(
    "brandIds",
    parseAsArrayOf(parseAsString, ",").withDefault([])
  );
  const [minPrice, setMinPrice] = useQueryState(
    "minPrice",
    parseAsInteger.withDefault(0)
  );
  const [maxPrice, setMaxPrice] = useQueryState(
    "maxPrice",
    parseAsInteger.withDefault(10000)
  );
  const [categoryId, setCategoryId] = useQueryState("categoryId", {
    defaultValue: "",
  });
  const [subCategoryId, setSubCategoryId] = useQueryState("subcategoryId", {
    defaultValue: "",
  });
  const [productTypeId, setProductTypeId] = useQueryState("productTypeId", {
    defaultValue: "",
  });

  const [priceRange, setPriceRange] = useState<number[]>([
    minPrice ? (minPrice < 0 ? 0 : minPrice) : 0,
    maxPrice ? (maxPrice > 10000 ? 10000 : maxPrice) : 10000,
  ]);

  const [showAllBrands, setShowAllBrands] = useState(false);

  // ✅ Reset All
  const handleResetAll = () => {
    setCategoryId("");
    setSubCategoryId("");
    setProductTypeId("");
    setBrandIds([]);
    setMinPrice(0);
    setMaxPrice(10000);
    setPriceRange([0, 10000]);
  };

  const handleCategoryChange = (id: string) => {
    setCategoryId(id);
    setSubCategoryId("");
    setProductTypeId("");
  };

  const handleSubCategoryChange = (id: string) => {
    setSubCategoryId(id);
    setProductTypeId("");
  };

  return (
    <div className={cn("space-y-6", className)} {...props}>
      <div className="flex items-center justify-between">
        <h4 className="text-lg font-semibold">Filters</h4>
        <Button size="sm" variant="outline" onClick={handleResetAll}>
          <Icons.History className="mr-1" />
          Reset All
        </Button>
      </div>

      <Separator />

      <ProductSearch type="search" placeholder="Search for a product..." />

      <Separator />

      {/* Categories */}
      <div className="space-y-2">
        <Label className="font-semibold uppercase">Category</Label>
        <div className="space-y-2 max-h-48 overflow-y-auto">
          {categories.map((cat) => (
            <div key={cat.id} className="flex items-center space-x-2">
              <Checkbox
                id={cat.id}
                checked={categoryId === cat.id}
                onCheckedChange={() =>
                  handleCategoryChange(categoryId === cat.id ? "" : cat.id)
                }
              />
              <Label htmlFor={cat.id}>{cat.name}</Label>
            </div>
          ))}
        </div>
      </div>

      {/* Subcategories - Always show */}
      <div className="space-y-2">
        <Label className="font-semibold uppercase">Subcategory</Label>
        <div className="space-y-2 max-h-48 overflow-y-auto">
          {subCategories
            .filter((s) =>
              categoryId ? String(s.categoryId) === String(categoryId) : true
            )
            .map((sub) => (
              <div key={sub.id} className="flex items-center space-x-2">
                <Checkbox
                  id={sub.id}
                  checked={subCategoryId === sub.id}
                  onCheckedChange={() =>
                    handleSubCategoryChange(
                      subCategoryId === sub.id ? "" : sub.id
                    )
                  }
                />
                <Label htmlFor={sub.id}>{sub.name}</Label>
              </div>
            ))}
        </div>
      </div>

      {/* Product Types - Always show */}
      <div className="space-y-2">
        <Label className="font-semibold uppercase">Type</Label>
        <div className="space-y-2 max-h-48 overflow-y-auto">
          {productTypes
            .filter((t) =>
              subCategoryId
                ? String(t.subCategoryId) === String(subCategoryId)
                : true
            )
            .map((t) => (
              <div key={t.id} className="flex items-center space-x-2">
                <Checkbox
                  id={t.id}
                  checked={productTypeId === t.id}
                  onCheckedChange={() =>
                    setProductTypeId(productTypeId === t.id ? "" : t.id)
                  }
                />
                <Label htmlFor={t.id}>{t.name}</Label>
              </div>
            ))}
        </div>
      </div>

      <Separator />

      {/* Brands */}
      <div className="space-y-2">
        <Label className="font-semibold uppercase">Brands</Label>
        <div className="space-y-2">
          {(showAllBrands ? brandsMeta : brandsMeta.slice(0, 5)).map((brand) => (
            <div key={brand.id} className="flex items-center space-x-2">
              <Checkbox
                id={brand.id}
                checked={brandIds.includes(brand.id)}
                onCheckedChange={() =>
                  setBrandIds(
                    brandIds.includes(brand.id)
                      ? brandIds.filter((b) => b !== brand.id)
                      : [...brandIds, brand.id]
                  )
                }
              />
              <Label htmlFor={brand.id}>{brand.name}</Label>
            </div>
          ))}
        </div>
        {brandsMeta.length > 5 && (
          <button
            className="text-sm text-gray-600 hover:underline"
            onClick={() => setShowAllBrands(!showAllBrands)}
          >
            {showAllBrands ? "View Less -" : "View More +"}
          </button>
        )}
      </div>

      <Separator />

      {/* Price */}
      <div className="space-y-3">
        <Label className="font-semibold uppercase">Price</Label>
        <Slider
          value={priceRange}
          step={100}
          min={0}
          max={10000}
          onValueChange={setPriceRange}
          onValueCommit={(values) => {
            setMinPrice(values[0]);
            setMaxPrice(values[1]);
          }}
        />
        <p className="text-sm tabular-nums">
          {formatPriceTag(priceRange[0])} - {formatPriceTag(priceRange[1])}
          {priceRange[1] === 10000 && "+"}
        </p>
      </div>
    </div>
  );
}

export function ShopSortBy() {
  const handleSort = (value: string) => {
    const [sortBy, sortOrder] = value.split(":");
    setSortBy(sortBy as "price" | "createdAt");
    setSortOrder(sortOrder as "asc" | "desc");
  };
  const [sortBy, setSortBy] = useQueryState(
    "sortBy",
    parseAsStringLiteral(["price", "createdAt"] as const).withDefault(
      "createdAt"
    )
  );
  const [sortOrder, setSortOrder] = useQueryState(
    "sortOrder",
    parseAsStringLiteral(["asc", "desc"] as const).withDefault("desc")
  );
  return (
    <div className="w-52 space-y-1">
      <select
        className="w-full border rounded-md px-3 py-2"
        value={`${sortBy}:${sortOrder}`}
        onChange={(e) => handleSort(e.target.value)}
      >
        {sortByWithOrderTypes.map((x) => (
          <option key={x.value} value={x.value}>
            {x.label}
          </option>
        ))}
      </select>
    </div>
  );
}
