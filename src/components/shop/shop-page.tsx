"use client";

import { trpc } from "@/lib/trpc/client";
import { cn, formatPriceTag } from "@/lib/utils";
import { BrandMeta, ProductWithBrand } from "@/lib/validations";
import {
    parseAsArrayOf,
    parseAsInteger,
    parseAsString,
    useQueryState,
} from "nuqs";
import { useMemo, useState } from "react";
import { ProductCard } from "../globals/cards";
import { Pagination } from "../ui/data-table-general";
import { Label } from "../ui/label";
import { MultipleSelectorGeneral } from "../ui/multi-select-general";
import { SearchInput } from "../ui/search-input";
import { Separator } from "../ui/separator";
import { Slider } from "../ui/slider";

const dummyBrands = [
    {
        label: "Highlander",
        value: "Highlander",
    },
    {
        label: "Nike",
        value: "Nike",
    },
    {
        label: "Adidas",
        value: "Adidas",
    },
    {
        label: "Puma",
        value: "Puma",
    },
    {
        label: "Reebok",
        value: "Reebok",
    },
    {
        label: "Under Armour",
        value: "Under Armour",
    },
    {
        label: "New Balance",
        value: "New Balance",
    },
    {
        label: "Asics",
        value: "Asics",
    },
    {
        label: "Converse",
        value: "Converse",
    },
    {
        label: "Vans",
        value: "Vans",
    },
    {
        label: "Fila",
        value: "Fila",
    },
    {
        label: "Skechers",
        value: "Skechers",
    },
    {
        label: "Brooks",
        value: "Brooks",
    },
    {
        label: "Saucony",
        value: "Saucony",
    },
];

const dummyColors = [
    {
        label: "Red",
        value: "Red",
        hex: "#FF0000",
    },
    {
        label: "Blue",
        value: "Blue",
        hex: "#0000FF",
    },
    {
        label: "Green",
        value: "Green",
        hex: "#008000",
    },
    {
        label: "Yellow",
        value: "Yellow",
        hex: "#FFFF00",
    },
    {
        label: "Purple",
        value: "Purple",
        hex: "#800080",
    },
    {
        label: "Orange",
        value: "Orange",
        hex: "#FFA500",
    },
    {
        label: "Pink",
        value: "Pink",
        hex: "#FFC0CB",
    },
    {
        label: "Brown",
        value: "Brown",
        hex: "#A52A2A",
    },
    {
        label: "Gray",
        value: "Gray",
        hex: "#808080",
    },
    {
        label: "Black",
        value: "Black",
        hex: "#000000",
    },
    {
        label: "White",
        value: "White",
        hex: "#FFFFFF",
    },
];

interface PageProps extends GenericProps {
    initialData: {
        data: ProductWithBrand[];
        count: number;
    };
    brandsMeta: {
        data: BrandMeta[];
        count: number;
    };
}

export function ShopPage({
    className,
    initialData,
    brandsMeta,
    ...props
}: PageProps) {
    const [page] = useQueryState("page", parseAsInteger.withDefault(1));
    const [limit] = useQueryState("limit", parseAsInteger.withDefault(30));
    const [searchInput, setSearchInput] = useQueryState("search", {
        defaultValue: "",
    });
    const [brandIds] = useQueryState(
        "brandIds",
        parseAsArrayOf(parseAsString, ",").withDefault([])
    );

    const [search, setSearch] = useState("");
    const [priceRange, setPriceRange] = useState([100, 10000]);

    const {
        data: { data: products, count },
    } = trpc.brands.products.getProducts.useQuery(
        {
            page,
            limit,
            isPublished: true,
            isAvailable: true,
            brandIds,
            search,
        },
        { initialData }
    );

    const pages = useMemo(() => Math.ceil(count / limit) ?? 1, [count, limit]);

    return (
        <div
            className={cn("flex flex-col gap-5 md:flex-row", className)}
            {...props}
        >
            <div className="w-full basis-1/6 space-y-4">
                <h4 className="text-lg">Filters</h4>

                <Separator />

                <div className="space-y-1">
                    <Label className="font-semibold uppercase">Brand</Label>

                    <MultipleSelectorGeneral
                        commandProps={{
                            label: "Brands",
                        }}
                        defaultOptions={[
                            ...brandsMeta.data.map((brand) => ({
                                label: brand.name,
                                value: brand.name,
                            })),
                            ...dummyBrands,
                        ].sort((a, b) => a.label.localeCompare(b.label))}
                        placeholder="Select brands"
                        emptyIndicator={
                            <p className="text-center text-sm">
                                No results found
                            </p>
                        }
                    />
                </div>

                <Separator />

                <div className="space-y-3">
                    <div className="space-y-2">
                        <Label className="font-semibold uppercase">Price</Label>

                        <Slider
                            value={priceRange}
                            step={100}
                            onValueChange={setPriceRange}
                            min={100}
                            max={10000}
                            aria-label="Price range slider"
                        />
                    </div>

                    <div className="flex justify-between">
                        <Label className="tabular-nums">
                            {formatPriceTag(priceRange[0])} -{" "}
                            {formatPriceTag(priceRange[1])}
                            {priceRange[1] === 10000 && "+"}
                        </Label>
                    </div>
                </div>

                <Separator />

                <div className="space-y-1">
                    <Label className="font-semibold uppercase">Color</Label>

                    <MultipleSelectorGeneral
                        commandProps={{
                            label: "Colors",
                        }}
                        defaultOptions={dummyColors}
                        placeholder="Select colors"
                        emptyIndicator={
                            <p className="text-center text-sm">
                                No results found
                            </p>
                        }
                    />
                </div>
            </div>

            <div className="hidden w-px bg-border md:inline-block" />

            <div className="w-full basis-5/6 space-y-5">
                <SearchInput
                    type="search"
                    placeholder="Search for a product..."
                    className="h-12 text-base"
                    classNames={{
                        wrapper: "hidden md:flex",
                    }}
                    value={searchInput}
                    onChange={(e) => {
                        if (e.target.value.length <= 1) setSearch("");
                        setSearchInput(e.target.value);
                    }}
                    onKeyDown={(e) => {
                        if (e.key === "Enter") setSearch(searchInput);
                        if (e.key === "Backspace" && searchInput.length <= 1)
                            setSearch("");
                    }}
                />

                <Separator />

                <div className="grid grid-cols-1 gap-5 md:grid-cols-5">
                    {products.length > 0 ? (
                        products.map((product) => (
                            <ProductCard key={product.id} product={product} />
                        ))
                    ) : (
                        <p>No products found</p>
                    )}
                </div>

                <Separator />

                <Pagination total={pages} />
            </div>
        </div>
    );
}
