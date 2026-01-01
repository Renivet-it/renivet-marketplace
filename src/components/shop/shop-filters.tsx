"use client";

import { useState, useMemo } from "react";
import { useMediaQuery } from "@mantine/hooks";
import parse from "color-parse";
import {
  useQueryState,
  parseAsArrayOf,
  parseAsInteger,
  parseAsString,
  parseAsStringLiteral,
} from "nuqs";

import { cn, formatPriceTag } from "@/lib/utils";
import {
  BrandMeta,
  CachedCategory,
  CachedProductType,
  CachedSubCategory,
} from "@/lib/validations";

import { Icons } from "../icons";
import { Button } from "../ui/button-general";
import { Checkbox } from "../ui/checkbox";
import { Label } from "../ui/label";
import { RadioGroup, RadioGroupItem } from "../ui/radio-group";
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

// --- HELPER FUNCTIONS (Unchanged) ---

// RGBA to HEX
function rgbaToHex(rgba: number[]): string {
  const toHex = (c: number) => c.toString(16).padStart(2, "0");
  return `#${toHex(rgba[0])}${toHex(rgba[1])}${toHex(rgba[2])}`;
}

// Unique string hash to color
function stringToColor(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
    hash = hash & hash;
  }
  const r = (hash >> 16) & 0xff;
  const g = (hash >> 8) & 0xff;
  const b = hash & 0xff;
  return `#${r.toString(16).padStart(2, "0")}${g
    .toString(16)
    .padStart(2, "0")}${b.toString(16).padStart(2, "0")}`;
}

// --- All CSS Named Colors ---
const ALL_COLORS: Record<string, string> = {
    aliceblue:"#f0f8ff", antiquewhite:"#faebd7", aqua:"#00ffff", aquamarine:"#7fffd4", azure:"#f0ffff", beige:"#f5f5dc", black:"#000000", blue:"#0000ff", brown:"#a52a2a", chartreuse:"#7fff00", chocolate:"#d2691e", coral:"#ff7f50", crimson:"#dc143c", cyan:"#00ffff", darkblue:"#00008b", darkcyan:"#008b8b", darkgoldenrod:"#b8860b", darkgray:"#a9a9a9", darkgreen:"#006400", darkgrey:"#a9a9a9", darkkhaki:"#bdb76b", darkmagenta:"#8b008b", darkolivegreen:"#556b2f", darkorange:"#ff8c00", darkorchid:"#9932cc", darkred:"#8b0000", darksalmon:"#e9967a", darkseagreen:"#8fbc8f", darkslateblue:"#483d8b", darkslategray:"#2f4f4f", darkslategrey:"#2f4f4f", darkturquoise:"#00ced1", darkviolet:"#9400d3", deeppink:"#ff1493", deepskyblue:"#00bfff", dimgray:"#696969", dimgrey:"#696969", dodgerblue:"#1e90ff", firebrick:"#b22222", floralwhite:"#fffaf0", forestgreen:"#228b22", fuchsia:"#ff00ff", gainsboro:"#dcdcdc", ghostwhite:"#f8f8ff", gold:"#ffd700", goldenrod:"#daa520", gray:"#808080", green:"#008000", greenyellow:"#adff2f", grey:"#808080", honeydew:"#f0fff0", hotpink:"#ff69b4", indianred:"#cd5c5c", indigo:"#4b0082", ivory:"#fffff0", khaki:"#f0e68c", lavender:"#e6e6fa", lavenderblush:"#fff0f5", lawngreen:"#7cfc00", lemonchiffon:"#fffacd", lightblue:"#add8e6", lightcoral:"#f08080", lightcyan:"#e0ffff", lightgoldenrodyellow:"#fafad2", lightgray:"#d3d3d3", lightgreen:"#90ee90", lightgrey:"#d3d3d3", lightpink:"#ffb6c1", lightsalmon:"#ffa07a", lightseagreen:"#20b2aa", lightskyblue:"#87cefa", lightslategray:"#778899", lightslategrey:"#778899", lightsteelblue:"#b0c4de", lightyellow:"#ffffe0", lime:"#00ff00", limegreen:"#32cd32", linen:"#faf0e6", magenta:"#ff00ff", maroon:"#800000", mediumaquamarine:"#66cdaa", mediumblue:"#0000cd", mediumorchid:"#ba55d3", mediumpurple:"#9370db", mediumseagreen:"#3cb371", mediumslateblue:"#7b68ee", mediumspringgreen:"#00fa9a", mediumturquoise:"#48d1cc", mediumvioletred:"#c71585", midnightblue:"#191970", mintcream:"#f5fffa", mistyrose:"#ffe4e1", moccasin:"#ffe4b5", navajowhite:"#ffdead", navy:"#000080", oldlace:"#fdf5e6", olive:"#808000", olivedrab:"#6b8e23", orange:"#ffa500", orangered:"#ff4500", orchid:"#da70d6", palegoldenrod:"#eee8aa", palegreen:"#98fb98", paleturquoise:"#afeeee", palevioletred:"#db7093", papayawhip:"#ffefd5", peachpuff:"#ffdab9", peru:"#cd853f", pink:"#ffc0cb", plum:"#dda0dd", powderblue:"#b0e0e6", purple:"#800080", red:"#ff0000", rosybrown:"#bc8f8f", royalblue:"#4169e1", saddlebrown:"#8b4513", salmon:"#fa8072", sandybrown:"#f4a460", seagreen:"#2e8b57", seashell:"#fff5ee", sienna:"#a0522d", silver:"#c0c0c0", skyblue:"#87ceeb", slateblue:"#6a5acd", slategray:"#708090", slategrey:"#708090", snow:"#fffafa", springgreen:"#00ff7f", steelblue:"#4682b4", tan:"#d2b48c", teal:"#008080", thistle:"#d8bfd8", tomato:"#ff6347", turquoise:"#40e0d0", violet:"#ee82ee", wheat:"#f5deb3", white:"#ffffff", whitesmoke:"#f5f5f5", yellow:"#ffff00", yellowgreen:"#9acd32"
};

