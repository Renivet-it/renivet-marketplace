"use client";

import { trpc } from "@/lib/trpc/client";
import { cn } from "@/lib/utils";
import { ProductWithBrand } from "@/lib/validations";
import {
    parseAsArrayOf,
    parseAsInteger,
    parseAsString,
    parseAsStringLiteral,
    useQueryState,
} from "nuqs";
import { ProductCard } from "../globals/cards";
import { Pagination } from "../ui/data-table-general";
import { Separator } from "../ui/separator";

interface PageProps extends GenericProps {
    initialData: {
        data: ProductWithBrand[];
        count: number;
    };
}

export function ShopProducts({ className, initialData, ...props }: PageProps) {
    const [page] = useQueryState("page", parseAsInteger.withDefault(1));
    const [limit] = useQueryState("limit", parseAsInteger.withDefault(30));
    const [search] = useQueryState("search", { defaultValue: "" });
    const [brandIds] = useQueryState(
        "brandIds",
        parseAsArrayOf(parseAsString, ",").withDefault([])
    );
    const [minPrice] = useQueryState("minPrice", parseAsInteger.withDefault(0));
    const [maxPrice] = useQueryState(
        "maxPrice",
        parseAsInteger.withDefault(10000)
    );
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
            search,
            isPublished: true,
            isAvailable: true,
            brandIds,
            minPrice: minPrice < 0 ? 0 : minPrice,
            maxPrice: maxPrice > 10000 ? 10000 : maxPrice,
            categoryId,
            subCategoryId,
            productTypeId,
            sortBy,
            sortOrder,
        },
        { initialData }
    );

    const pages = Math.ceil(count / limit) ?? 1;

    return (
        <>
            <div
                className={cn(
                    "grid grid-cols-2 gap-5 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5",
                    className
                )}
                {...props}
            >
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
        </>
    );
}
