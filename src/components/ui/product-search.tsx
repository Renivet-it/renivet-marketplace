"use client";
import { Spinner } from "@/components/ui/spinner";


import { trpc } from "@/lib/trpc/client";
import { cn } from "@/lib/utils";
import { useRouter, useSearchParams } from "next/navigation";
import { useQueryState } from "nuqs";
import * as React from "react";
import {
    Sheet,
    SheetContent,
    SheetTitle,
    SheetTrigger,
} from "@/components/ui/sheet";
import { useCallback, useEffect, useRef, useState } from "react";
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
    ({ className, disabled, classNames, ...props }, ref) => {
        const router = useRouter();
        const searchParams = useSearchParams();
        const [search] = useQueryState("search", {
            defaultValue: "",
        });

        const [localSearch, setLocalSearch] = useState(search);
        const [isSearching, setIsSearching] = useState(false);
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
                    const { fetchSuggestions, fetchSearchProducts } = await import(
                        "@/lib/python/ai-suggestion"
                    );
                    const [suggestionsResult, productsResult] = await Promise.all([
                        fetchSuggestions(localSearch),
                        fetchSearchProducts(localSearch)
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
                    router.push(`/shop?${params.toString()}`);
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
                router.push(query ? `/shop?${query}` : "/shop");
            },
            [router, searchParams]
        );

        // TRPC mutation for search processing
        const processSearchMutation =
            trpc.general.search.processSearch.useMutation({
                onSuccess: (result) => {
                    setIsSearching(false);
                    setShowSuggestions(false);
                    setIsSheetOpen(false);
                    navigateToShopWithSearch(result.originalQuery);
                },
                onError: (error) => {
                    setIsSearching(false);
                    console.error("Search error:", error);
                    setIsSheetOpen(false);
                    navigateToShopWithSearch(localSearch);
                },
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
            const searchQuery = (query || localSearch).trim();

            if (searchQuery.length > 2) {
                setIsSearching(true);
                setShowSuggestions(false);
                processSearchMutation.mutate({ query: searchQuery });
            } else if (searchQuery.length === 0) {
                navigateToShopWithSearch("");
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
            const SpeechRecognitionCtor =
                typeof window !== "undefined"
                    ? window.SpeechRecognition || window.webkitSpeechRecognition
                    : undefined;
            setIsVoiceSupported(!!SpeechRecognitionCtor);
        }, []);

        useEffect(() => {
            return () => {
                recognitionRef.current?.stop();
            };
        }, []);

        const handleVoiceSearch = () => {
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
            <div className={cn("relative w-full", classNames?.wrapper)}>
                <Sheet 
                    open={isSheetOpen} 
                    onOpenChange={(open) => {
                        setIsSheetOpen(open);
                        if (open) {
                            setTimeout(() => {
                                if (inputRef.current) inputRef.current.focus();
                            }, 100);
                        }
                    }}
                >
                    <SheetTrigger asChild>
                        <div
                            className={cn(
                                "flex h-[42px] w-full cursor-text items-center gap-3 rounded-md bg-[#f7f7f7] px-4 text-sm text-gray-500 transition-colors hover:bg-[#efefef] border border-transparent hover:border-gray-200",
                                className,
                                classNames?.input
                            )}
                        >
                            <Icons.Search className="size-[18px] text-gray-400" />
                            <span className="flex-1 truncate text-left text-[13px] tracking-wide text-gray-400">Search for products, brands...</span>
                        </div>
                    </SheetTrigger>
                    
                    <SheetContent side="right" className="w-full sm:max-w-[500px] border-l-0 p-0 shadow-2xl flex flex-col bg-white">
                        <SheetTitle className="sr-only">Search</SheetTitle>
                        
                        {/* Premium Search Input Area */}
                        <div className="flex items-center gap-3 border-b border-gray-100 bg-[#faf9f5] px-6 py-5">
                            <Icons.Search className="size-[20px] text-gray-400" />
                            <input
                                ref={setRefs}
                                type="text"
                                className="flex h-10 w-full bg-transparent text-[17px] font-medium text-gray-800 placeholder-gray-400 focus:outline-none"
                                value={localSearch}
                                onChange={handleChange}
                                onKeyDown={handleKeyDown}
                                placeholder="Search here..."
                                autoComplete="off"
                            />
                            
                            {isVoiceSupported && (
                                <button
                                    type="button"
                                    className={cn(
                                        "rounded p-2 transition-colors",
                                        isListening
                                            ? "bg-red-100 text-red-600"
                                            : "text-gray-400 hover:text-gray-700"
                                    )}
                                    onClick={handleVoiceSearch}
                                >
                                    <Icons.AudioWaveform className="size-5" />
                                </button>
                            )}

                            {localSearch && (
                                <button type="button" onClick={handleClear} className="p-2">
                                    <Icons.X className="size-5 text-gray-400 hover:text-gray-700" />
                                </button>
                            )}
                        </div>

                        {/* Premium Results Area */}
                        <div className="flex-1 overflow-y-auto px-6 py-8">
                             {isFetchingSuggestions && (
                                <div className="flex justify-center py-10"><Spinner className="size-6 text-gray-300 opacity-70" /></div>
                             )}
                             
                             {!isFetchingSuggestions && localSearch.length > 2 && suggestions.length === 0 && products.length === 0 && (
                                <div className="text-center text-[15px] text-gray-400 mt-10">No results found for "{localSearch}"</div>
                             )}
                             
                             {(suggestions.length > 0 || products.length > 0) && !isFetchingSuggestions && (
                                <div className="space-y-10">
                                    {/* SUGGESTIONS */}
                                    {suggestions.length > 0 && (
                                        <div>
                                            <div className="text-[11px] font-bold tracking-[0.1em] text-gray-400 uppercase mb-4 pl-1">Suggestions</div>
                                            <div className="space-y-1">
                                                {suggestions.map((suggestion, index) => (
                                                    <button
                                                        key={`${suggestion}-${index}`}
                                                        type="button"
                                                        className={cn(
                                                            "flex w-full items-center gap-4 rounded-md px-3 py-2.5 text-left transition-colors hover:bg-gray-50/80",
                                                            selectedIndex === index && "bg-gray-50/80"
                                                        )}
                                                        onClick={() => handleSuggestionClick(suggestion)}
                                                        onMouseEnter={() => setSelectedIndex(index)}
                                                    >
                                                        <Icons.Search className="size-[15px] shrink-0 text-gray-300" />
                                                        <span className="truncate text-[15px] text-gray-600 font-medium tracking-wide">
                                                            {suggestion}
                                                        </span>
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {/* PRODUCTS */}
                                    {products.length > 0 && (
                                        <div>
                                            <div className="text-[11px] font-bold tracking-[0.1em] text-gray-400 uppercase mb-4 pl-1">Products</div>
                                            <div className="grid grid-cols-2 gap-x-4 gap-y-6">
                                                {products.map((product) => (
                                                    <div
                                                        key={product.id}
                                                        onClick={() => {
                                                            setIsSheetOpen(false);
                                                            router.push(`/products/${product.slug || product.id}`);
                                                        }}
                                                        className="group flex gap-3 cursor-pointer p-1"
                                                    >
                                                        {product.media ? (
                                                            <div className="relative h-[85px] w-[75px] shrink-0 overflow-hidden rounded-[4px] bg-gray-50">
                                                                <img 
                                                                    src={product.media.url} 
                                                                    alt={product.name} 
                                                                    className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" 
                                                                />
                                                            </div>
                                                        ) : (
                                                            <div className="h-[85px] w-[75px] shrink-0 rounded-[4px] bg-gray-100 border border-gray-100" />
                                                        )}
                                                        <div className="flex flex-col flex-1 min-w-0 pt-1">
                                                            {product.brand?.name && (
                                                                <span className="text-[10px] font-bold tracking-wider text-gray-400 uppercase truncate mb-1">{product.brand.name}</span>
                                                            )}
                                                            <span className="text-[13px] font-medium text-gray-800 line-clamp-2 leading-tight group-hover:text-[#30453c] transition-colors">{product.name}</span>
                                                            <span className="text-[13px] font-semibold text-gray-900 mt-1.5">
                                                                ₹{(product.price / 100).toLocaleString("en-IN")}
                                                            </span>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                            <button
                                                onClick={() => handleSearch()}
                                                className="w-full mt-8 py-3.5 text-[12px] font-bold tracking-[0.15em] text-white bg-[#2a3c34] hover:bg-[#1a2520] transition-colors rounded-sm flex items-center justify-center gap-2 uppercase shadow-md"
                                            >
                                                See All Results
                                                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>
                                            </button>
                                        </div>
                                    )}
                                </div>
                             )}
                        </div>
                    </SheetContent>
                </Sheet>
            </div>
        );
    }
);

ProductSearch.displayName = "ProductSearch";
export { ProductSearch };
