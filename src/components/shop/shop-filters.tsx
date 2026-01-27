"use client";

import { cn, formatPriceTag } from "@/lib/utils";
import {
    BrandMeta,
    CachedCategory,
    CachedProductType,
    CachedSubCategory,
} from "@/lib/validations";
import { useMediaQuery } from "@mantine/hooks";
import convert from "color-convert";
import parse from "color-parse";
// @ts-ignore
import colornames from "colornames";
import {
    parseAsArrayOf,
    parseAsInteger,
    parseAsString,
    parseAsStringLiteral,
    useQueryState,
} from "nuqs";
import { useMemo, useState } from "react";
import { findBestMatch } from "string-similarity";
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

// --- All CSS Named Colors ---
const ALL_COLORS: Record<string, string> = {
    // Standard CSS Colors
    aliceblue: "#f0f8ff",
    antiquewhite: "#faebd7",
    aqua: "#00ffff",
    aquamarine: "#7fffd4",
    azure: "#f0ffff",
    beige: "#f5f5dc",
    black: "#000000",
    blue: "#0000ff",
    brown: "#a52a2a",
    chartreuse: "#7fff00",
    chocolate: "#d2691e",
    coral: "#ff7f50",
    crimson: "#dc143c",
    cyan: "#00ffff",
    darkblue: "#00008b",
    darkcyan: "#008b8b",
    darkgoldenrod: "#b8860b",
    darkgray: "#a9a9a9",
    darkgreen: "#006400",
    darkgrey: "#a9a9a9",
    darkkhaki: "#bdb76b",
    darkmagenta: "#8b008b",
    darkolivegreen: "#556b2f",
    darkorange: "#ff8c00",
    darkorchid: "#9932cc",
    darkred: "#8b0000",
    darksalmon: "#e9967a",
    darkseagreen: "#8fbc8f",
    darkslateblue: "#483d8b",
    darkslategray: "#2f4f4f",
    darkslategrey: "#2f4f4f",
    darkturquoise: "#00ced1",
    darkviolet: "#9400d3",
    deeppink: "#ff1493",
    deepskyblue: "#00bfff",
    dimgray: "#696969",
    dimgrey: "#696969",
    dodgerblue: "#1e90ff",
    firebrick: "#b22222",
    floralwhite: "#fffaf0",
    forestgreen: "#228b22",
    fuchsia: "#ff00ff",
    gainsboro: "#dcdcdc",
    ghostwhite: "#f8f8ff",
    gold: "#ffd700",
    goldenrod: "#daa520",
    gray: "#808080",
    green: "#008000",
    greenyellow: "#adff2f",
    grey: "#808080",
    honeydew: "#f0fff0",
    hotpink: "#ff69b4",
    indianred: "#cd5c5c",
    indigo: "#4b0082",
    ivory: "#fffff0",
    khaki: "#f0e68c",
    lavender: "#e6e6fa",
    lavenderblush: "#fff0f5",
    lawngreen: "#7cfc00",
    lemonchiffon: "#fffacd",
    lightblue: "#add8e6",
    lightcoral: "#f08080",
    lightcyan: "#e0ffff",
    lightgoldenrodyellow: "#fafad2",
    lightgray: "#d3d3d3",
    lightgreen: "#90ee90",
    lightgrey: "#d3d3d3",
    lightpink: "#ffb6c1",
    lightsalmon: "#ffa07a",
    lightseagreen: "#20b2aa",
    lightskyblue: "#87cefa",
    lightslategray: "#778899",
    lightslategrey: "#778899",
    lightsteelblue: "#b0c4de",
    lightyellow: "#ffffe0",
    lime: "#00ff00",
    limegreen: "#32cd32",
    linen: "#faf0e6",
    magenta: "#ff00ff",
    maroon: "#800000",
    mediumaquamarine: "#66cdaa",
    mediumblue: "#0000cd",
    mediumorchid: "#ba55d3",
    mediumpurple: "#9370db",
    mediumseagreen: "#3cb371",
    mediumslateblue: "#7b68ee",
    mediumspringgreen: "#00fa9a",
    mediumturquoise: "#48d1cc",
    mediumvioletred: "#c71585",
    midnightblue: "#191970",
    mintcream: "#f5fffa",
    mistyrose: "#ffe4e1",
    moccasin: "#ffe4b5",
    navajowhite: "#ffdead",
    navy: "#000080",
    oldlace: "#fdf5e6",
    olive: "#808000",
    olivedrab: "#6b8e23",
    orange: "#ffa500",
    orangered: "#ff4500",
    orchid: "#da70d6",
    palegoldenrod: "#eee8aa",
    palegreen: "#98fb98",
    paleturquoise: "#afeeee",
    palevioletred: "#db7093",
    papayawhip: "#ffefd5",
    peachpuff: "#ffdab9",
    peru: "#cd853f",
    pink: "#ffc0cb",
    plum: "#dda0dd",
    powderblue: "#b0e0e6",
    purple: "#800080",
    red: "#ff0000",
    rosybrown: "#bc8f8f",
    royalblue: "#4169e1",
    saddlebrown: "#8b4513",
    salmon: "#fa8072",
    sandybrown: "#f4a460",
    seagreen: "#2e8b57",
    seashell: "#fff5ee",
    sienna: "#a0522d",
    silver: "#c0c0c0",
    skyblue: "#87ceeb",
    slateblue: "#6a5acd",
    slategray: "#708090",
    slategrey: "#708090",
    snow: "#fffafa",
    springgreen: "#00ff7f",
    steelblue: "#4682b4",
    tan: "#d2b48c",
    teal: "#008080",
    thistle: "#d8bfd8",
    tomato: "#ff6347",
    turquoise: "#40e0d0",
    violet: "#ee82ee",
    wheat: "#f5deb3",
    white: "#ffffff",
    whitesmoke: "#f5f5f5",
    yellow: "#ffff00",
    yellowgreen: "#9acd32",

    // Custom Fashion & Textile Colors
    ashbrown: "#9a8b7c",
    babypink: "#f4c2c2",
    bamboogreen: "#8fb13b",
    bamboogreytiedye: "#a0a4a7",
    bamboopinktiedye: "#f1d4d4",
    blushingpeach: "#fcc6b4",
    bottlegreen: "#006a4e",
    braziliansand: "#c3b091",
    brightwhite: "#fdfdfd",
    burgundy: "#800020",
    burntrusset: "#7d3221",
    cannolicream: "#f0ebe1",
    denim: "#1560bd",
    mustard: "#e1ad01",
    navyblue: "#000080",
    olivegrey: "#7a7a61",
    offwhite: "#faf9f6",
    sagegreen: "#9c9f84",
    terracotta: "#e2725b",
    wine: "#722f37",
    charcoal: "#36454f",
    mauve: "#e0b0ff",
    rust: "#b7410e",
    tealblue: "#367588",
    emerald: "#50c878",
    marigold: "#eaa221",
    lavendergrey: "#c4c3d0",
    khakigreen: "#8a865d",
    creampuff: "#fffdd0",
    dustypink: "#dcae96",
    powderblue: "#b0e0e6",
    mint: "#98ff98",
    blush: "#de5d83",
    camel: "#c19a6b",
    tanbrown: "#91672c",
    mochabrown: "#a38068",
    midnight: "#2c3e50",
    forest: "#228b22",
    oatmeal: "#dfd7d2",
    sand: "#c2b280",
    stone: "#a19b91",
    slate: "#708090",
    lilac: "#c8a2c8",
    peachesncream: "#f9e0b1",
};