// Find closest color by RGB distance
function getClosestColor(hex: string): string {
  const r = parseInt(hex.substring(1, 3), 16);
  const g = parseInt(hex.substring(3, 5), 16);
  const b = parseInt(hex.substring(5, 7), 16);

  let closest = "#000000";
  let minDist = Infinity;

  for (const colorHex of Object.values(ALL_COLORS)) {
    const cr = parseInt(colorHex.substring(1, 3), 16);
    const cg = parseInt(colorHex.substring(3, 5), 16);
    const cb = parseInt(colorHex.substring(5, 7), 16);

    const dist = Math.sqrt((r - cr) ** 2 + (g - cg) ** 2 + (b - cb) ** 2);
    if (dist < minDist) {
      minDist = dist;
      closest = colorHex;
    }
  }
  return closest;
}

// Updated getColorHex
const getColorHex = (colorName: string): string => {
  if (!colorName) return "#CCCCCC";

  const cleaned = colorName.toLowerCase().replace(/[\s&_-]+/g, "");
  if (ALL_COLORS[cleaned]) return ALL_COLORS[cleaned];

  try {
    const parsed = parse(colorName);
    if (parsed.space) return getClosestColor(rgbaToHex(parsed.values));
  } catch {}

  return stringToColor(colorName);
};

// Checkmark contrast color
const getCheckmarkColor = (hex: string): string => {
  if (!hex || hex.length !== 7) return "black";
  const r = parseInt(hex.substring(1, 3), 16);
  const g = parseInt(hex.substring(3, 5), 16);
  const b = parseInt(hex.substring(5, 7), 16);
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance < 0.5 ? "white" : "black";
};

