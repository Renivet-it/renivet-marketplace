"use client";

import {
    Sheet,
    SheetClose,
    SheetContent,
    SheetHeader,
    SheetTitle,
    SheetTrigger,
} from "@/components/ui/sheet";
import { Spinner } from "@/components/ui/spinner";
import { trpc } from "@/lib/trpc/client";
import { cn } from "@/lib/utils";
import {
    ArrowRight,
    Clock3,
    Droplets,
    Gem,
    Lamp,
    Shirt,
    Sparkles,
    TrendingUp,
} from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useQueryState } from "nuqs";
import * as React from "react";
import { useCallback, useEffect, useRef, useState, useTransition } from "react";
import { Icons } from "../icons";

type BrowserSpeechRecognition = {
    lang: string;
    interimResults: boolean;
    maxAlternatives: number;
    start: () => void;
    stop: () => void;
    onresult: ((event: SpeechRecognitionResultEventLike) => void) | null;
    onerror: ((event: SpeechRecognitionErrorEventLike) => void) | null;
    onend: (() => void) | null;
};

type SpeechRecognitionResultEventLike = {
    results: ArrayLike<ArrayLike<{ transcript?: string }>>;
};

type SpeechRecognitionErrorEventLike = {
    error?: string;
};

type BrowserSpeechRecognitionConstructor = new () => BrowserSpeechRecognition;

declare global {
    interface Window {
        SpeechRecognition?: BrowserSpeechRecognitionConstructor;
        webkitSpeechRecognition?: BrowserSpeechRecognitionConstructor;
    }
}

export type InputProps = React.InputHTMLAttributes<HTMLInputElement> & {
    classNames?: {
        wrapper?: string;
        input?: string;
    };
};