// --- DYNAMIC COLOR LOGIC ---

// Helper to adjust hex color (lightness/saturation)
function adjustColor(hex: string, modifiers: string[]): string {
    try {
        const [h, s, l] = convert.hex.hsl(hex);
        let newS = s;
        let newL = l;

        if (Array.isArray(modifiers)) {
            for (const mod of modifiers) {
                switch (mod) {
                    case "light":
                    case "pale":
                    case "soft":
                    case "pastel":
                    case "sky":
                        newL = Math.min(newL + 20, 95);
                        break;
                    case "dark":
                    case "deep":
                    case "midnight":
                    case "forest":
                        newL = Math.max(newL - 20, 5);
                        break;
                    case "bright":
                    case "vivid":
                    case "neon":
                        newS = Math.min(newS + 30, 100);
                        break;
                    case "muted":
                    case "dusty":
                    case "ash":
                    case "smoked":
                        newS = Math.max(newS - 30, 10);
                        newL = Math.min(Math.max(newL, 30), 70); // Bring towards middle gray
                        break;
                }
            }
        }

        return `#${convert.hsl.hex([h, newS, newL])}`;
    } catch {
        return hex;
    }
}

// Master list of known color names for fuzzy matching
const KNOWN_COLOR_NAMES = Object.keys(ALL_COLORS);

