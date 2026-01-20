"use client";

import { trpc } from "@/lib/trpc/client";
import { cn } from "@/lib/utils";
import { usePathname, useRouter } from "next/navigation";
import { useQueryState } from "nuqs";
import * as React from "react";
import { useState } from "react";
import { Icons } from "../icons";

export type InputProps = React.InputHTMLAttributes<HTMLInputElement> & {
    classNames?: {
        wrapper?: string;
        input?: string;
    };
};

const ProductSearch = React.forwardRef<HTMLInputElement, InputProps>(
    ({ className, disabled, classNames, ...props }, ref) => {
        const router = useRouter();
        const pathname = usePathname();
        const [search, setSearch] = useQueryState("search", {
            defaultValue: "",
        });
        const [, setCategoryId] = useQueryState("categoryId", {
            defaultValue: "",
        });
        const [, setSubCategoryId] = useQueryState("subcategoryId", {
            defaultValue: "",
        });
        const [, setProductTypeId] = useQueryState("productTypeId", {
            defaultValue: "",
        });
        const [, setPage] = useQueryState("page", { defaultValue: "1" });

        const [localSearch, setLocalSearch] = useState(search);
        const [isSearching, setIsSearching] = useState(false);

        // TRPC mutation for search processing
        const processSearchMutation =
            trpc.general.search.processSearch.useMutation({
                onSuccess: (result) => {
                    setIsSearching(false);

                    // Route based on intent type (Stage 6 & 9)
                    switch (result.intentType) {
                        case "BRAND":
                            // Navigate to brand page
                            router.push(`/brands/${result.brandSlug}`);
                            break;

                        case "CATEGORY":
                            // Navigate to shop with category filter
                            if (pathname === "/shop") {
                                setCategoryId(result.categoryId || "");
                                setSubCategoryId("");
                                setProductTypeId("");
                                setSearch("");
                                setPage("1");
                            } else {
                                router.push(
                                    `/shop?categoryId=${result.categoryId}`
                                );
                            }
                            break;

                        case "SUBCATEGORY":
                            // Navigate to shop with subcategory filter
                            if (pathname === "/shop") {
                                setSubCategoryId(result.subcategoryId || "");
                                setCategoryId("");
                                setProductTypeId("");
                                setSearch("");
                                setPage("1");
                            } else {
                                router.push(
                                    `/shop?subcategoryId=${result.subcategoryId}`
                                );
                            }
                            break;

                        case "PRODUCT_TYPE":
                            // Navigate to shop with product type filter
                            if (pathname === "/shop") {
                                setProductTypeId(result.productTypeId || "");
                                setCategoryId("");
                                setSubCategoryId("");
                                setSearch("");
                                setPage("1");
                            } else {
                                router.push(
                                    `/shop?productTypeId=${result.productTypeId}`
                                );
                            }
                            break;

                        case "UNKNOWN":
                        default:
                            // Fallback to full-text search
                            if (pathname === "/shop") {
                                setSearch(result.originalQuery);
                                setCategoryId("");
                                setSubCategoryId("");
                                setProductTypeId("");
                                setPage("1");
                            } else {
                                router.push(
                                    `/shop?search=${encodeURIComponent(result.originalQuery)}`
                                );
                            }
                            break;
                    }
                },
                onError: (error) => {
                    setIsSearching(false);
                    console.error("Search error:", error);
                    // Fallback to simple search on error
                    if (pathname === "/shop") {
                        setSearch(localSearch);
                        setPage("1");
                    } else {
                        router.push(
                            `/shop?search=${encodeURIComponent(localSearch)}`
                        );
                    }
                },
            });

        // Handle input change
        const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
            setLocalSearch(e.target.value);
        };

        // Handle search submission
        const handleSearch = () => {
            const query = localSearch.trim();

            if (query.length > 2) {
                setIsSearching(true);
                // Process through the search engine
                processSearchMutation.mutate({
                    query,
                });
            } else if (query.length === 0) {
                // Clear search
                if (pathname === "/shop") {
                    setSearch("");
                } else {
                    router.push("/shop");
                }
            }
        };

        // Handle Enter key
        const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
            if (e.key === "Enter") {
                handleSearch();
            }
        };

        // Handle clear button
        const handleClear = () => {
            setLocalSearch("");
            if (pathname.startsWith("/shop")) {
                setSearch("");
            }
        };

        // Sync with URL search param
        React.useEffect(() => {
            setLocalSearch(search);
        }, [search]);

        return (
            <div
                className={cn(
                    "relative flex w-full items-center gap-1 rounded-none bg-[#fbfaf4] shadow-md",
                    disabled && "cursor-not-allowed opacity-50",
                    classNames?.wrapper
                )}
            >
                <div className="bg-[#fbfaf4] p-2 pl-3">
                    {isSearching ? (
                        <Icons.Loader2 className="size-5 animate-spin opacity-60" />
                    ) : (
                        <Icons.Search className="size-5 bg-[#fbfaf4] opacity-60" />
                    )}
                </div>

                <input
                    type="text"
                    className={cn(
                        "flex h-9 w-full bg-[#fbfaf4] pr-10 text-sm text-gray-700 placeholder-gray-500 focus:outline-none",
                        className,
                        classNames?.input
                    )}
                    disabled={disabled || isSearching}
                    ref={ref}
                    value={localSearch}
                    onChange={handleChange}
                    onKeyDown={handleKeyDown}
                    placeholder="Search for products, brands, categories..."
                    {...props}
                />

                {localSearch && !isSearching && (
                    <button
                        type="button"
                        className="absolute right-2 p-1"
                        onClick={handleClear}
                        aria-label="Clear search"
                    >
                        <Icons.X className="size-5 opacity-60 hover:opacity-100" />
                    </button>
                )}
            </div>
        );
    }
);

ProductSearch.displayName = "ProductSearch";
export { ProductSearch };