const ProductSearch = React.forwardRef<HTMLInputElement, InputProps>(
    ({ className, disabled, classNames }, ref) => {
        const RECENT_SEARCHES_KEY = "renivet-recent-searches";
        const router = useRouter();
        const pathname = usePathname();
        const searchParams = useSearchParams();
        const [search] = useQueryState("search", {
            defaultValue: "",
        });

        const [localSearch, setLocalSearch] = useState(search);
        const [showSuggestions, setShowSuggestions] = useState(false);
        const [selectedIndex, setSelectedIndex] = useState(-1);
        const [isListening, setIsListening] = useState(false);
        const [isVoiceSupported, setIsVoiceSupported] = useState(false);
        const wrapperRef = useRef<HTMLDivElement>(null);
        const inputRef = useRef<HTMLInputElement | null>(null);
        const recognitionRef = useRef<BrowserSpeechRecognition | null>(null);

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

        // State for suggestions
        const [suggestions, setSuggestions] = useState<string[]>([]);
        const [products, setProducts] = useState<any[]>([]);
        const [isFetchingSuggestions, setIsFetchingSuggestions] =
            useState(false);
        const [isSheetOpen, setIsSheetOpen] = useState(false);
        const [recentSearches, setRecentSearches] = useState<string[]>([]);
        const [isRoutePending, startRouteTransition] = useTransition();
        const [isSearchNavigating, setIsSearchNavigating] = useState(false);
        const [pendingHref, setPendingHref] = useState<string | null>(null);

        const pushSearchRoute = useCallback(
            (href: string) => {
                setIsSheetOpen(false);
                setShowSuggestions(false);
                setSelectedIndex(-1);
                setPendingHref(href);
                setIsSearchNavigating(true);
                startRouteTransition(() => {
                    router.push(href);
                });
            },
            [router]
        );

        useEffect(() => {
            if (typeof window === "undefined") return;

            const warmSearchModule = () => {
                void import("@/lib/python/ai-suggestion");
            };

            if ("requestIdleCallback" in window) {
                const idleId = window.requestIdleCallback(warmSearchModule);
                return () => window.cancelIdleCallback(idleId);
            }

            const timer = window.setTimeout(warmSearchModule, 800);
            return () => window.clearTimeout(timer);
        }, []);

        // Fetch suggestions when search term changes
        useEffect(() => {
            const fetchAISuggestions = async () => {
                if (localSearch.length < 2) {
                    setSuggestions([]);
                    setProducts([]);
                    return;
                }

                setIsFetchingSuggestions(true);
                try {
                    const { fetchSuggestions, fetchSearchProducts } =
                        await import("@/lib/python/ai-suggestion");
                    const [suggestionsResult, productsResult] =
                        await Promise.all([
                            fetchSuggestions(localSearch),
                            fetchSearchProducts(localSearch),
                        ]);

                    if (Array.isArray(suggestionsResult)) {
                        setSuggestions(suggestionsResult);
                    }
                    if (Array.isArray(productsResult)) {
                        setProducts(productsResult);
                    }
                } catch (error) {
                    console.error("Error fetching suggestions:", error);
                    setSuggestions([]);
                    setProducts([]);
                } finally {
                    setIsFetchingSuggestions(false);
                }
            };

            const debounceTimer = setTimeout(() => {
                fetchAISuggestions();
            }, 300);

            return () => clearTimeout(debounceTimer);
        }, [localSearch]);

        const navigateToShopWithSearch = useCallback(
            (nextSearch: string) => {
                const trimmed = nextSearch.trim();
                const currentSearch = (searchParams.get("search") ?? "").trim();
                const hasChangedSearch = trimmed !== currentSearch;

                if (trimmed.length > 0) {
                    const params = new URLSearchParams(
                        Array.from(searchParams.entries()).filter(
                            ([key]) =>
                                key !== "search" &&
                                key !== "page" &&
                                key !== "shopPage"
                        )
                    );
                    params.set("search", trimmed);
                    if (hasChangedSearch) {
                        params.set("shopPage", "1");
                    } else {
                        const existingShopPage = searchParams.get("shopPage");
                        if (existingShopPage) {
                            params.set("shopPage", existingShopPage);
                        }
                    }
                    pushSearchRoute(`/shop?${params.toString()}`);
                    return;
                }
                const params = new URLSearchParams(
                    Array.from(searchParams.entries()).filter(
                        ([key]) =>
                            key !== "search" &&
                            key !== "page" &&
                            key !== "shopPage"
                    )
                );
                params.set("shopPage", "1");
                const query = params.toString();
                pushSearchRoute(query ? `/shop?${query}` : "/shop");
            },
            [pushSearchRoute, searchParams]
        );

        // TRPC mutation for search processing
        const processSearchMutation =
            trpc.general.search.processSearch.useMutation({
                onSuccess: (result) => {
                    setShowSuggestions(false);
                    if (
                        result.intentType === "BRAND" ||
                        result.intentType === "PRODUCT_TYPE"
                    ) {
                        navigateToShopWithSearch(result.originalQuery);
                        return;
                    }
                    if (
                        result.intentType &&
                        result.intentType !== "UNKNOWN" &&
                        result.redirectUrl
                    ) {
                        pushSearchRoute(result.redirectUrl);
                        return;
                    }
                    navigateToShopWithSearch(result.originalQuery);
                },
                onError: (error) => {
                    console.error("Search error:", error);
                    navigateToShopWithSearch(localSearch);
                },
            });

        const isSubmittingSearch =
            processSearchMutation.isPending ||
            isRoutePending ||
            isSearchNavigating;

        // Fetch sub-categories for the discover section
        const { data: subCategoriesData } =
            trpc.general.subCategories.getSubCategories.useQuery();
        const subCategories = subCategoriesData?.data || [];

        const targetSubCategories = [
            {
                title: "Skincare, Bath & Body",
                searchPattern: "skincare",
                bg: "bg-rose-50",
                icon: Droplets,
            },
            {
                title: "Home Decor",
                searchPattern: "decor",
                bg: "bg-amber-50",
                icon: Lamp,
            },
            {
                title: "Western Wear",
                searchPattern: "western",
                bg: "bg-emerald-50",
                icon: Gem,
            },
            {
                title: "Top Wear",
                searchPattern: "topwear",
                bg: "bg-[#e8f4f8]",
                icon: Shirt,
            },
        ];

        const discoverCategories = targetSubCategories.map((target) => {
            const found = subCategories.find((sub) =>
                sub.name
                    .toLowerCase()
                    .replace(/\s+/g, "")
                    .includes(target.searchPattern.replace(/\s+/g, ""))
            );
            return {
                ...target,
                link: found
                    ? `/shop?subCategoryId=${found.id}`
                    : `/shop?search=${encodeURIComponent(target.title)}`,
            };
        });

        // Handle input change
        const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
            const value = e.target.value;
            setLocalSearch(value);
            // Show suggestions immediately if we have them, otherwise the effect will fetch
            setShowSuggestions(value.length >= 2);
            setSelectedIndex(-1);
        };

        // Handle search submission
        const handleSearch = (query?: string) => {
            if (isSubmittingSearch) return;

            const searchQuery = (query || localSearch).trim();

            if (searchQuery.length > 2) {
                setIsSheetOpen(false);
                setShowSuggestions(false);
                setRecentSearches((current) => {
                    const next = [
                        searchQuery,
                        ...current.filter(
                            (item) =>
                                item.toLowerCase() !== searchQuery.toLowerCase()
                        ),
                    ].slice(0, 6);
                    if (typeof window !== "undefined") {
                        window.localStorage.setItem(
                            RECENT_SEARCHES_KEY,
                            JSON.stringify(next)
                        );
                    }
                    return next;
                });
                processSearchMutation.mutate({ query: searchQuery });
            } else if (searchQuery.length === 0) {
                navigateToShopWithSearch("");
            }
        };

        // Handle suggestion click
        const handleSuggestionClick = (keyword: string) => {
            if (isSubmittingSearch) return;

            setLocalSearch(keyword);
            setShowSuggestions(false);
            setSelectedIndex(-1);
            navigateToShopWithSearch(keyword);
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
                        handleSuggestionClick(suggestions[selectedIndex]);
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
            setSuggestions([]);
            setProducts([]);
            setShowSuggestions(false);
            if (inputRef.current) {
                inputRef.current.focus();
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

        useEffect(() => {
            if (!pendingHref || !isSearchNavigating) return;

            const currentHref = `${pathname}${
                searchParams.toString() ? `?${searchParams.toString()}` : ""
            }`;

            if (currentHref !== pendingHref) return;

            const timeout = window.setTimeout(() => {
                setIsSearchNavigating(false);
                setPendingHref(null);
                setIsSheetOpen(false);
            }, 350);

            return () => window.clearTimeout(timeout);
        }, [isSearchNavigating, pathname, pendingHref, searchParams]);

        useEffect(() => {
            const SpeechRecognitionCtor =
                typeof window !== "undefined"
                    ? window.SpeechRecognition || window.webkitSpeechRecognition
                    : undefined;
            setIsVoiceSupported(!!SpeechRecognitionCtor);
        }, []);

        useEffect(() => {
            if (typeof window === "undefined") return;
            try {
                const storedValue =
                    window.localStorage.getItem(RECENT_SEARCHES_KEY);
                if (!storedValue) return;
                const parsed = JSON.parse(storedValue);
                if (Array.isArray(parsed)) {
                    setRecentSearches(
                        parsed.filter(
                            (item): item is string => typeof item === "string"
                        )
                    );
                }
            } catch {
                setRecentSearches([]);
            }
        }, [RECENT_SEARCHES_KEY]);

        useEffect(() => {
            return () => {
                recognitionRef.current?.stop();
            };
        }, []);

        const handleVoiceSearch = () => {
            if (isSubmittingSearch) return;

            if (!isVoiceSupported) return;

            if (isListening) {
                recognitionRef.current?.stop();
                setIsListening(false);
                return;
            }

            const SpeechRecognitionCtor =
                window.SpeechRecognition || window.webkitSpeechRecognition;
            if (!SpeechRecognitionCtor) return;

            const recognition = new SpeechRecognitionCtor();
            recognition.lang =
                typeof navigator !== "undefined"
                    ? navigator.language || "en-IN"
                    : "en-IN";
            recognition.interimResults = false;
            recognition.maxAlternatives = 1;

            recognition.onresult = (event) => {
                const transcript =
                    event?.results?.[0]?.[0]?.transcript?.trim() || "";
                if (!transcript) return;
                setLocalSearch(transcript);
                setShowSuggestions(false);
                setSelectedIndex(-1);
                handleSearch(transcript);
            };

            recognition.onerror = () => {
                setIsListening(false);
            };

            recognition.onend = () => {
                setIsListening(false);
            };

            recognitionRef.current = recognition;
            recognition.start();
            setIsListening(true);
        };

        return (
            <div
                ref={wrapperRef}
                className={cn("relative w-full", classNames?.wrapper)}
            >
                <Sheet
                    open={isSheetOpen}
                    onOpenChange={(open) => {
                        setIsSheetOpen(open);
                        if (open) {
                            requestAnimationFrame(() => {
                                inputRef.current?.focus();
                            });
                        } else {
                            setShowSuggestions(false);
                            setSelectedIndex(-1);
                        }
                    }}
                >
                    {isSubmittingSearch && (
                        <div className="fixed inset-0 z-[80] bg-[#fbfaf7]/95 px-4 py-6 backdrop-blur-sm">
                            <div className="mx-auto flex min-h-full w-full max-w-[520px] flex-col justify-center">
                                <div className="overflow-hidden rounded-2xl border border-[#e5ded2] bg-white shadow-[0_28px_80px_rgba(34,28,20,0.16)]">
                                    <div className="h-1.5 overflow-hidden bg-[#ede7dc]">
                                        <div className="h-full w-1/2 animate-pulse rounded-r-full bg-primary" />
                                    </div>

                                    <div className="p-5 sm:px-6">
                                        <div className="flex items-start gap-4">
                                            <div className="flex size-11 shrink-0 items-center justify-center rounded-full bg-[#f4efe6] text-primary">
                                                <Icons.Search className="size-5" />
                                            </div>
                                            <div className="min-w-0 flex-1">
                                                <p className="text-[15px] font-semibold text-[#302a21]">
                                                    Finding the best matches
                                                </p>
                                                <p className="mt-1 truncate text-sm text-[#7b725f]">
                                                    {localSearch.trim()
                                                        ? `Searching "${localSearch.trim()}"`
                                                        : "Preparing your results"}
                                                </p>
                                            </div>
                                        </div>

                                        <div className="mt-6 grid grid-cols-3 gap-3">
                                            {[0, 1, 2].map((item) => (
                                                <div
                                                    key={item}
                                                    className="space-y-2"
                                                >
                                                    <div className="aspect-[3/4] animate-pulse rounded-lg bg-[#f0ece4]" />
                                                    <div className="h-2.5 animate-pulse rounded-full bg-[#ece6dc]" />
                                                    <div className="h-2 w-2/3 animate-pulse rounded-full bg-[#f2eee7]" />
                                                </div>
                                            ))}
                                        </div>

                                        <div className="mt-5 flex items-center justify-center gap-2 text-xs font-medium uppercase tracking-[0.14em] text-[#7b725f]">
                                            <Spinner className="size-3.5 text-primary" />
                                            Loading results
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    <SheetTrigger asChild>
                        <button
                            type="button"
                            aria-label="Open product search"
                            disabled={disabled}
                            className={cn(
                                "flex h-[42px] w-full items-center gap-3 rounded-xl border border-[#d9d1c1] bg-[#fcfbf7] px-4 text-sm text-[#766f61] shadow-[0_8px_24px_rgba(52,48,38,0.05)] transition-all hover:border-[#b7ac98] hover:bg-[#f8f5ee] hover:shadow-[0_10px_30px_rgba(52,48,38,0.08)] disabled:cursor-not-allowed disabled:opacity-70",
                                className,
                                classNames?.input
                            )}
                        >
                            <Icons.Search className="size-[18px] text-primary" />
                            <span className="flex-1 truncate text-left text-13 tracking-wide text-[#7d7567]">
                                Search for products, brands...
                            </span>
                        </button>
                    </SheetTrigger>

                    <SheetContent
                        forceMount
                        side="right"
                        onOpenAutoFocus={(event) => {
                            event.preventDefault();
                            requestAnimationFrame(() => {
                                inputRef.current?.focus();
                            });
                        }}
                        className="flex w-full flex-col border-l-0 bg-white p-0 shadow-[0_20px_60px_rgba(31,24,17,0.18)] data-[state=closed]:duration-200 data-[state=open]:duration-300 sm:max-w-[500px]"
                    >
                        <SheetHeader className="sr-only">
                            <SheetTitle>Search products</SheetTitle>
                        </SheetHeader>

                        {/* Premium Search Input Area */}
                        <div className="border-b border-[#ebe7df] bg-white px-6 pb-5 pt-12">
                            <div className="mb-4 pr-10">
                                <p className="text-11 font-bold uppercase tracking-[0.24em] text-[#7f745d]">
                                    Shop Search
                                </p>
                                <h2 className="mt-2 text-[22px] font-semibold tracking-[-0.03em] text-primary">
                                    Find the right piece faster
                                </h2>
                                <p className="mt-1 text-sm text-[#7b725f]">
                                    Search by product, category, occasion, or
                                    brand.
                                </p>
                            </div>
                            <div className="flex items-center gap-3 rounded-2xl border border-[#e4dfd5] bg-white px-4 py-3 shadow-[0_14px_34px_rgba(51,47,38,0.08)]">
                                <Icons.Search className="size-[20px] text-primary" />
                                <input
                                    ref={setRefs}
                                    type="text"
                                    className="flex h-10 w-full bg-transparent text-[17px] font-medium text-[#2f2a23] placeholder:text-[#9f9584] focus:outline-none"
                                    value={localSearch}
                                    onChange={handleChange}
                                    onKeyDown={handleKeyDown}
                                    placeholder="Search here..."
                                    autoComplete="off"
                                    disabled={isSubmittingSearch}
                                />

                                {isVoiceSupported && (
                                    <button
                                        type="button"
                                        className={cn(
                                            "rounded p-2 transition-colors",
                                            isListening
                                                ? "bg-red-100 text-red-600"
                                                : "text-[#8d8372] hover:text-primary"
                                        )}
                                        onClick={handleVoiceSearch}
                                        disabled={isSubmittingSearch}
                                    >
                                        <Icons.AudioWaveform className="size-5" />
                                    </button>
                                )}

                                {localSearch && (
                                    <button
                                        type="button"
                                        onClick={handleClear}
                                        disabled={isSubmittingSearch}
                                        className="p-2 disabled:opacity-50"
                                    >
                                        <Icons.X className="size-5 text-[#8d8372] hover:text-primary" />
                                    </button>
                                )}
                            </div>
                        </div>

                        {/* Premium Results Area */}
                        <div className="flex-1 overflow-y-auto px-6 py-8">
                            {(isFetchingSuggestions || isSubmittingSearch) && (
                                <div className="flex justify-center py-10">
                                    <Spinner className="size-6 text-gray-300 opacity-70" />
                                </div>
                            )}

                            {!isFetchingSuggestions &&
                                !isSubmittingSearch &&
                                localSearch.length > 2 &&
                                suggestions.length === 0 &&
                                products.length === 0 && (
                                    <div className="mt-10 text-center text-[15px] text-[#8c816f]">
                                        No results found for{" "}
                                        <span>&ldquo;{localSearch}&rdquo;</span>
                                    </div>
                                )}

                            {/* EMPTY STATE (DEFAULT VIEW) */}
                            {!isFetchingSuggestions &&
                                !isSubmittingSearch &&
                                localSearch.length < 2 && (
                                    <div className="space-y-12 pt-2 duration-500 animate-in fade-in slide-in-from-bottom-2">
                                        {recentSearches.length > 0 && (
                                            <div>
                                                <div className="mb-4 flex items-center gap-2 pl-1">
                                                    <Clock3 className="size-[15px] text-primary" />
                                                    <h3 className="text-11 font-bold uppercase tracking-[0.15em] text-primary">
                                                        Recent Searches
                                                    </h3>
                                                </div>
                                                <div className="flex flex-wrap gap-2.5">
                                                    {recentSearches.map(
                                                        (term) => (
                                                            <button
                                                                key={term}
                                                                onClick={() =>
                                                                    handleSuggestionClick(
                                                                        term
                                                                    )
                                                                }
                                                                className="rounded-full border border-[#e4dfd5] bg-white px-4 py-2.5 text-13 font-medium text-[#5d5649] transition-all hover:border-primary hover:bg-[#fafafa] hover:text-primary"
                                                            >
                                                                {term}
                                                            </button>
                                                        )
                                                    )}
                                                </div>
                                            </div>
                                        )}

                                        {/* Popular Searches */}
                                        <div>
                                            <div className="mb-4 flex items-center gap-2 pl-1">
                                                <TrendingUp className="size-[15px] text-primary" />
                                                <h3 className="text-11 font-bold uppercase tracking-[0.15em] text-primary">
                                                    Popular Searches
                                                </h3>
                                            </div>
                                            <div className="flex flex-wrap gap-2.5">
                                                {[
                                                    "Sarees",
                                                    "Dresses",
                                                    "Skincare",
                                                    "Home Decor",
                                                    "Gifts",
                                                    "Kurtas",
                                                ].map((term) => (
                                                    <button
                                                        key={term}
                                                        onClick={() =>
                                                            handleSuggestionClick(
                                                                term
                                                            )
                                                        }
                                                        className="rounded-full border border-[#e4dfd5] bg-white px-4 py-2.5 text-13 font-medium text-[#5f574a] shadow-sm transition-all hover:-translate-y-0.5 hover:border-primary hover:bg-[#fafafa] hover:text-primary hover:shadow-md"
                                                    >
                                                        {term}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>

                                        {/* Discover */}
                                        <div>
                                            <div className="mb-4 flex items-center gap-2 pl-1">
                                                <Sparkles className="size-[15px] text-primary" />
                                                <h3 className="text-11 font-bold uppercase tracking-[0.15em] text-primary">
                                                    Discover
                                                </h3>
                                            </div>
                                            <div className="flex flex-col gap-3">
                                                {discoverCategories.map(
                                                    (cat) => {
                                                        const Icon = cat.icon;
                                                        return (
                                                            <button
                                                                key={cat.title}
                                                                onClick={() => {
                                                                    pushSearchRoute(
                                                                        cat.link
                                                                    );
                                                                }}
                                                                className={cn(
                                                                    "p-4.5 group relative flex items-center justify-between overflow-hidden rounded-2xl border border-[#ebe7df] bg-white py-4 transition-all hover:border-[#d5cfc4] sm:py-5",
                                                                    cat.bg
                                                                )}
                                                            >
                                                                <div className="relative z-10 flex min-w-0 flex-1 items-center gap-2.5 pr-2 sm:gap-3">
                                                                    <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-white/75 shadow-sm backdrop-blur-sm transition-all group-hover:bg-white group-hover:shadow-md">
                                                                        <Icon
                                                                            className="size-[14px] text-[#5f574a] transition-colors group-hover:text-primary sm:size-[15px]"
                                                                            strokeWidth={
                                                                                2.5
                                                                            }
                                                                        />
                                                                    </div>
                                                                    <span className="line-clamp-2 text-left text-12 font-bold leading-snug tracking-wide text-[#342f27] transition-colors group-hover:text-primary sm:text-13">
                                                                        {
                                                                            cat.title
                                                                        }
                                                                    </span>
                                                                </div>
                                                                <ArrowRight className="relative z-10 size-4 shrink-0 text-[#8f8575] transition-all group-hover:translate-x-1 group-hover:text-primary" />

                                                                {/* Decorative subtle background icon */}
                                                                <Icon className="absolute -bottom-2 -right-2 size-12 rotate-12 text-black/[0.03] transition-transform duration-500 group-hover:-rotate-12 group-hover:scale-110" />
                                                            </button>
                                                        );
                                                    }
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                )}

                            {(suggestions.length > 0 || products.length > 0) &&
                                !isFetchingSuggestions &&
                                !isSubmittingSearch && (
                                    <div className="space-y-10">
                                        <div className="rounded-2xl border border-[#ebe7df] bg-white px-4 py-3 text-12 text-[#6a614f]">
                                            {products.length > 0
                                                ? `Showing ${products.length} quick matches for "${localSearch.trim()}"`
                                                : `Refining ideas for "${localSearch.trim()}"`}
                                        </div>

                                        {/* SUGGESTIONS */}
                                        {suggestions.length > 0 && (
                                            <div>
                                                <div className="mb-4 pl-1 text-11 font-bold uppercase tracking-widest text-[#8c816f]">
                                                    Suggestions
                                                </div>
                                                <div className="space-y-1">
                                                    {suggestions.map(
                                                        (suggestion, index) => (
                                                            <button
                                                                key={`${suggestion}-${index}`}
                                                                type="button"
                                                                className={cn(
                                                                    "flex w-full items-center gap-4 rounded-xl px-3 py-2.5 text-left transition-colors hover:bg-[#fafafa]",
                                                                    selectedIndex ===
                                                                        index &&
                                                                        "bg-[#fafafa]"
                                                                )}
                                                                onClick={() =>
                                                                    handleSuggestionClick(
                                                                        suggestion
                                                                    )
                                                                }
                                                                onMouseEnter={() =>
                                                                    setSelectedIndex(
                                                                        index
                                                                    )
                                                                }
                                                            >
                                                                <Icons.Search className="size-[15px] shrink-0 text-[#a4957c]" />
                                                                <span className="truncate text-[15px] font-medium tracking-wide text-[#534c40]">
                                                                    {suggestion}
                                                                </span>
                                                            </button>
                                                        )
                                                    )}
                                                </div>
                                            </div>
                                        )}

                                        {/* PRODUCTS */}
                                        {products.length > 0 && (
                                            <div>
                                                <div className="mb-4 pl-1 text-11 font-bold uppercase tracking-widest text-[#8c816f]">
                                                    Products
                                                </div>
                                                <div className="grid grid-cols-2 gap-x-4 gap-y-6">
                                                    {products.map((product) => (
                                                        <div
                                                            key={product.id}
                                                            onClick={() => {
                                                                pushSearchRoute(
                                                                    `/products/${product.slug || product.id}`
                                                                );
                                                            }}
                                                            className="group flex cursor-pointer gap-3 rounded-xl p-2 transition-colors hover:bg-[#fafafa]"
                                                        >
                                                            {product.media ? (
                                                                <div className="relative h-[85px] w-[75px] shrink-0 overflow-hidden rounded-[8px] bg-[#f7f7f7]">
                                                                    <img
                                                                        src={
                                                                            product
                                                                                .media
                                                                                .url
                                                                        }
                                                                        alt={
                                                                            product.name
                                                                        }
                                                                        className="size-full object-cover transition-transform duration-500 group-hover:scale-105"
                                                                    />
                                                                </div>
                                                            ) : (
                                                                <div className="h-[85px] w-[75px] shrink-0 rounded-[8px] border border-[#ebe7df] bg-[#f7f7f7]" />
                                                            )}
                                                            <div className="flex min-w-0 flex-1 flex-col pt-1">
                                                                {product.brand
                                                                    ?.name && (
                                                                    <span className="mb-1 truncate text-[10px] font-bold uppercase tracking-wider text-[#9a8e7d]">
                                                                        {
                                                                            product
                                                                                .brand
                                                                                .name
                                                                        }
                                                                    </span>
                                                                )}
                                                                <span className="line-clamp-2 text-13 font-medium leading-tight text-[#2f2a23] transition-colors group-hover:text-primary">
                                                                    {
                                                                        product.name
                                                                    }
                                                                </span>
                                                                <span className="mt-1.5 text-13 font-semibold text-primary">
                                                                    Rs.{" "}
                                                                    {(
                                                                        product.price /
                                                                        100
                                                                    ).toLocaleString(
                                                                        "en-IN"
                                                                    )}
                                                                </span>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                                <button
                                                    onClick={() =>
                                                        handleSearch()
                                                    }
                                                    className="mt-8 flex w-full items-center justify-center gap-2 rounded-xl bg-primary py-3.5 text-12 font-bold uppercase tracking-[0.15em] text-primary-foreground shadow-[0_16px_32px_rgba(49,58,31,0.24)] transition-all hover:brightness-95"
                                                >
                                                    See All Results
                                                    <svg
                                                        xmlns="http://www.w3.org/2000/svg"
                                                        width="14"
                                                        height="14"
                                                        viewBox="0 0 24 24"
                                                        fill="none"
                                                        stroke="currentColor"
                                                        strokeWidth="2.5"
                                                        strokeLinecap="round"
                                                        strokeLinejoin="round"
                                                    >
                                                        <path d="M5 12h14" />
                                                        <path d="m12 5 7 7-7 7" />
                                                    </svg>
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                )}
                        </div>
                        <div className="border-t border-[#ebe7df] bg-white px-6 py-4">
                            <div className="flex items-center justify-between gap-4">
                                <p className="text-xs text-[#7b725f]">
                                    Tip: try terms like &ldquo;saree&rdquo;,
                                    &ldquo;gift&rdquo;, or a brand name.
                                </p>
                                <SheetClose asChild>
                                    <button
                                        type="button"
                                        className="text-xs font-semibold uppercase tracking-[0.14em] text-primary transition-opacity hover:opacity-70"
                                    >
                                        Close
                                    </button>
                                </SheetClose>
                            </div>
                        </div>
                    </SheetContent>
                </Sheet>
            </div>
        );
    }
);

ProductSearch.displayName = "ProductSearch";
export { ProductSearch };
