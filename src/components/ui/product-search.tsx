"use client";

import { cn } from "@/lib/utils";
import { usePathname, useRouter } from "next/navigation";
import { useQueryState } from "nuqs";
import * as React from "react";
import { useCallback, useEffect, useState } from "react";
import { Icons } from "../icons";
import { fetchSuggestions } from "@/lib/python/ai-suggestion";

export type InputProps = React.InputHTMLAttributes<HTMLInputElement> & {
    classNames?: {
        wrapper?: string;
        input?: string;
    };
};

const ProductSearch = React.forwardRef<HTMLInputElement, InputProps>(
    ({ className, disabled, type = "text", classNames, ...props }, ref) => {
        const router = useRouter();
        const pathname = usePathname();
        const [search, setSearch] = useQueryState("search", {
            defaultValue: "",
        });
        const [localSearch, setLocalSearch] = useState(search);
        const [suggestions, setSuggestions] = useState<string[]>([]);
        const [isSuggestionVisible, setIsSuggestionVisible] = useState(false);

        // Fetch AI-driven suggestions using the new function
        const updateSuggestions = useCallback(async (value: string) => {
            if (value.length > 0) {
                try {
                    console.log("Fetching suggestions for:", value);
                    const fetchedSuggestions = await fetchSuggestions(value);
                    setSuggestions(fetchedSuggestions);
                    setIsSuggestionVisible(true);
                } catch (error) {
                    console.error("Failed to update suggestions:", error);
                    setSuggestions([]);
                    setIsSuggestionVisible(false);
                }
            } else {
                setSuggestions([]);
                setIsSuggestionVisible(false);
            }
        }, []);

        // Handle search submission (on Enter or suggestion click)
        const handleSearch = (value: string) => {
            setIsSuggestionVisible(false);
            if (value.length > 2) {
                if (pathname !== "/shop") {
                    router.push(`/shop?search=${encodeURIComponent(value)}`);
                } else {
                    setSearch(value);
                }
            } else if (value.length === 0) {
                if (pathname !== "/shop") {
                    router.push("/shop");
                } else {
                    setSearch("");
                }
            }
        };

        // Handle input change to update suggestions
        const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
            const value = e.target.value;
            setLocalSearch(value);
            updateSuggestions(value);
        };

        // Handle suggestion click and close dropdown
        const handleSuggestionClick = (suggestion: string) => {
            setLocalSearch(suggestion);
            setIsSuggestionVisible(false); // Close dropdown after selecting a suggestion
            handleSearch(suggestion);
        };

        // Handle Enter key to trigger search and close dropdown
        const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
            if (e.key === "Enter") {
                handleSearch(localSearch);
                setIsSuggestionVisible(false);
            } else if (e.key === "Escape") {
                setIsSuggestionVisible(false);
            }
        };

        // Handle clear button click
        const handleClear = () => {
            setLocalSearch("");
            setSuggestions([]);
            setIsSuggestionVisible(false);
            if (pathname !== "/shop") {
                router.push("/shop");
            } else {
                setSearch("");
            }
        };

        // Hide suggestions when clicking outside
        useEffect(() => {
            const handleClickOutside = () => {
                setIsSuggestionVisible(false);
            };
            document.addEventListener("click", handleClickOutside);
            return () => {
                document.removeEventListener("click", handleClickOutside);
            };
        }, []);

        // Sync localSearch with URL search param on page load
        useEffect(() => {
            setLocalSearch(search);
            updateSuggestions(search);
        }, [search]);

        return (
            <div
                className={cn(
                    "relative flex w-full items-center gap-1 border border-foreground/40",
                    disabled && "cursor-not-allowed opacity-50",
                    classNames?.wrapper
                )}
                onClick={(e) => e.stopPropagation()}
            >
                <div className="p-2 pl-3">
                    <Icons.Search className="size-5 opacity-60" />
                </div>

                <input
                    type="text"
                    className={cn(
                        "flex h-9 w-full bg-transparent pr-10 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50",
                        className,
                        classNames?.input
                    )}
                    disabled={disabled}
                    ref={ref}
                    value={localSearch}
                    onChange={handleChange}
                    onKeyDown={handleKeyDown}
                    onFocus={() => updateSuggestions(localSearch)}
                    placeholder="Search for products..."
                    {...props}
                />

                {/* Clear Button (Cross) */}
                {localSearch && (
                    <button
                        type="button"
                        className="absolute right-2 p-1"
                        onClick={handleClear}
                        aria-label="Clear search"
                    >
                        <Icons.X className="size-5 opacity-60 hover:opacity-100" />
                    </button>
                )}

                {/* Suggestions Dropdown */}
                {isSuggestionVisible && suggestions.length > 0 && (
                    <ul className="absolute top-full left-0 mt-1 w-full bg-white border border-foreground/20 rounded-md shadow-lg z-10 max-h-80 overflow-y-auto">
                        {suggestions.map((suggestion, index) => (
                            <li
                                key={index}
                                className="px-4 py-2 hover:bg-gray-100 cursor-pointer text-sm"
                                onClick={() => handleSuggestionClick(suggestion)}
                            >
                                {suggestion}
                            </li>
                        ))}
                    </ul>
                )}
            </div>
        );
    }
);

ProductSearch.displayName = "ProductSearch";
export { ProductSearch };