// --- TYPE DEFINITIONS ---
type ActiveFilter = "category" | "brand" | "price" | "color" | "size";

interface GenericProps {
  className?: string;
  [key: string]: any;
}

interface PageProps extends GenericProps {
  brandsMeta: BrandMeta[];
  categories: CachedCategory[];
  subCategories: CachedSubCategory[];
  productTypes: CachedProductType[];
  colors: string[];
  alphaSize: string[];
  numSize: string[];
  sizes: string[];
}

// --- MAIN COMPONENT ---
export function ShopFilters({
  className,
  brandsMeta,
  categories,
  subCategories,
  productTypes,
  colors,
  alphaSize,
  numSize,
  sizes,
  ...props
}: PageProps) {
  const isMobile = useMediaQuery("(max-width: 768px)");
  const [activeFilter, setActiveFilter] = useState<ActiveFilter>("brand");

  // Use useMemo to prevent re-calculating on every render
  const allSizes = useMemo(
    () => [...new Set([...alphaSize, ...numSize, ...sizes])],
    [alphaSize, numSize, sizes]
  );

  const filterProps = {
    className,
    brandsMeta,
    categories,
    subCategories,
    productTypes,
    colors,
    allSizes,
    ...props,
  };

  return isMobile ? (
    <>
      <Sheet>
        <SheetTrigger asChild>
          <Button variant="outline" className="flex items-center gap-2">
            <Icons.Filter className="size-4" />
            Filters
          </Button>
        </SheetTrigger>
        <SheetContent
          side="bottom"
          className="flex h-screen flex-col p-0"
          style={{ scrollbarWidth: "none" }}
        >
          <SheetHeader className="border-b p-4">
            <SheetTitle className="text-start">Filters</SheetTitle>
          </SheetHeader>
          <div className="flex flex-1 overflow-hidden">
            <nav className="w-1/3 overflow-y-auto border-r bg-gray-50">
              <FilterNavButton
                label="Brand"
                isActive={activeFilter === "brand"}
                onClick={() => setActiveFilter("brand")}
              />
              <FilterNavButton
                label="Category"
                isActive={activeFilter === "category"}
                onClick={() => setActiveFilter("category")}
              />
              <FilterNavButton
                label="Price"
                isActive={activeFilter === "price"}
                onClick={() => setActiveFilter("price")}
              />
              <FilterNavButton
                label="Color"
                isActive={activeFilter === "color"}
                onClick={() => setActiveFilter("color")}
              />
              <FilterNavButton
                label="Size"
                isActive={activeFilter === "size"}
                onClick={() => setActiveFilter("size")}
              />
            </nav>
            <div className="w-2/3 overflow-y-auto p-4">
              {activeFilter === "brand" && <BrandFilter {...filterProps} />}
              {activeFilter === "category" && <CategoryFilter {...filterProps} />}
              {activeFilter === "price" && <PriceFilter {...filterProps} />}
              {activeFilter === "color" && <ColorFilter {...filterProps} />}
              {activeFilter === "size" && <SizeFilter {...filterProps} />}
            </div>
          </div>
          <SheetFooter className="sticky bottom-0 grid grid-cols-2 gap-4 border-t bg-background p-4">
            <Button variant="outline" onClick={handleResetAll}>
              Clear All
            </Button>
            <SheetClose asChild>
              <Button>Apply</Button>
            </SheetClose>
          </SheetFooter>
        </SheetContent>
      </Sheet>
    </>
  ) : (
    <ShopFiltersSection {...filterProps} />
  );
}

// --- HELPER COMPONENTS & FUNCTIONS ---

function FilterNavButton({
  label,
  isActive,
  onClick,
}: {
  label: string;
  isActive: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "w-full p-4 text-left text-sm font-medium",
        isActive ? "bg-white font-bold text-black" : "text-gray-600 hover:bg-gray-100"
      )}
    >
      {label}
    </button>
  );
}

