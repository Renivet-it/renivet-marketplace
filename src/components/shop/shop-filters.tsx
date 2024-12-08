"use client";

import { cn, formatPriceTag } from "@/lib/utils";
import {
    BrandMeta,
    CachedCategory,
    CachedProductType,
    CachedSubCategory,
} from "@/lib/validations";
import {
    parseAsArrayOf,
    parseAsFloat,
    parseAsString,
    parseAsStringLiteral,
    useQueryState,
} from "nuqs";
import { useState } from "react";
import { Icons } from "../icons";
import { Button } from "../ui/button-general";
import { Label } from "../ui/label";
import { MultipleSelectorGeneral } from "../ui/multi-select-general";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "../ui/select-general";
import { Separator } from "../ui/separator";
import { Slider } from "../ui/slider";

interface PageProps extends GenericProps {
    brandsMeta: {
        data: BrandMeta[];
        count: number;
    };
    categories: CachedCategory[];
    subCategories: CachedSubCategory[];
    productTypes: CachedProductType[];
}

const sortByWithOrderTypes = [
    {
        label: "Price: High to Low",
        value: "price:desc",
    },
    {
        label: "Price: Low to High",
        value: "price:asc",
    },
    {
        label: "Newest First",
        value: "createdAt:desc",
    },
    {
        label: "Oldest First",
        value: "createdAt:asc",
    },
];

export function ShopFilters({
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
    const [minPrice, setMinPrice] = useQueryState("minPrice", parseAsFloat);
    const [maxPrice, setMaxPrice] = useQueryState("maxPrice", parseAsFloat);
    const [categoryId, setCategoryId] = useQueryState("categoryId", {
        defaultValue: "",
    });
    const [subCategoryId, setSubCategoryId] = useQueryState("subcategoryId", {
        defaultValue: "",
    });
    const [productTypeId, setProductTypeId] = useQueryState("productTypeId", {
        defaultValue: "",
    });
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

    const handleCategoryChange = (value: string) => {
        setCategoryId(value);
        setSubCategoryId("");
        setProductTypeId("");
    };

    const handleSubCategoryChange = (value: string) => {
        setSubCategoryId(value);
        setProductTypeId("");
    };

    const handleResetCategory = () => {
        setCategoryId("");
        setSubCategoryId("");
        setProductTypeId("");
    };

    const handleSort = (value: string) => {
        const [sortBy, sortOrder] = value.split(":");
        setSortBy(sortBy as "price" | "createdAt");
        setSortOrder(sortOrder as "asc" | "desc");
    };

    return (
        <div className={cn("", className)} {...props}>
            <h4 className="text-lg">Filters</h4>

            <Separator />

            <div className="space-y-[4px]">
                <Label
                    className="font-semibold uppercase"
                    htmlFor="category_select"
                >
                    Category
                </Label>

                <Select
                    value={categoryId}
                    onValueChange={handleCategoryChange}
                    disabled={categories.length === 0}
                >
                    <SelectTrigger className="w-full" id="category_select">
                        <SelectValue placeholder="Select Category" />
                    </SelectTrigger>

                    <SelectContent>
                        {categories.map((category) => (
                            <SelectItem key={category.id} value={category.id}>
                                {category.name}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>

            {categoryId.length > 0 && (
                <div className="space-y-[4px]">
                    <Label
                        className="font-semibold uppercase"
                        htmlFor="sub_select"
                    >
                        Subcategory
                    </Label>

                    <Select
                        value={subCategoryId}
                        onValueChange={handleSubCategoryChange}
                        disabled={
                            subCategories.filter(
                                (sub) => sub.categoryId === categoryId
                            ).length === 0
                        }
                    >
                        <SelectTrigger className="w-full" id="sub_select">
                            <SelectValue placeholder="Select Sub-Category" />
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
            )}

            {subCategoryId.length > 0 && (
                <div className="space-y-[4px]">
                    <Label
                        className="font-semibold uppercase"
                        htmlFor="type_select"
                    >
                        Type
                    </Label>

                    <Select
                        value={productTypeId}
                        onValueChange={setProductTypeId}
                        disabled={
                            productTypes.filter(
                                (type) => type.subCategoryId === subCategoryId
                            ).length === 0
                        }
                    >
                        <SelectTrigger className="w-full" id="type_select">
                            <SelectValue placeholder="Select Type" />
                        </SelectTrigger>

                        <SelectContent>
                            {productTypes
                                .filter(
                                    (type) =>
                                        type.subCategoryId === subCategoryId
                                )
                                .map((type) => (
                                    <SelectItem key={type.id} value={type.id}>
                                        {type.name}
                                    </SelectItem>
                                ))}
                        </SelectContent>
                    </Select>
                </div>
            )}

            {categoryId.length > 0 && (
                <Button
                    size="sm"
                    className="h-10 w-full"
                    onClick={handleResetCategory}
                    disabled={categoryId.length === 0}
                >
                    <Icons.History />
                    Reset Category
                </Button>
            )}

            <Separator />

            <div className="space-y-1">
                <Label className="font-semibold uppercase">Brand</Label>

                <MultipleSelectorGeneral
                    commandProps={{
                        label: "Brands",
                    }}
                    defaultOptions={brandsMeta.data
                        .map((brand) => ({
                            label: brand.name,
                            value: brand.slug,
                        }))
                        .sort((a, b) => a.value.localeCompare(b.value))}
                    placeholder="Select brands"
                    emptyIndicator={
                        <p className="text-center text-sm">No results found</p>
                    }
                    value={brandsMeta.data
                        .filter((brand) => brandIds.includes(brand.id))
                        .map((brand) => ({
                            label: brand.name,
                            value: brand.slug,
                        }))}
                    onChange={(options) =>
                        setBrandIds(
                            options.map(
                                (option) =>
                                    brandsMeta.data.find(
                                        (brand) => brand.slug === option.value
                                    )?.id ?? ""
                            )
                        )
                    }
                />
            </div>

            <Separator />

            <div className="space-y-3">
                <div className="space-y-2">
                    <Label
                        className="font-semibold uppercase"
                        htmlFor="price_slider"
                    >
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
                        {formatPriceTag(priceRange[0])} -{" "}
                        {formatPriceTag(priceRange[1])}
                        {priceRange[1] === 10000 && "+"}
                    </Label>
                </div>
            </div>

            <Separator />

            <div className="space-y-1">
                <Label
                    className="font-semibold uppercase"
                    htmlFor="sort_select"
                >
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
