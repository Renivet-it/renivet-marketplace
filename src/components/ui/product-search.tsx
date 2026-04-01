"use client";
import { Spinner } from "@/components/ui/spinner";


import { trpc } from "@/lib/trpc/client";
import { cn } from "@/lib/utils";
import { useRouter } from "next/navigation";
import { useQueryState } from "nuqs";
import * as React from "react";
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
        const [isFetchingSuggestions, setIsFetchingSuggestions] =
            useState(false);

        // Fetch suggestions when search term changes
        useEffect(() => {
            const fetchAISuggestions = async () => {
                if (localSearch.length < 2) {
                    setSuggestions([]);
                    return;
                }

                setIsFetchingSuggestions(true);
                try {
                    const { fetchSuggestions } = await import(
                        "@/lib/python/ai-suggestion"
                    );
                    const results = await fetchSuggestions(localSearch);
                    if (Array.isArray(results)) {
                        setSuggestions(results);
                    }
                } catch (error) {
                    console.error("Error fetching suggestions:", error);
                    setSuggestions([]);
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
                if (nextSearch.length > 0) {
                    router.push(
                        `/shop?search=${encodeURIComponent(nextSearch)}`
                    );
                    return;
                }
                router.push("/shop");
            },
            [router]
        );

        // TRPC mutation for search processing
        const processSearchMutation =
            trpc.general.search.processSearch.useMutation({
                onSuccess: (result) => {
                    setIsSearching(false);
                    setShowSuggestions(false);
                    navigateToShopWithSearch(result.originalQuery);
                },
                onError: (error) => {
                    setIsSearching(false);
                    console.error("Search error:", error);
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
            setShowSuggestions(false);
            navigateToShopWithSearch("");
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
                            <Spinner className="size-5 animate-spin opacity-60" />
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

                    <div className="absolute right-2 flex items-center gap-1">
                        {isVoiceSupported && (
                            <button
                                type="button"
                                className={cn(
                                    "rounded p-1 transition-colors",
                                    isListening
                                        ? "bg-red-100 text-red-600"
                                        : "text-gray-500 hover:text-gray-700"
                                )}
                                onClick={handleVoiceSearch}
                                disabled={disabled || isSearching}
                                aria-label={
                                    isListening
                                        ? "Stop voice search"
                                        : "Start voice search"
                                }
                                title={
                                    isListening
                                        ? "Stop voice search"
                                        : "Search by voice"
                                }
                            >
                                <Icons.AudioWaveform className="size-5" />
                            </button>
                        )}

                        {localSearch && !isSearching && (
                            <button
                                type="button"
                                className="p-1"
                                onClick={handleClear}
                                aria-label="Clear search"
                            >
                                <Icons.X className="size-5 opacity-60 hover:opacity-100" />
                            </button>
                        )}
                    </div>
                </div>

                {/* Suggestions Dropdown - Myntra Style */}
                {showSuggestions && suggestions.length > 0 && (
                    <div className="absolute left-0 right-0 top-full z-50 mt-1 max-h-80 overflow-auto rounded-md border border-gray-200 bg-white shadow-lg">
                        {suggestions.map((suggestion, index) => (
                            <button
                                key={`${suggestion}-${index}`}
                                type="button"
                                className={cn(
                                    "flex w-full cursor-pointer select-none items-center gap-3 px-4 py-2.5 text-left transition-colors hover:bg-gray-50",
                                    selectedIndex === index && "bg-gray-100"
                                )}
                                style={{ userSelect: "none" }}
                                onClick={() => {
                                    handleSuggestionClick(suggestion);
                                }}
                                onMouseDown={(e) => e.preventDefault()}
                                onMouseEnter={() => setSelectedIndex(index)}
                            >
                                <Icons.Search className="pointer-events-none size-4 shrink-0 text-gray-400" />
                                <span
                                    className="pointer-events-none flex-1 select-none truncate text-sm text-gray-700"
                                    style={{ userSelect: "none" }}
                                >
                                    {suggestion}
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
