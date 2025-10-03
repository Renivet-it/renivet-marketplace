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
import { RadioGroup, RadioGroupItem } from "../ui/radio-group";

// --- FULLY DYNAMIC COLOR SOLUTION ---
import parse from "color-parse";

// Convert RGBA array to hex
function rgbaToHex(rgba: number[]): string {
  const toHex = (c: number) => c.toString(16).padStart(2, "0");
  return `#${toHex(rgba[0])}${toHex(rgba[1])}${toHex(rgba[2])}`;
}

// Generate a unique color from a string hash
function stringToColor(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
    hash = hash & hash; // 32bit int
  }
  const r = (hash >> 16) & 0xff;
  const g = (hash >> 8) & 0xff;
  const b = hash & 0xff;
  return `#${r.toString(16).padStart(2, "0")}${g
    .toString(16)
    .padStart(2, "0")}${b.toString(16).padStart(2, "0")}`;
}

// Fully dynamic color parsing
const getColorHex = (colorName: string): string => {
  if (!colorName) return "#CCCCCC";

  const cleaned = colorName.toLowerCase().split(/[\s&_-]+/);

  for (const word of cleaned) {
    try {
      const parsed = parse(word);
      if (parsed.space) return rgbaToHex(parsed.values);
    } catch {}
  }

  return stringToColor(colorName);
};

// Determine the best checkmark color
const getCheckmarkColor = (hex: string): string => {
  if (!hex || hex.length !== 7) return "black";
  const r = parseInt(hex.substring(1, 3), 16);
  const g = parseInt(hex.substring(3, 5), 16);
  const b = parseInt(hex.substring(5, 7), 16);
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance < 0.5 ? "white" : "black";
};