const getColorHex = (colorName: string): string => {
    if (!colorName) return "#CCCCCC";

    const normalized = colorName.toLowerCase().trim();
    const words = normalized.split(/[\s&_-]+/);

    // 1. Exact Match (cleaned)
    const cleaned = normalized.replace(/[\s&_-]+/g, "");
    if (ALL_COLORS[cleaned]) return ALL_COLORS[cleaned];

    // 2. Colornames Library Lookup
    const libColor = colornames(normalized);
    if (libColor) return libColor;

    // 3. Modifier-based Heuristic
    // We look for a base color and modifiers
    const modifiersList = [
        "light",
        "dark",
        "pale",
        "deep",
        "soft",
        "bright",
        "vivid",
        "muted",
        "dusty",
        "ash",
        "sky",
        "midnight",
        "forest",
        "neon",
        "pastel",
        "smoked",
    ];
    const foundModifiers = words.filter((w) => modifiersList.includes(w));
    const potentialBaseColors = words.filter((w) => !modifiersList.includes(w));

    // Try to find a base color in our list or colornames
    for (const base of potentialBaseColors) {
        const baseHex = ALL_COLORS[base] || colornames(base);
        if (baseHex) {
            return adjustColor(baseHex, foundModifiers);
        }
    }

    // 4. Fuzzy Matching (if it sounds like something we know)
    try {
        const matches = findBestMatch(cleaned, KNOWN_COLOR_NAMES);
        if (matches.bestMatch.rating > 0.6) {
            return ALL_COLORS[matches.bestMatch.target];
        }
    } catch {}

    // 5. Word-by-word fallback
    for (const word of words) {
        if (ALL_COLORS[word]) return ALL_COLORS[word];
        const wordLib = colornames(word);
        if (wordLib) return wordLib;
    }

    // 6. Check color-parse as a last attempt for standard strings
    try {
        const parsed = parse(colorName);
        if (parsed.space) return rgbaToHex(parsed.values);
    } catch {}

    // 7. Stable neutral fallback
    return "#E5E5E5";
};

// --- TYPE DEFINITIONS ---
type ActiveFilter =
    | "category"
    | "brand"
    | "price"
    | "discount"
    | "color"
    | "size";

interface GenericProps {
    className?: string;
    [key: string]: any;
}

interface PageProps extends GenericProps {
    brandsMeta: BrandMeta[];
    categories: CachedCategory[];
    subCategories: CachedSubCategory[];
    productTypes: CachedProductType[];
    colors: { name: string; count: number }[];
    alphaSize?: string[];
    numSize?: string[];
    sizes?: string[];
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
    const [search, setSearch] = useQueryState("search", { defaultValue: "" });
    const [activeFilter, setActiveFilter] = useState<ActiveFilter>("brand");

    // Use useMemo to prevent re-calculating on every render
    const allSizes = useMemo(
        () => [
            ...new Set([
                ...(alphaSize ?? []),
                ...(numSize ?? []),
                ...(sizes ?? []),
            ]),
        ],
        [alphaSize, numSize, sizes]
    );

