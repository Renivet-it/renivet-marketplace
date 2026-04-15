"use client";

import { cn } from "@/lib/utils";
import { useRouter, useSearchParams } from "next/navigation";
import * as React from "react";
import { useCallback, useEffect, useState } from "react";
import { Icons } from "../icons";

export type InputProps = React.InputHTMLAttributes<HTMLInputElement> & {
    classNames?: {
        wrapper?: string;
        input?: string;
    };
};

const SearchInput = React.forwardRef<HTMLInputElement, InputProps>(
    ({ className, disabled, type = "search", classNames, ...props }, ref) => {
        const router = useRouter();
        const searchParams = useSearchParams();
        const searchFromUrl = searchParams.get("search") ?? "";
        const [localSearch, setLocalSearch] = useState(searchFromUrl);
        const hasMountedRef = React.useRef(false);
        const skipNextUpdateRef = React.useRef(false);
        const debounceTimerRef = React.useRef<ReturnType<
            typeof setTimeout
        > | null>(null);

        const updateSearch = useCallback(
            (value: string) => {
                const baseEntries = Array.from(searchParams.entries()).filter(
                    ([key]) => key !== "search" && key !== "page"
                );

                if (value.length > 2) {
                    const params = new URLSearchParams(baseEntries);
                    params.set("search", value);
                    // New search should begin from first page.
                    params.set("page", "1");
                    router.push(`/shop?${params.toString()}`);
                } else if (value.length === 0) {
                    if (searchParams.get("search") !== null) {
                        const params = new URLSearchParams(baseEntries);
                        params.set("page", "1");
                        const nextQuery = params.toString();
                        router.push(nextQuery ? `/shop?${nextQuery}` : "/shop");
                    }
                } else {
                    return;
                }
            },
            [router, searchParams]
        );

        useEffect(() => {
            skipNextUpdateRef.current = true;
            setLocalSearch(searchFromUrl);
        }, [searchFromUrl]);

        useEffect(() => {
            if (!hasMountedRef.current) {
                hasMountedRef.current = true;
                return;
            }
            if (skipNextUpdateRef.current) {
                skipNextUpdateRef.current = false;
                return;
            }

            if (debounceTimerRef.current) {
                clearTimeout(debounceTimerRef.current);
            }

            debounceTimerRef.current = setTimeout(() => {
                updateSearch(localSearch);
            }, 500);

            return () => {
                if (debounceTimerRef.current) {
                    clearTimeout(debounceTimerRef.current);
                }
            };
        }, [localSearch, updateSearch]);

        const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
            setLocalSearch(e.target.value);
        };

        const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
            if (e.key === "Enter") {
                if (debounceTimerRef.current) {
                    clearTimeout(debounceTimerRef.current);
                }
                updateSearch(localSearch);
            }
            if (e.key === "Backspace" && localSearch.length <= 1) {
                setLocalSearch("");
            }
        };

        return (
            <div
                className={cn(
                    "flex w-full items-center gap-1 border border-input bg-background",
                    disabled && "cursor-not-allowed opacity-50",
                    classNames?.wrapper
                )}
            >
                <div className="p-2 pl-3">
                    <Icons.Search className="size-5" />
                </div>

                <input
                    type={type}
                    className={cn(
                        "flex h-10 w-full bg-transparent pr-3 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50",
                        className,
                        classNames?.input
                    )}
                    disabled={disabled}
                    ref={ref}
                    value={localSearch}
                    onChange={handleChange}
                    onKeyDown={handleKeyDown}
                    {...props}
                />
            </div>
        );
    }
);

SearchInput.displayName = "SearchInput";
export { SearchInput };
