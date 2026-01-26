"use client";

import { trpc } from "@/lib/trpc/client";
import { cn } from "@/lib/utils";
import { useDebouncedCallback } from "@mantine/hooks";
import { usePathname, useRouter } from "next/navigation";
import { useQueryState } from "nuqs";
import * as React from "react";
import { useCallback, useEffect, useRef, useState } from "react";
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
        const [showSuggestions, setShowSuggestions] = useState(false);
        const [selectedIndex, setSelectedIndex] = useState(-1);
        const wrapperRef = useRef<HTMLDivElement>(null);
        const inputRef = useRef<HTMLInputElement | null>(null);

        // Merge refs
        const setRefs = useCallback(
            (node: HTMLInputElement | null) => {
                inputRef.current = node;
                if (typeof ref === "function") {
                    ref(node);
                } else if (ref) {
                    ref.current = node;
                }
            },
            [ref]
        );

        // TRPC query for suggestions
        const { data: suggestions = [], isLoading: isFetchingSuggestions } =
            trpc.general.search.getSuggestions.useQuery(
                { query: localSearch, limit: 6 },
                {
                    enabled: localSearch.length >= 2,
                    staleTime: 1000 * 60, // 1 minute
                }
            );

        // TRPC mutation for search processing
        const processSearchMutation =
            trpc.general.search.processSearch.useMutation({
                onSuccess: (result) => {
                    setIsSearching(false);
                    setShowSuggestions(false);

                    // Route based on intent type (Stage 6 & 9)
                    switch (result.intentType) {
                        case "BRAND":
                            router.push(`/brands/${result.brandSlug}`);
                            break;

                        case "CATEGORY":
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
            const value = e.target.value;
            setLocalSearch(value);
            setShowSuggestions(value.length >= 2);
            setSelectedIndex(-1);
        };

        // Handle search submission
        const handleSearch = (query?: string) => {
            const searchQuery = (query || localSearch).trim();

            if (searchQuery.length > 2) {
                setIsSearching(true);
                setShowSuggestions(false);
                processSearchMutation.mutate({ query: searchQuery });
            } else if (searchQuery.length === 0) {
                if (pathname === "/shop") {
                    setSearch("");
                } else {
                    router.push("/shop");
                }
            }
        };

        // Handle suggestion click
        const handleSuggestionClick = (keyword: string) => {
            setLocalSearch(keyword);
            handleSearch(keyword);
        };

        // Handle keyboard navigation
        const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
            if (!showSuggestions || suggestions.length === 0) {
                if (e.key === "Enter") {
                    handleSearch();
                }
                return;
            }

            switch (e.key) {
                case "ArrowDown":
                    e.preventDefault();
                    setSelectedIndex((prev) =>
                        prev < suggestions.length - 1 ? prev + 1 : prev
                    );
                    break;
                case "ArrowUp":
                    e.preventDefault();
                    setSelectedIndex((prev) => (prev > 0 ? prev - 1 : -1));
                    break;
                case "Enter":
                    e.preventDefault();
                    if (selectedIndex >= 0 && suggestions[selectedIndex]) {
                        handleSuggestionClick(
                            suggestions[selectedIndex].keyword
                        );
                    } else {
                        handleSearch();
                    }
                    break;
                case "Escape":
                    setShowSuggestions(false);
                    setSelectedIndex(-1);
                    break;
            }
        };

        // Handle clear button
        const handleClear = () => {
            setLocalSearch("");
            setShowSuggestions(false);
            if (pathname.startsWith("/shop")) {
                setSearch("");
            }
        };

        // Close suggestions when clicking outside
        useEffect(() => {
            const handleClickOutside = (event: MouseEvent) => {
                if (
                    wrapperRef.current &&
                    !wrapperRef.current.contains(event.target as Node)
                ) {
                    setShowSuggestions(false);
                }
            };

            document.addEventListener("mousedown", handleClickOutside);
            return () => {
                document.removeEventListener("mousedown", handleClickOutside);
            };
        }, []);

        // Sync with URL search param
        useEffect(() => {
            setLocalSearch(search);
        }, [search]);

        return (
            <div ref={wrapperRef} className="relative w-full">
                <div
                    className={cn(
                        "relative flex w-full items-center gap-1 rounded-none bg-[#fbfaf4] shadow-md",
                        disabled && "cursor-not-allowed opacity-50",
                        classNames?.wrapper
                    )}
                >
                    <div className="bg-[#fbfaf4] p-2 pl-3">
                        {isSearching || isFetchingSuggestions ? (
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
                        ref={setRefs}
                        value={localSearch}
                        onChange={handleChange}
                        onKeyDown={handleKeyDown}
                        onFocus={() =>
                            localSearch.length >= 2 && setShowSuggestions(true)
                        }
                        placeholder="Search for products, brands, categories..."
                        autoComplete="off"
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

                {/* Suggestions Dropdown - Myntra Style */}
                {showSuggestions && suggestions.length > 0 && (
                    <div className="absolute left-0 right-0 top-full z-50 mt-1 max-h-80 overflow-auto rounded-md border border-gray-200 bg-white shadow-lg">
                        {suggestions.map((suggestion, index) => (
                            <button
                                key={`${suggestion.type}-${suggestion.displayText}-${index}`}
                                type="button"
                                className={cn(
                                    "flex w-full items-center gap-3 px-4 py-2.5 text-left transition-colors hover:bg-gray-50",
                                    selectedIndex === index && "bg-gray-100",
                                    suggestion.type === "all" &&
                                        "bg-gray-50 font-medium"
                                )}
                                onClick={() => {
                                    // Handle navigation based on suggestion type
                                    if (suggestion.type === "all") {
                                        handleSuggestionClick(
                                            suggestion.keyword
                                        );
                                    } else if (
                                        suggestion.type === "brand" &&
                                        suggestion.brandSlug
                                    ) {
                                        router.push(
                                            `/brands/${suggestion.brandSlug}`
                                        );
                                        setShowSuggestions(false);
                                    } else if (
                                        suggestion.type === "category" &&
                                        suggestion.categoryId
                                    ) {
                                        if (pathname === "/shop") {
                                            setCategoryId(
                                                suggestion.categoryId
                                            );
                                            setSubCategoryId("");
                                            setProductTypeId("");
                                            setSearch("");
                                            setPage("1");
                                        } else {
                                            router.push(
                                                `/shop?categoryId=${suggestion.categoryId}`
                                            );
                                        }
                                        setShowSuggestions(false);
                                    } else if (
                                        suggestion.type === "subcategory" &&
                                        suggestion.subcategoryId
                                    ) {
                                        if (pathname === "/shop") {
                                            setSubCategoryId(
                                                suggestion.subcategoryId
                                            );
                                            setCategoryId("");
                                            setProductTypeId("");
                                            setSearch("");
                                            setPage("1");
                                        } else {
                                            router.push(
                                                `/shop?subcategoryId=${suggestion.subcategoryId}`
                                            );
                                        }
                                        setShowSuggestions(false);
                                    } else if (
                                        suggestion.type === "productType" &&
                                        suggestion.productTypeId
                                    ) {
                                        if (pathname === "/shop") {
                                            setProductTypeId(
                                                suggestion.productTypeId
                                            );
                                            setCategoryId("");
                                            setSubCategoryId("");
                                            setSearch("");
                                            setPage("1");
                                        } else {
                                            router.push(
                                                `/shop?productTypeId=${suggestion.productTypeId}`
                                            );
                                        }
                                        setShowSuggestions(false);
                                    } else {
                                        handleSuggestionClick(
                                            suggestion.keyword
                                        );
                                    }
                                }}
                                onMouseEnter={() => setSelectedIndex(index)}
                            >
                                <Icons.Search className="size-4 shrink-0 text-gray-400" />
                                <span className="flex-1 truncate text-sm text-gray-700">
                                    {suggestion.displayText}
                                </span>
                            </button>
                        ))}
                    </div>
                )}
            </div>
        );
    }
);

ProductSearch.displayName = "ProductSearch";
export { ProductSearch };