const handleResetAll = () => {
  // Simple reset by clearing URL params and reloading the page
  window.location.href = window.location.pathname;
};

// --- DESKTOP FILTER SECTION ---
function ShopFiltersSection({
  className,
  brandsMeta,
  categories,
  subCategories,
  productTypes,
  colors,
  allSizes,
  ...props
}: PageProps & { allSizes: string[] }) {
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
      <CategoryFilter
        categories={categories}
        subCategories={subCategories}
        productTypes={productTypes}
      />
      <Separator />
      <BrandFilter brandsMeta={brandsMeta} />
      <Separator />
      <PriceFilter />
      <Separator />
      <ColorFilter colors={colors} />
      <Separator />
      <SizeFilter allSizes={allSizes} />
    </div>
  );
}

// --- INDIVIDUAL FILTER COMPONENTS ---

function BrandFilter({ brandsMeta }: { brandsMeta: BrandMeta[] }) {
  const [brandIds, setBrandIds] = useQueryState(
    "brandIds",
    parseAsArrayOf(parseAsString, ",").withDefault([])
  );
  const [showAllBrands, setShowAllBrands] = useState(false);
  const visibleBrands = showAllBrands ? brandsMeta : brandsMeta.slice(0, 10);

  return (
    <div className="space-y-2">
      <Label className="font-semibold uppercase">Brands</Label>
      <div className="space-y-2">
        {visibleBrands.map((brand) => (
          <div key={brand.id} className="flex items-center space-x-2">
            <Checkbox
              id={`brand-${brand.id}`}
              checked={brandIds.includes(brand.id)}
              onCheckedChange={() =>
                setBrandIds(
                  brandIds.includes(brand.id)
                    ? brandIds.filter((b) => b !== brand.id)
                    : [...brandIds, brand.id]
                )
              }
            />
            <Label htmlFor={`brand-${brand.id}`} className="font-normal">
              {brand.name}
            </Label>
          </div>
        ))}
      </div>
      {brandsMeta.length > 10 && (
        <button
          className="mt-2 text-sm text-blue-600 hover:underline"
          onClick={() => setShowAllBrands(!showAllBrands)}
        >
          {showAllBrands ? "View Less -" : `View More +`}
        </button>
      )}
    </div>
  );
}

function CategoryFilter({
  categories,
  subCategories,
  productTypes,
}: {
  categories: CachedCategory[];
  subCategories: CachedSubCategory[];
  productTypes: CachedProductType[];
}) {
  const [categoryId, setCategoryId] = useQueryState("categoryId", { defaultValue: "" });
  const [subCategoryId, setSubCategoryId] = useQueryState("subcategoryId", { defaultValue: "" });
  const [productTypeId, setProductTypeId] = useQueryState("productTypeId", { defaultValue: "" });

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label className="font-semibold uppercase">Category</Label>
        <RadioGroup
          value={categoryId}
          onValueChange={(id) => {
            setCategoryId(id === categoryId ? "" : id);
            setSubCategoryId("");
            setProductTypeId("");
          }}
          className="space-y-2"
        >
          {categories.map((cat) => (
            <div key={cat.id} className="flex items-center space-x-2">
              <RadioGroupItem value={cat.id} id={`cat-${cat.id}`} />
              <Label htmlFor={`cat-${cat.id}`} className="font-normal">
                {cat.name}
              </Label>
            </div>
          ))}
        </RadioGroup>
      </div>
      <Separator />
      <div className="space-y-2">
        <Label className="font-semibold uppercase">Subcategory</Label>
        <RadioGroup
          value={subCategoryId}
          onValueChange={(id) => {
            setSubCategoryId(id === subCategoryId ? "" : id);
            setProductTypeId("");
          }}
          className="max-h-48 space-y-2 overflow-y-auto"
        >
          {subCategories
            .filter((s) => s.productCount > 0 && (categoryId ? String(s.categoryId) === String(categoryId) : true))
            .map((sub) => (
              <div key={sub.id} className="flex items-center space-x-2">
                <RadioGroupItem value={sub.id} id={`sub-${sub.id}`} />
                <Label htmlFor={`sub-${sub.id}`} className="font-normal">
                  {sub.name}
                </Label>
              </div>
            ))}
        </RadioGroup>
      </div>
      <Separator />
{subCategoryId && (
  <>
    <Separator />
    <div className="space-y-2">
      <Label className="font-semibold uppercase">Type</Label>
      <RadioGroup
        value={productTypeId}
        onValueChange={(id) =>
          setProductTypeId(id === productTypeId ? "" : id)
        }
        className="max-h-48 space-y-2 overflow-y-auto"
      >
        {productTypes
          .filter(
            (t) => t.productCount > 0 && String(t.subCategoryId) === String(subCategoryId)
          )
          .map((t) => (
            <div key={t.id} className="flex items-center space-x-2">
              <RadioGroupItem value={t.id} id={`type-${t.id}`} />
              <Label htmlFor={`type-${t.id}`} className="font-normal">
                {t.name}
              </Label>
            </div>
          ))}
      </RadioGroup>
    </div>
  </>
)}

    </div>
  );
}