    return isMobile ? (
        <>
            <Sheet>
                <SheetTrigger asChild>
                    <Button
                        variant="outline"
                        className="flex items-center gap-2"
                    >
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
                                label="Discount"
                                isActive={activeFilter === "discount"}
                                onClick={() => setActiveFilter("discount")}
                            />
                            <FilterNavButton
                                label="Size"
                                isActive={activeFilter === "size"}
                                onClick={() => setActiveFilter("size")}
                            />
                        </nav>
                        <div className="w-2/3 overflow-y-auto p-4">
                            {activeFilter === "brand" && (
                                <BrandFilter brandsMeta={brandsMeta} />
                            )}
                            {activeFilter === "category" && (
                                <CategoryFilter
                                    categories={categories}
                                    subCategories={subCategories}
                                    productTypes={productTypes}
                                    setSearch={setSearch}
                                />
                            )}
                            {activeFilter === "price" && <PriceFilter />}
                            {activeFilter === "discount" && <DiscountFilter />}
                            {activeFilter === "color" && (
                                <ColorFilter colors={colors} />
                            )}
                            {activeFilter === "size" && (
                                <SizeFilter allSizes={allSizes} />
                            )}
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
        <ShopFiltersSection
            className={className}
            brandsMeta={brandsMeta}
            categories={categories}
            subCategories={subCategories}
            productTypes={productTypes}
            colors={colors}
            allSizes={allSizes}
            search={search}
            setSearch={setSearch}
            {...props}
        />
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
                isActive
                    ? "bg-white font-bold text-black"
                    : "text-gray-600 hover:bg-gray-100"
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
    setSearch,
    ...props
}: {
    className?: string;
    brandsMeta: BrandMeta[];
    categories: CachedCategory[];
    subCategories: CachedSubCategory[];
    productTypes: CachedProductType[];
    colors: { name: string; count: number }[];
    allSizes: string[];
    search?: string;
    setSearch?: (value: string | null) => void;
    [key: string]: any;
}) {
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
                setSearch={setSearch}
            />
            <Separator />
            <BrandFilter brandsMeta={brandsMeta} />
            <Separator />
            <PriceFilter />
            <Separator />
            <DiscountFilter />
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
    const [, setPage] = useQueryState("page", parseAsInteger.withDefault(1));
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
                            onCheckedChange={() => {
                                setBrandIds(
                                    brandIds.includes(brand.id)
                                        ? brandIds.filter((b) => b !== brand.id)
                                        : [...brandIds, brand.id]
                                );
                                setPage(1);
                            }}
                        />
                        <Label
                            htmlFor={`brand-${brand.id}`}
                            className="font-normal"
                        >
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
    setSearch,
}: {
    categories: CachedCategory[];
    subCategories: CachedSubCategory[];
    productTypes: CachedProductType[];
    setSearch?: (value: string | null) => void;
}) {
    const [categoryId, setCategoryId] = useQueryState("categoryId", {
        defaultValue: "",
    });
    const [subCategoryId, setSubCategoryId] = useQueryState("subcategoryId", {
        defaultValue: "",
    });
    const [productTypeId, setProductTypeId] = useQueryState("productTypeId", {
        defaultValue: "",
    });
    const [, setPage] = useQueryState("page", parseAsInteger.withDefault(1));

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
                        setPage(1);
                        if (setSearch) setSearch("");
                    }}
                    className="space-y-2"
                >
                    {categories.map((cat) => (
                        <div
                            key={cat.id}
                            className="flex items-center space-x-2"
                        >
                            <RadioGroupItem
                                value={cat.id}
                                id={`cat-${cat.id}`}
                            />
                            <Label
                                htmlFor={`cat-${cat.id}`}
                                className="font-normal"
                            >
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
                        setPage(1);
                        if (setSearch) setSearch("");
                    }}
                    className="max-h-48 space-y-2 overflow-y-auto"
                >
                    {subCategories
                        .filter(
                            (s) =>
                                s.productCount > 0 &&
                                (categoryId
                                    ? String(s.categoryId) ===
                                      String(categoryId)
                                    : true)
                        )
                        .map((sub) => (
                            <div
                                key={sub.id}
                                className="flex items-center space-x-2"
                            >
                                <RadioGroupItem
                                    value={sub.id}
                                    id={`sub-${sub.id}`}
                                />
                                <Label
                                    htmlFor={`sub-${sub.id}`}
                                    className="font-normal"
                                >
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
                            onValueChange={(id) => {
                                setProductTypeId(
                                    id === productTypeId ? "" : id
                                );
                                setPage(1);
                                if (setSearch) setSearch("");
                            }}
                            className="max-h-48 space-y-2 overflow-y-auto"
                        >
                            {productTypes
                                .filter(
                                    (t) =>
                                        (t.productCount ?? 0) > 0 &&
                                        String(t.subCategoryId) ===
                                            String(subCategoryId)
                                )
                                .map((t) => (
                                    <div
                                        key={t.id}
                                        className="flex items-center space-x-2"
                                    >
                                        <RadioGroupItem
                                            value={t.id}
                                            id={`type-${t.id}`}
                                        />
                                        <Label
                                            htmlFor={`type-${t.id}`}
                                            className="font-normal"
                                        >
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
    const [minPrice, setMinPrice] = useQueryState(
        "minPrice",
        parseAsInteger.withDefault(0)
    );
    const [maxPrice, setMaxPrice] = useQueryState(
        "maxPrice",
        parseAsInteger.withDefault(1000000)
    );
    const [, setPage] = useQueryState("page", parseAsInteger.withDefault(1));
    const [priceRange, setPriceRange] = useState<number[]>([
        minPrice,
        maxPrice,
    ]);

    return (
        <div className="space-y-3">
            <Label className="font-semibold uppercase">Price</Label>
            <Slider
                value={priceRange}
                step={100}
                min={0}
                max={1000000}
                onValueChange={setPriceRange}
                onValueCommit={(values) => {
                    setMinPrice(values[0]);
                    setMaxPrice(values[1]);
                    setPage(1);
                }}
            />
            <p className="text-sm tabular-nums">
                {formatPriceTag(priceRange[0])} -{" "}
                {formatPriceTag(priceRange[1])}
                {priceRange[1] === 1000000 && "+"}
            </p>
        </div>
    );
}

const DISCOUNT_OPTIONS = [
    { value: 10, label: "10% and above" },
    { value: 20, label: "20% and above" },
    { value: 30, label: "30% and above" },
    { value: 40, label: "40% and above" },
    { value: 50, label: "50% and above" },
];

function DiscountFilter() {
    const [minDiscount, setMinDiscount] = useQueryState(
        "minDiscount",
        parseAsInteger
    );
    const [, setPage] = useQueryState("page", parseAsInteger.withDefault(1));

    return (
        <div className="space-y-2">
            <Label className="font-semibold uppercase">Discount Range</Label>
            <RadioGroup
                value={minDiscount?.toString() || ""}
                onValueChange={(value) => {
                    const numValue = parseInt(value, 10);
                    setMinDiscount(numValue === minDiscount ? null : numValue);
                    setPage(1);
                }}
                className="space-y-2"
            >
                {DISCOUNT_OPTIONS.map((option) => (
                    <div
                        key={option.value}
                        className="flex items-center space-x-2"
                    >
                        <RadioGroupItem
                            value={option.value.toString()}
                            id={`discount-${option.value}`}
                        />
                        <Label
                            htmlFor={`discount-${option.value}`}
                            className="font-normal"
                        >
                            {option.label}
                        </Label>
                    </div>
                ))}
            </RadioGroup>
        </div>
    );
}

function ColorFilter({
    colors,
}: {
    colors: { name: string; count: number }[];
}) {
    const [colorFilters, setColorFilters] = useQueryState(
        "colors",
        parseAsArrayOf(parseAsString, ",").withDefault([])
    );
    const [, setPage] = useQueryState("page", parseAsInteger.withDefault(1));
    const [showAllColors, setShowAllColors] = useState(false);
    const INITIAL_VISIBLE_COUNT = 10;

    // Main color categories with their hex codes
    const MAIN_CATEGORIES = [
        {
            name: "Black",
            hex: "#000000",
            keywords: ["black", "charcoal", "ebony", "jet", "onyx", "midnight"],
        },
        {
            name: "White",
            hex: "#FFFFFF",
            keywords: [
                "white",
                "ivory",
                "cream",
                "off-white",
                "offwhite",
                "snow",
                "pearl",
                "bright white",
            ],
        },
        {
            name: "Grey",
            hex: "#808080",
            keywords: [
                "grey",
                "gray",
                "silver",
                "ash",
                "slate",
                "stone",
                "smoke",
            ],
        },
        {
            name: "Blue",
            hex: "#0066CC",
            keywords: [
                "blue",
                "azure",
                "cobalt",
                "cyan",
                "denim",
                "indigo",
                "powder",
                "royal",
                "sky",
                "turquoise",
            ],
        },
        {
            name: "Navy",
            hex: "#000080",
            keywords: ["navy", "midnight blue", "dark blue"],
        },
        {
            name: "Green",
            hex: "#228B22",
            keywords: [
                "green",
                "emerald",
                "forest",
                "lime",
                "mint",
                "olive",
                "sage",
                "teal",
                "khaki",
                "bamboo",
                "bottle",
                "pastel green",
            ],
        },
        {
            name: "Red",
            hex: "#FF0000",
            keywords: [
                "red",
                "crimson",
                "scarlet",
                "cherry",
                "ruby",
                "vermilion",
                "tomato",
            ],
        },
        {
            name: "Pink",
            hex: "#FFC0CB",
            keywords: [
                "pink",
                "rose",
                "blush",
                "coral",
                "salmon",
                "fuchsia",
                "magenta",
                "dusty pink",
                "baby pink",
                "hot pink",
            ],
        },
        {
            name: "Purple",
            hex: "#800080",
            keywords: [
                "purple",
                "violet",
                "lavender",
                "lilac",
                "plum",
                "mauve",
                "orchid",
                "grape",
            ],
        },
        {
            name: "Orange",
            hex: "#FFA500",
            keywords: ["orange", "tangerine", "rust", "terracotta", "apricot"],
        },
        {
            name: "Yellow",
            hex: "#FFFF00",
            keywords: [
                "yellow",
                "gold",
                "mustard",
                "lemon",
                "canary",
                "marigold",
                "amber",
            ],
        },
        {
            name: "Brown",
            hex: "#8B4513",
            keywords: [
                "brown",
                "tan",
                "chocolate",
                "coffee",
                "mocha",
                "chestnut",
                "camel",
                "bronze",
                "copper",
                "sienna",
                "umber",
                "walnut",
            ],
        },
        {
            name: "Beige",
            hex: "#F5F5DC",
            keywords: [
                "beige",
                "sand",
                "nude",
                "oatmeal",
                "taupe",
                "fawn",
                "ecru",
            ],
        },
        {
            name: "Maroon",
            hex: "#800000",
            keywords: ["maroon", "burgundy", "wine", "oxblood", "dark red"],
        },
        { name: "Peach", hex: "#FFCBA4", keywords: ["peach"] },
        { name: "Multi", hex: "#E5E5E5", keywords: [] },
    ];

    // Map each raw color to its main category
    const getMainCategory = (colorName: string): string => {
        const normalized = colorName.toLowerCase().trim();

        // Check for multi-color indicators first
        if (
            normalized.includes("&") ||
            normalized.includes(" and ") ||
            (normalized.includes("-") && normalized.split("-").length > 2) ||
            normalized.includes("multi") ||
            normalized.includes("print") ||
            normalized.includes("stripe") ||
            normalized.includes("check") ||
            normalized.includes("pattern")
        ) {
            return "Multi";
        }

        // Find matching category by keywords
        for (const category of MAIN_CATEGORIES) {
            for (const keyword of category.keywords) {
                if (normalized.includes(keyword.toLowerCase())) {
                    return category.name;
                }
            }
        }

        // FUTURE-PROOF: Analyze the hex color to determine category
        // This handles any new/random color names by checking their actual color
        try {
            const hex = getColorHex(colorName);
            if (hex && hex !== "#E5E5E5" && hex !== "#CCCCCC") {
                // Parse hex to RGB
                const r = parseInt(hex.substring(1, 3), 16);
                const g = parseInt(hex.substring(3, 5), 16);
                const b = parseInt(hex.substring(5, 7), 16);

                // Calculate hue, saturation, lightness
                const max = Math.max(r, g, b) / 255;
                const min = Math.min(r, g, b) / 255;
                const l = (max + min) / 2;
                const d = max - min;
                const s = d === 0 ? 0 : d / (1 - Math.abs(2 * l - 1));

                let h = 0;
                if (d !== 0) {
                    if (max === r / 255) h = ((g / 255 - b / 255) / d) % 6;
                    else if (max === g / 255) h = (b / 255 - r / 255) / d + 2;
                    else h = (r / 255 - g / 255) / d + 4;
                    h = Math.round(h * 60);
                    if (h < 0) h += 360;
                }

                // Determine category based on HSL values
                if (l < 0.15) return "Black";
                if (l > 0.9 && s < 0.1) return "White";
                if (s < 0.1) return "Grey";

                // Determine by hue
                if (h >= 0 && h < 15) return "Red";
                if (h >= 15 && h < 45) return "Orange";
                if (h >= 45 && h < 70) return "Yellow";
                if (h >= 70 && h < 170) return "Green";
                if (h >= 170 && h < 200) return l < 0.3 ? "Navy" : "Blue";
                if (h >= 200 && h < 260) return l < 0.25 ? "Navy" : "Blue";
                if (h >= 260 && h < 290) return "Purple";
                if (h >= 290 && h < 340) return "Pink";
                if (h >= 340) return l < 0.35 ? "Maroon" : "Red";

                // Brown/Beige detection (low saturation oranges/reds)
                if (h >= 15 && h < 45 && s < 0.5)
                    return l > 0.6 ? "Beige" : "Brown";
            }
        } catch {
            // If hex detection fails, continue to fallback
        }

        return "Multi";
    };

    // Group colors by main category
    const groupedColors = useMemo(() => {
        const groups: Record<string, { rawColors: string[]; count: number }> =
            {};

        for (const color of colors) {
            const category = getMainCategory(color.name);
            if (!groups[category]) {
                groups[category] = { rawColors: [], count: 0 };
            }
            groups[category].rawColors.push(color.name);
            groups[category].count += color.count;
        }

        // Convert to array and sort by count descending
        return MAIN_CATEGORIES.filter((cat) => groups[cat.name])
            .map((cat) => ({
                name: cat.name,
                hex: cat.hex,
                rawColors: groups[cat.name]?.rawColors || [],
                count: groups[cat.name]?.count || 0,
            }))
            .sort((a, b) => b.count - a.count);
    }, [colors]);

    const visibleColors = showAllColors
        ? groupedColors
        : groupedColors.slice(0, INITIAL_VISIBLE_COUNT);
    const remainingCount = groupedColors.length - INITIAL_VISIBLE_COUNT;

    // Check if a main category is selected (any of its raw colors are in the filter)
    const isCategorySelected = (rawColors: string[]) => {
        return rawColors.some((rc) => colorFilters.includes(rc));
    };

    // Toggle all raw colors for a category
    const toggleCategory = (rawColors: string[]) => {
        const isSelected = isCategorySelected(rawColors);
        if (isSelected) {
            // Remove all raw colors of this category
            setColorFilters(colorFilters.filter((c) => !rawColors.includes(c)));
        } else {
            // Add all raw colors of this category
            const newFilters = [
                ...colorFilters,
                ...rawColors.filter((rc) => !colorFilters.includes(rc)),
            ];
            setColorFilters(newFilters);
        }
        setPage(1);
    };

    return (
        <div className="space-y-3">
            <Label className="font-semibold uppercase">Color</Label>
            <div className="space-y-2">
                {visibleColors.map((category) => {
                    const isSelected = isCategorySelected(category.rawColors);
                    return (
                        <div
                            key={category.name}
                            className="flex cursor-pointer items-center gap-3"
                            onClick={() => toggleCategory(category.rawColors)}
                        >
                            <Checkbox
                                checked={isSelected}
                                onCheckedChange={() =>
                                    toggleCategory(category.rawColors)
                                }
                                className="size-4 rounded border-gray-300"
                            />
                            <span
                                className={cn(
                                    "size-5 shrink-0 rounded-full border border-gray-200",
                                    category.name === "Multi" &&
                                        "bg-gradient-to-r from-red-400 via-yellow-400 to-blue-400"
                                )}
                                style={
                                    category.name !== "Multi"
                                        ? { backgroundColor: category.hex }
                                        : undefined
                                }
                            />
                            <span className="text-sm capitalize text-gray-700">
                                {category.name}
                            </span>
                            <span className="text-sm text-gray-400">
                                ({category.count.toLocaleString()})
                            </span>
                        </div>
                    );
                })}
            </div>
            {groupedColors.length > INITIAL_VISIBLE_COUNT && (
                <button
                    className="text-sm font-medium text-accent hover:underline"
                    onClick={() => setShowAllColors(!showAllColors)}
                >
                    {showAllColors ? "Show less" : `+${remainingCount} more`}
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

    const standardSizes = new Set([
        "XS",
        "S",
        "M",
        "L",
        "XL",
        "XXL",
        "XXXL",
        "2XL",
        "3XL",
        "Free Size",
    ]);
    // Updated regex: looks for numbers followed by age units (e.g., "6m", "2y") or standalone words like "year"/"month".
    // This prevents the single letter "M" (Medium) from being matched by a simple "m" pattern.
    const ageRegex = /\b\d+\s*(year|month|y|m)s?\b|year|month/i;

    sizes.forEach((size) => {
        if (standardSizes.has(size)) {
            categories.standard.push(size);
        } else if (ageRegex.test(size)) {
            categories.age.push(size);
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
    const [, setPage] = useQueryState("page", parseAsInteger.withDefault(1));
    const [categoryId] = useQueryState(
        "categoryId",
        parseAsString.withDefault("")
    );

    // Categorize sizes
    const categorized = useMemo(() => categorizeSizes(allSizes), [allSizes]);

    const handleSizeClick = (size: string) => {
        setSizeFilters(
            sizeFilters.includes(size)
                ? sizeFilters.filter((s) => s !== size)
                : [...sizeFilters, size]
        );
        setPage(1);
    };

    // Helper to render a group of size buttons
    const renderSizeGroup = (title: string, sizes: string[]) => {
        if (sizes.length === 0) return null;
        return (
            <div className="space-y-2">
                <Label className="font-semibold uppercase text-gray-600">
                    {title}
                </Label>
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
            {categoryId && renderSizeGroup("Age-Based", categorized.age)}
            {categoryId && renderSizeGroup("Other Sizes", categorized.other)}
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
                    <SheetTitle className="text-start text-base font-bold uppercase">
                        Sort By
                    </SheetTitle>
                </SheetHeader>
                <div className="p-4">
                    <RadioGroup value={currentValue} onValueChange={handleSort}>
                        {sortByWithOrderTypes.map((option) => (
                            <SheetClose key={option.value} asChild>
                                <Label
                                    htmlFor={option.value}
                                    className={cn(
                                        "flex items-center space-x-3 py-3 text-base",
                                        currentValue === option.value
                                            ? "font-bold text-pink-600"
                                            : "text-gray-700"
                                    )}
                                >
                                    <RadioGroupItem
                                        value={option.value}
                                        id={option.value}
                                        className="mr-2"
                                    />
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
