"use client";

import { cn } from "@/lib/utils";
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
    const allItemsHref = useMemo(() => {
        const params = new URLSearchParams(
            Array.from(searchParams.entries()).filter(
                ([key]) => key !== "productTypeId" && key !== "page"
            )
        );
        const query = params.toString();
        return query ? `?${query}` : "/shop";
    }, [searchParams]);

    const getTypeHref = (typeId: string) => {
        const params = new URLSearchParams(
            Array.from(searchParams.entries()).filter(
                ([key]) => key !== "productTypeId" && key !== "page"
            )
        );
        params.set("productTypeId", typeId);
        params.set("page", "1");
        return `?${params.toString()}`;
    };

    // 1) start with whichever prop the parent passed (fallback to [])
    const [products, setProducts] = useState<Product[]>(
        productsProp ?? initialProducts ?? []
    );
    const [showAll, setShowAll] = useState(false);

    // 2) sync when parent updates the prop (e.g. full page navigation / SSR)
    useEffect(() => {
        setProducts(productsProp ?? initialProducts ?? []);
    }, [productsProp, initialProducts]);

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
                    "scrollbar-hide flex gap-2 overflow-x-auto pb-2",
                    isDesktop && (!showAll ? "flex-nowrap" : "flex-wrap")
                )}
            >
                <a
                    href={allItemsHref}
                    className={cn(
                        "whitespace-nowrap rounded-lg border px-4 py-2 text-sm font-medium transition-colors",
                        !productTypeId && "border-black bg-black text-white"
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
                                    "whitespace-nowrap rounded-lg border px-4 py-2 text-sm font-medium transition-colors",
                                    productTypeId === type.id &&
                                        "border-black bg-black text-white"
                                )}
                            >
                                {type.displayName}
                            </a>
                        ))}
                        {isDesktop && activeTypes.length > 6 && (
                            <button
                                onClick={() => setShowAll(!showAll)}
                                className="whitespace-nowrap rounded-lg border px-4 py-2 text-sm font-medium transition-colors hover:bg-gray-100"
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