function PriceFilter() {
  const [minPrice, setMinPrice] = useQueryState("minPrice", parseAsInteger.withDefault(0));
  const [maxPrice, setMaxPrice] = useQueryState("maxPrice", parseAsInteger.withDefault(10000));
  const [priceRange, setPriceRange] = useState<number[]>([minPrice, maxPrice]);

  return (
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
  );
}

function ColorFilter({ colors }: { colors: string[] }) {
  const [colorFilters, setColorFilters] = useQueryState(
    "colors",
    parseAsArrayOf(parseAsString, ",").withDefault([])
  );
  const [showAllColors, setShowAllColors] = useState(false);
  const visibleColors = showAllColors ? colors : colors.slice(0, 21);

  return (
    <div className="space-y-4">
      <Label className="font-semibold uppercase">Color</Label>
      <div className="grid grid-cols-3 gap-x-2 gap-y-4 sm:grid-cols-4 md:grid-cols-3">
        {visibleColors.map((colorName) => {
          const hex = getColorHex(colorName);
          return (
            <div
              key={colorName}
              className="flex cursor-pointer flex-col items-center gap-2"
              onClick={() =>
                setColorFilters(
                  colorFilters.includes(colorName)
                    ? colorFilters.filter((c) => c !== colorName)
                    : [...colorFilters, colorName]
                )
              }
            >
              <button
                type="button"
                className={cn(
                  "flex size-8 items-center justify-center rounded-full border",
                  colorFilters.includes(colorName) ? "ring-2 ring-black ring-offset-1" : ""
                )}
                title={colorName}
                style={{ backgroundColor: hex }}
              >
                {colorFilters.includes(colorName) && (
                  <Icons.Check className="size-4" style={{ color: getCheckmarkColor(hex) }} />
                )}
              </button>
              <span className="text-center text-sm capitalize">{colorName}</span>
            </div>
          );
        })}
      </div>
      {colors.length > 21 && (
        <button
          className="mt-2 text-sm text-blue-600 hover:underline"
          onClick={() => setShowAllColors(!showAllColors)}
        >
          {showAllColors ? "View Less -" : "View More +"}
        </button>
      )}
    </div>
  );
}

// +++ NEW: Helper function to categorize sizes +++
const categorizeSizes = (sizes: string[]) => {
  const categories = {
    age: [] as string[],
    standard: [] as string[],
    other: [] as string[],
  };

  const standardSizes = new Set(["XS", "S", "M", "L", "XL", "XXL", "XXXL", "2XL", "3XL", "Free Size"]);
  const ageRegex = /year|month|y|m/i;

  sizes.forEach((size) => {
    if (ageRegex.test(size)) {
      categories.age.push(size);
    } else if (standardSizes.has(size)) {
      categories.standard.push(size);
    } else {
      categories.other.push(size);
    }
  });

  return categories;
};

