"use client";

import { cn } from "@/lib/utils";
import { useRouter, useSearchParams } from "next/navigation";
import { useQueryState } from "nuqs";
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
        const [search] = useQueryState("search", {
            defaultValue: "",
        });
        const [localSearch, setLocalSearch] = useState(search);
        const hasMountedRef = React.useRef(false);
        const debounceTimerRef = React.useRef<ReturnType<
            typeof setTimeout
        > | null>(null);

        const updateSearch = useCallback(
            (value: string) => {
                if (value.length > 2) {
                    router.push(`/shop?search=${encodeURIComponent(value)}`);
                } else if (value.length === 0) {
                    // Preserve existing filters when page has no search param.
                    if (searchParams.get("search") !== null) {
                        router.push("/shop");
                    }
                } else {
                    return;
                }
            },
            [router, searchParams]
        );

        useEffect(() => {
            setLocalSearch(search);
        }, [search]);

        useEffect(() => {
            if (!hasMountedRef.current) {
                hasMountedRef.current = true;
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