// --- COMPONENTS ---
interface PageProps extends GenericProps {
  brandsMeta: BrandMeta[];
  categories: CachedCategory[];
  subCategories: CachedSubCategory[];
  productTypes: CachedProductType[];
  colors: string[];
  alphaSize: string[];
  numSize: string[];
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
  colors,
  alphaSize,
  numSize,
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
            colors={colors}
            alphaSize={alphaSize}
            numSize={numSize}
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
      colors={colors}
      alphaSize={alphaSize}
      numSize={numSize}
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
  colors,
  alphaSize,
  numSize,
  ...props
}: PageProps) {
  const [brandIds, setBrandIds] = useQueryState(
    "brandIds",
    parseAsArrayOf(parseAsString, ",").withDefault([])
  );
  const [colorFilters, setColorFilters] = useQueryState(
    "colors",
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
  const [alphaSizeFilters, setAlphaSizeFilters] = useQueryState(
    "alphaSize",
    parseAsArrayOf(parseAsString, ",").withDefault([])
  );
  const [numSizeFilters, setNumSizeFilters] = useQueryState(
    "numSize",
    parseAsArrayOf(parseAsString, ",").withDefault([])
  );

  const [priceRange, setPriceRange] = useState<number[]>([
    minPrice ? (minPrice < 0 ? 0 : minPrice) : 0,
    maxPrice ? (maxPrice > 10000 ? 10000 : maxPrice) : 10000,
  ]);

  const [showAllBrands, setShowAllBrands] = useState(false);
  const [showAllColors, setShowAllColors] = useState(false);

  const handleResetAll = () => {
    setCategoryId("");
    setSubCategoryId("");
    setProductTypeId("");
    setBrandIds([]);
    setColorFilters([]);
    setAlphaSizeFilters([]);
    setNumSizeFilters([]);
    setMinPrice(0);
    setMaxPrice(10000);
    setPriceRange([0, 10000]);
  };

  const handleCategoryChange = (id: string) => {
    setCategoryId(id === categoryId ? "" : id);
    setSubCategoryId("");
    setProductTypeId("");
  };

  const handleSubCategoryChange = (id: string) => {
    setSubCategoryId(id === subCategoryId ? "" : id);
    setProductTypeId("");
  };

  const handleProductTypeChange = (id: string) => {
    setProductTypeId(id === productTypeId ? "" : id);
  };

  const handleColorChange = (colorName: string) => {
    setColorFilters(
      colorFilters.includes(colorName)
        ? colorFilters.filter((c) => c !== colorName)
        : [...colorFilters, colorName]
    );
  };

  const handleAlphaSizeChange = (size: string) => {
    setAlphaSizeFilters(
      alphaSizeFilters.includes(size)
        ? alphaSizeFilters.filter((s) => s !== size)
        : [...alphaSizeFilters, size]
    );
  };

  const handleNumSizeChange = (size: string) => {
    setNumSizeFilters(
      numSizeFilters.includes(size)
        ? numSizeFilters.filter((s) => s !== size)
        : [...numSizeFilters, size]
    );
  };

  const visibleColors = showAllColors ? colors : colors.slice(0, 21);

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

      {/* Categories */}
      <div className="space-y-2">
        <Label className="font-semibold uppercase">Category</Label>
        <RadioGroup
          value={categoryId}
          onValueChange={handleCategoryChange}
          className="space-y-2"
        >
          {categories.map((cat) => (
            <div key={cat.id} className="flex items-center space-x-2">
              <RadioGroupItem value={cat.id} id={cat.id} />
              <Label htmlFor={cat.id} className="font-normal">{cat.name}</Label>
            </div>
          ))}
        </RadioGroup>
      </div>

      <Separator />

      {/* Subcategories */}
      <div className="space-y-2">
        <Label className="font-semibold uppercase">Subcategory</Label>
        <RadioGroup
          value={subCategoryId}
          onValueChange={handleSubCategoryChange}
          className="max-h-48 space-y-2 overflow-y-auto"
        >
          {subCategories
            .filter((s) =>
              categoryId ? String(s.categoryId) === String(categoryId) : true
            )
            .map((sub) => (
              <div key={sub.id} className="flex items-center space-x-2">
                <RadioGroupItem value={sub.id} id={sub.id} />
                <Label htmlFor={sub.id} className="font-normal">{sub.name}</Label>
              </div>
            ))}
        </RadioGroup>
      </div>

      <Separator />

      {/* Product Types */}
      <div className="space-y-2">
        <Label className="font-semibold uppercase">Type</Label>
        <RadioGroup
          value={productTypeId}
          onValueChange={handleProductTypeChange}
          className="max-h-48 space-y-2 overflow-y-auto"
        >
          {productTypes
            .filter((t) =>
              subCategoryId
                ? String(t.subCategoryId) === String(subCategoryId)
                : true
            )
            .map((t) => (
              <div key={t.id} className="flex items-center space-x-2">
                <RadioGroupItem value={t.id} id={t.id} />
                <Label htmlFor={t.id} className="font-normal">{t.name}</Label>
              </div>
            ))}
        </RadioGroup>
      </div>

      <Separator />

      {/* Colors Section */}
      <div className="space-y-4">
        <Label className="font-semibold uppercase">Color</Label>
        <div className="grid grid-cols-3 gap-x-2 gap-y-4">
          {visibleColors.map((colorName) => {
            const hex = getColorHex(colorName);
            return (
              <div
                key={colorName}
                className="flex cursor-pointer flex-col items-center gap-2"
                onClick={() => handleColorChange(colorName)}
              >
                <button
                  type="button"
                  className={cn(
                    "flex size-8 items-center justify-center rounded-full border",
                    colorFilters.includes(colorName)
                      ? "ring-2 ring-black ring-offset-1"
                      : ""
                  )}
                  title={colorName}
                  style={{ backgroundColor: hex }}
                >
                  {colorFilters.includes(colorName) && (
                    <Icons.Check
                      className="size-4"
                      style={{ color: getCheckmarkColor(hex) }}
                    />
                  )}
                </button>
                <span className="text-center text-sm capitalize">{colorName}</span>
              </div>
            );
          })}
        </div>
        {colors.length > 21 && (
          <button
            className="mt-2 text-sm text-gray-600 hover:underline"
            onClick={() => setShowAllColors(!showAllColors)}
          >
            {showAllColors ? "View Less -" : "View More +"}
          </button>
        )}
      </div>

      <Separator />

      {/* Alpha Sizes */}
      <div className="space-y-2">
        <Label className="font-semibold uppercase">Sizes</Label>
        <div className="flex flex-wrap gap-2">
          {alphaSize.map((size) => (
            <button
              key={size}
              type="button"
              onClick={() => handleAlphaSizeChange(size)}
              className={cn(
                "rounded-md border px-3 py-1 text-sm",
                alphaSizeFilters.includes(size)
                  ? "bg-black text-white"
                  : "bg-white text-black hover:bg-gray-100"
              )}
            >
              {size}
            </button>
          ))}
        </div>
      </div>

      <Separator />

      {/* Numeric Sizes */}
      <div className="space-y-2">
        <Label className="font-semibold uppercase">Numeric Sizes</Label>
        <div className="flex flex-wrap gap-2">
          {numSize.map((size) => (
            <button
              key={size}
              type="button"
              onClick={() => handleNumSizeChange(size)}
              className={cn(
                "rounded-md border px-3 py-1 text-sm",
                numSizeFilters.includes(size)
                  ? "bg-black text-white"
                  : "bg-white text-black hover:bg-gray-100"
              )}
            >
              {size}
            </button>
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
              <Label htmlFor={brand.id} className="font-normal">{brand.name}</Label>
            </div>
          ))}
        </div>
        {brandsMeta.length > 5 && (
          <button
            className="mt-2 text-sm text-gray-600 hover:underline"
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

  const handleSort = (value: string) => {
    const [sort, order] = value.split(":");
    setSortBy(sort as "price" | "createdAt");
    setSortOrder(order as "asc" | "desc");
  };

  return (
    <div className="w-52 space-y-1">
      <select
        className="w-full rounded-md border px-3 py-2"
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
