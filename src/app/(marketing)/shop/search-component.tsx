"use client";

import { cn } from "@/lib/utils";
import { trpc } from "@/lib/trpc/client";
import { useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

type Product = {
    id?: string;
    productTypeId?: string;
    productType?: {
        id: string;
        name: string;
        subCategory?: { name: string };
    };
    subcategory?: { name: string };
    [k: string]: any;
};

export function SearchableProductTypes({
    productTypes,
    initialProducts = [],
    products: productsProp,
    productTypeId,
    isDesktop = false,
}: {
    productTypes: {
        id: string;
        name: string;
        subCategory?: { name: string };
    }[];
    initialProducts?: Product[]; // server-passed initial data
    products?: Product[]; // alternate prop name (optional)
    productTypeId?: string;
    isDesktop?: boolean;
}) {
    const searchParams = useSearchParams();
    const searchTerm = searchParams.get("search") ?? "";
    const sortBy =
        (searchParams.get("sortBy") as
            | "price"
            | "createdAt"
            | "recommended"
            | "best-sellers") ?? "recommended";
    const sortOrder =
        (searchParams.get("sortOrder") as "asc" | "desc") ?? "desc";

    const brandIdsParam = searchParams.get("brandIds");
    const colorsParam = searchParams.get("colors");
    const sizesParam = searchParams.get("sizes");
    const minPriceParam = searchParams.get("minPrice");
    const maxPriceParam = searchParams.get("maxPrice");
    const minDiscountParam = searchParams.get("minDiscount");
    const categoryIdParam = searchParams.get("categoryId");
    const subCategoryIdParam =
        searchParams.get("subCategoryId") ?? searchParams.get("subcategoryId");

    const { data: liveProducts } = trpc.brands.products.getProducts.useQuery(
        {
            page: 1,
            limit: 80,
            search: searchTerm || undefined,
            isPublished: true,
            isAvailable: true,
            isActive: true,
            isDeleted: false,
            verificationStatus: "approved",
            brandIds: brandIdsParam ? brandIdsParam.split(",") : undefined,
            minPrice: minPriceParam ? Number(minPriceParam) : 0,
            maxPrice: maxPriceParam ? Number(maxPriceParam) : 1000000,
            categoryId: categoryIdParam || undefined,
            subcategoryId: subCategoryIdParam || undefined,
            productTypeId: productTypeId || undefined,
            sortBy: sortBy === "recommended" ? undefined : sortBy,
            sortOrder: sortBy === "recommended" ? undefined : sortOrder,
            colors: colorsParam ? colorsParam.split(",") : undefined,
            sizes: sizesParam ? sizesParam.split(",") : undefined,
            minDiscount: minDiscountParam ? Number(minDiscountParam) : undefined,
            prioritizeBestSellers:
                !searchTerm && (!sortBy || sortBy === "recommended"),
            requireMedia: true,
            useRecommendations:
                !searchTerm && (!sortBy || sortBy === "recommended"),
        },
        {
            staleTime: 0,
            refetchOnWindowFocus: false,
        }
    );
    const allItemsHref = useMemo(() => {
        const params = new URLSearchParams(
            Array.from(searchParams.entries()).filter(
                ([key]) => key !== "productTypeId" && key !== "page" && key !== "shopPage"
            )
        );
        const query = params.toString();
        return query ? `?${query}` : "/shop";
    }, [searchParams]);

    const getTypeHref = (typeId: string) => {
        const params = new URLSearchParams(
            Array.from(searchParams.entries()).filter(
                ([key]) => key !== "productTypeId" && key !== "page" && key !== "shopPage"
            )
        );
        params.set("productTypeId", typeId);
        params.set("shopPage", "1");
        return `?${params.toString()}`;
    };

    // 1) start with whichever prop the parent passed (fallback to [])
    const [products, setProducts] = useState<Product[]>(
        productsProp ?? initialProducts ?? []
    );
    const [showAll, setShowAll] = useState(false);

    // 2) sync when parent updates the prop (e.g. full page navigation / SSR)
    useEffect(() => {
        if (liveProducts?.data?.length) {
            setProducts(liveProducts.data as Product[]);
            return;
        }
        setProducts(productsProp ?? initialProducts ?? []);
    }, [productsProp, initialProducts, liveProducts?.data]);

    // 3) compute active types from the products state
    const activeTypes = useMemo(() => {
        const unique = new Set<string>();
        const types: { id: string; name: string; subCategoryName?: string }[] =
            [];

        for (const p of products) {
            const pt = p.productType;
            if (pt && !unique.has(pt.id)) {
                unique.add(pt.id);
                types.push({
                    id: pt.id,
                    name: pt.name,
                    subCategoryName:
                        pt.subCategory?.name || p.subcategory?.name,
                });
            }
        }

        // if no types found and there's no search, fall back to the global types passed from server
        const sourceTypes =
            types.length === 0 && !searchTerm
                ? productTypes.map((pt) => ({
                      id: pt.id,
                      name: pt.name,
                      subCategoryName: pt.subCategory?.name,
                  }))
                : types;

        // Logic to detect duplicate names and append subcategory
        const nameCounts = new Map<string, number>();
        sourceTypes.forEach((t) => {
            nameCounts.set(t.name, (nameCounts.get(t.name) || 0) + 1);
        });

        return sourceTypes.map((t) => {
            const isDuplicate = (nameCounts.get(t.name) || 0) > 1;
            return {
                ...t,
                displayName:
                    isDuplicate && t.subCategoryName
                        ? `${t.name} (${t.subCategoryName})`
                        : t.name,
            };
        });
    }, [products, productTypes, searchTerm]);

    return (
        <div
            className={cn(
                "space-y-3",
                isDesktop && "flex flex-1 flex-col gap-3"
            )}
        >
            <div
                className={cn(
                    "scrollbar-hide flex gap-2.5 overflow-x-auto pb-2",
                    isDesktop && (!showAll ? "flex-nowrap" : "flex-wrap")
                )}
            >
                <a
                    href={allItemsHref}
                    className={cn(
                        "whitespace-nowrap rounded-full border border-[#cfdae7] bg-white px-5 py-2.5 text-base font-medium text-[#2f4968] shadow-[0_1px_0_rgba(0,0,0,0.02)] transition-all duration-200 hover:-translate-y-[1px] hover:border-[#aebed1] hover:bg-[#f5f8fc]",
                        !productTypeId &&
                            "border-[#1f3553] bg-[#1f3553] text-white shadow-[0_4px_14px_rgba(31,53,83,0.24)] hover:bg-[#1a2f49]"
                    )}
                >
                    All Items
                </a>

                {activeTypes.length > 0 ? (
                    <>
                        {(isDesktop && !showAll
                            ? activeTypes.slice(0, 6)
                            : activeTypes
                        ).map((type) => (
                            <a
                                key={type.id}
                                href={getTypeHref(type.id)}
                                className={cn(
                                    "whitespace-nowrap rounded-full border border-[#cfdae7] bg-white px-5 py-2.5 text-base font-medium text-[#2f4968] shadow-[0_1px_0_rgba(0,0,0,0.02)] transition-all duration-200 hover:-translate-y-[1px] hover:border-[#aebed1] hover:bg-[#f5f8fc]",
                                    productTypeId === type.id &&
                                        "border-[#1f3553] bg-[#1f3553] text-white shadow-[0_4px_14px_rgba(31,53,83,0.24)] hover:bg-[#1a2f49]"
                                )}
                            >
                                {type.displayName}
                            </a>
                        ))}
                        {isDesktop && activeTypes.length > 6 && (
                            <button
                                onClick={() => setShowAll(!showAll)}
                                className="whitespace-nowrap rounded-full border border-dashed border-[#b9c7d6] px-5 py-2.5 text-base font-medium text-[#48617f] transition-colors hover:bg-[#f5f8fc]"
                            >
                                {showAll ? "Show Less" : "Show More"}
                            </button>
                        )}
                    </>
                ) : (
                    <p className="px-2 text-sm text-muted-foreground">
                        No related types
                    </p>
                )}
            </div>
        </div>
    );
}