// +++ UPDATED: SizeFilter component +++
function SizeFilter({ allSizes }: { allSizes: string[] }) {
  const [sizeFilters, setSizeFilters] = useQueryState(
    "sizes",
    parseAsArrayOf(parseAsString, ",").withDefault([])
  );

  // Categorize sizes
  const categorized = useMemo(() => categorizeSizes(allSizes), [allSizes]);

  const handleSizeClick = (size: string) => {
    setSizeFilters(
      sizeFilters.includes(size)
        ? sizeFilters.filter((s) => s !== size)
        : [...sizeFilters, size]
    );
  };

  // Helper to render a group of size buttons
  const renderSizeGroup = (title: string, sizes: string[]) => {
    if (sizes.length === 0) return null;
    return (
      <div className="space-y-2">
        <Label className="font-semibold uppercase text-gray-600">{title}</Label>
        <div className="flex flex-wrap gap-2">
          {sizes.map((size) => (
            <button
              key={size}
              type="button"
              onClick={() => handleSizeClick(size)}
              className={cn(
                "rounded-md border px-3 py-1 text-sm",
                sizeFilters.includes(size)
                  ? "border-black bg-black text-white"
                  : "bg-white text-black hover:bg-gray-100"
              )}
            >
              {size}
            </button>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-4">
      {renderSizeGroup("Standard Sizes", categorized.standard)}
      {renderSizeGroup("Age-Based", categorized.age)}
      {renderSizeGroup("Other Sizes", categorized.other)}
    </div>
  );
}

// --- +++ UPDATED: ShopSortBy Component +++ ---

// The original sorting options as requested
const sortByWithOrderTypes = [
  { label: "Price: High to Low", value: "price:desc" },
  { label: "Price: Low to High", value: "price:asc" },
  { label: "Newest First", value: "createdAt:desc" },
  { label: "Oldest First", value: "createdAt:asc" },
];

export function ShopSortBy() {
  const isMobile = useMediaQuery("(max-width: 768px)");
  const [sortBy, setSortBy] = useQueryState(
    "sortBy",
    parseAsStringLiteral(["price", "createdAt"] as const).withDefault("createdAt")
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

  const currentValue = `${sortBy}:${sortOrder}`;

  // --- Desktop View (Dropdown) ---
  if (!isMobile) {
    return (
      <div className="w-52">
        <select
          className="w-full rounded-md border bg-background px-3 py-2 text-sm"
          value={currentValue}
          onChange={(e) => handleSort(e.target.value)}
        >
          {sortByWithOrderTypes.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>
    );
  }

  // --- Mobile View (Bottom Sheet) ---
  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="outline" className="flex items-center gap-2">
          <Icons.ArrowUpDown className="size-4" />
          Sort
        </Button>
      </SheetTrigger>
      <SheetContent side="bottom" className="p-0">
        <SheetHeader className="border-b p-4">
          <SheetTitle className="text-start text-base font-bold uppercase">Sort By</SheetTitle>
        </SheetHeader>
        <div className="p-4">
          <RadioGroup value={currentValue} onValueChange={handleSort}>
            {sortByWithOrderTypes.map((option) => (
              <SheetClose key={option.value} asChild>
                <Label
                  htmlFor={option.value}
                  className={cn(
                    "flex items-center space-x-3 py-3 text-base",
                    currentValue === option.value ? "font-bold text-pink-600" : "text-gray-700"
                  )}
                >
                  <RadioGroupItem value={option.value} id={option.value} className="mr-2" />
                  <span>{option.label}</span>
                </Label>
              </SheetClose>
            ))}
          </RadioGroup>
        </div>
      </SheetContent>
    </Sheet>
  );
}
