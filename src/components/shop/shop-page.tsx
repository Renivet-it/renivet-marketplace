"use client";

import { trpc } from "@/lib/trpc/client";
import { cn } from "@/lib/utils";
import {
    BrandMeta,
    CachedCategory,
    CachedProductType,
    CachedSubCategory,
    ProductWithBrand,
} from "@/lib/validations";
import { useMediaQuery } from "@mantine/hooks";
import {
    parseAsArrayOf,
    parseAsFloat,
    parseAsInteger,
    parseAsString,
    parseAsStringLiteral,
    useQueryState,
} from "nuqs";
import { useMemo } from "react";
import { ProductCard } from "../globals/cards";
import { Icons } from "../icons";
import { Button } from "../ui/button-general";
import { Pagination } from "../ui/data-table-general";
import { SearchInput } from "../ui/search-input";
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
import { ShopFilters } from "./shop-filters";

interface PageProps extends GenericProps {
    initialData: {
        data: ProductWithBrand[];
        count: number;
    };
    brandsMeta: {
        data: BrandMeta[];
        count: number;
    };
    categories: CachedCategory[];
    subCategories: CachedSubCategory[];
    productTypes: CachedProductType[];
}

export function ShopPage({
    className,
    initialData,
    brandsMeta,
    categories,
    subCategories,
    productTypes,
    ...props
}: PageProps) {
    const isMobile = useMediaQuery("(max-width: 768px)");

    const [page] = useQueryState("page", parseAsInteger.withDefault(1));
    const [limit] = useQueryState("limit", parseAsInteger.withDefault(30));
    const [search] = useQueryState("search", { defaultValue: "" });
    const [brandIds] = useQueryState(
        "brandIds",
        parseAsArrayOf(parseAsString, ",").withDefault([])
    );
    const [minPrice] = useQueryState("minPrice", parseAsFloat);
    const [maxPrice] = useQueryState("maxPrice", parseAsFloat);
    const [categoryId] = useQueryState("categoryId", { defaultValue: "" });
    const [subCategoryId] = useQueryState("subcategoryId", {
        defaultValue: "",
    });
    const [productTypeId] = useQueryState("productTypeId", {
        defaultValue: "",
    });
    const [sortBy] = useQueryState(
        "sortBy",
        parseAsStringLiteral(["price", "createdAt"] as const).withDefault(
            "createdAt"
        )
    );
    const [sortOrder] = useQueryState(
        "sortOrder",
        parseAsStringLiteral(["asc", "desc"] as const).withDefault("desc")
    );

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
            minPrice: minPrice ?? undefined,
            maxPrice: maxPrice ?? undefined,
            categoryId,
            subCategoryId,
            productTypeId,
            sortBy,
            sortOrder,
        },
        { initialData }
    );

    const pages = useMemo(() => Math.ceil(count / limit) ?? 1, [count, limit]);

    return (
        <div
            className={cn("flex flex-col gap-5 md:flex-row", className)}
            {...props}
        >
            {isMobile ? (
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
                            className="p-4 [&>button]:hidden"
                        >
                            <SheetHeader className="sr-only text-start">
                                <SheetTitle>Select Filters</SheetTitle>
                            </SheetHeader>

                            <ShopFilters
                                className="space-y-4"
                                brandsMeta={brandsMeta}
                                categories={categories}
                                subCategories={subCategories}
                                productTypes={productTypes}
                            />

                            <div className="mt-4 space-y-4">
                                <Separator />

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
                <ShopFilters
                    className="w-full basis-1/6 space-y-4"
                    brandsMeta={brandsMeta}
                    categories={categories}
                    subCategories={subCategories}
                    productTypes={productTypes}
                />
            )}

            <div className="hidden w-px bg-border md:inline-block" />

            <div className="w-full basis-5/6 space-y-5">
                <SearchInput
                    type="search"
                    placeholder="Search for a product..."
                    className="h-12 text-base"
                />

                <Separator />

                <div className="grid grid-cols-2 gap-5 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
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
