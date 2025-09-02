"use client";

import { cn, formatPriceTag } from "@/lib/utils";
import { BrandMeta, Category, SubCategory } from "@/lib/validations";
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
import { MultipleSelectorGeneral } from "../ui/multi-select-general";
import { ProductSearch } from "../ui/product-search";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select-general";
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

interface EventFilterProps extends GenericProps {
  brandsMeta: BrandMeta[];
  categories: Category[];
  subCategories: SubCategory[];
}

const sortByWithOrderTypes = [
  { label: "Price: High to Low", value: "price:desc" },
  { label: "Price: Low to High", value: "price:asc" },
  { label: "Newest First", value: "createdAt:desc" },
  { label: "Oldest First", value: "createdAt:asc" },
];

export function ShopEventFilters({
  className,
  brandsMeta,
  categories,
  subCategories,
  ...props
}: EventFilterProps) {
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
        >
          <SheetHeader className="sr-only p-4 text-start">
            <SheetTitle>Select Filters</SheetTitle>
          </SheetHeader>

          <ShopEventFiltersSection
            className={cn("w-auto basis-full p-4", className)}
            brandsMeta={brandsMeta}
            categories={categories}
            subCategories={subCategories}
            {...props}
          />

          <div className="sticky bottom-0 border-t bg-background p-4">
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
    <ShopEventFiltersSection
      className={cn("", className)}
      brandsMeta={brandsMeta}
      categories={categories}
      subCategories={subCategories}
      {...props}
    />
  );
}

function ShopEventFiltersSection({
  className,
  brandsMeta,
  categories,
  subCategories,
  ...props
}: EventFilterProps) {
  const [brandIds, setBrandIds] = useQueryState(
    "brandIds",
    parseAsArrayOf(parseAsString, ",").withDefault([])
  );
  const [categoryId, setCategoryId] = useQueryState(
    "categoryId",
    parseAsString.withDefault("")
  );
  const [subCategoryId, setSubCategoryId] = useQueryState(
    "subCategoryId",
    parseAsString.withDefault("")
  );
  const [minPrice, setMinPrice] = useQueryState(
    "minPrice",
    parseAsInteger.withDefault(0)
  );
  const [maxPrice, setMaxPrice] = useQueryState(
    "maxPrice",
    parseAsInteger.withDefault(10000)
  );
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

  const [priceRange, setPriceRange] = useState<number[]>([
    minPrice ? (minPrice < 0 ? 0 : minPrice) : 0,
    maxPrice ? (maxPrice > 10000 ? 10000 : maxPrice) : 10000,
  ]);

  const handleSort = (value: string) => {
    const [sBy, sOrder] = value.split(":");
    setSortBy(sBy as "price" | "createdAt");
    setSortOrder(sOrder as "asc" | "desc");
  };

  return (
    <div className={cn("", className)} {...props}>
      <h4 className="text-lg">Event Filters</h4>
      <Separator />

      {/* Search */}
      <ProductSearch
        type="search"
        placeholder="Search event products..."
      />

      <Separator />

      {/* Category Filter */}
      <div className="space-y-1">
        <Label className="font-semibold uppercase">Category</Label>
        <Select
          value={categoryId}
          onValueChange={(val) => {
            setCategoryId(val);
            setSubCategoryId(""); // reset subcategory if category changes
          }}
        >
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Select category" />
          </SelectTrigger>
          <SelectContent>
            {categories.map((cat) => (
              <SelectItem key={cat.id} value={cat.id}>
                {cat.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* SubCategory Filter */}
      {categoryId && (
        <>
          <Separator />
          <div className="space-y-1">
            <Label className="font-semibold uppercase">Sub Category</Label>
            <Select
              value={subCategoryId}
              onValueChange={setSubCategoryId}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select sub category" />
              </SelectTrigger>
              <SelectContent>
                {subCategories
                  .filter((sub) => sub.categoryId === categoryId)
                  .map((sub) => (
                    <SelectItem key={sub.id} value={sub.id}>
                      {sub.name}
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
          </div>
        </>
      )}

      <Separator />

      {/* Brand Filter */}
      <div className="space-y-1">
        <Label className="font-semibold uppercase">Brand</Label>

        <MultipleSelectorGeneral
          commandProps={{ label: "Brands" }}
          defaultOptions={brandsMeta
            .map((brand) => ({
              label: brand.name,
              value: brand.slug,
            }))
            .sort((a, b) => a.value.localeCompare(b.value))}
          placeholder="Select brands"
          emptyIndicator={
            <p className="text-center text-sm">No results found</p>
          }
          value={brandsMeta
            .filter((brand) => brandIds.includes(brand.id))
            .map((brand) => ({
              label: brand.name,
              value: brand.slug,
            }))}
          onChange={(options) =>
            setBrandIds(
              options.map(
                (option) =>
                  brandsMeta.find((b) => b.slug === option.value)?.id ?? ""
              )
            )
          }
        />
      </div>

      <Separator />

      {/* Price Filter */}
      <div className="space-y-3">
        <div className="space-y-2">
          <Label className="font-semibold uppercase" htmlFor="price_slider">
            Price
          </Label>

          <Slider
            id="price_slider"
            value={priceRange}
            step={100}
            onValueChange={setPriceRange}
            onValueCommit={(values) => {
              setMinPrice(values[0]);
              setMaxPrice(values[1]);
            }}
            min={0}
            max={10000}
            minStepsBetweenThumbs={1}
            aria-label="Price range slider"
          />
        </div>

        <div>
          <Label className="tabular-nums">
            {formatPriceTag(priceRange[0])} - {formatPriceTag(priceRange[1])}
            {priceRange[1] === 10000 && "+"}
          </Label>
        </div>
      </div>

      <Separator />

      {/* Sort By */}
      <div className="space-y-1">
        <Label className="font-semibold uppercase" htmlFor="sort_select">
          Sort By
        </Label>

        <Select
          value={`${sortBy}:${sortOrder}`}
          onValueChange={handleSort}
        >
          <SelectTrigger className="w-full" id="sort_select">
            <SelectValue placeholder="Sort By" />
          </SelectTrigger>

          <SelectContent>
            {sortByWithOrderTypes.map((x) => (
              <SelectItem key={x.value} value={x.value}>
                {x.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}
