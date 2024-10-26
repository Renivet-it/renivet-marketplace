import { cn } from "@/lib/utils";
import * as React from "react";
import { Icons } from "../icons";

export type InputProps = React.InputHTMLAttributes<HTMLInputElement> & {
    classNames?: {
        wrapper?: string;
        input?: string;
    };
};

const SearchInput = React.forwardRef<HTMLInputElement, InputProps>(
    ({ className, disabled, type = "search", classNames, ...props }, ref) => {
        return (
            <div
                className={cn(
                    "flex items-center gap-1 border border-input bg-background",
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
                        "flex h-10 w-full bg-transparent text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50",
                        className,
                        classNames?.input
                    )}
                    disabled={disabled}
                    ref={ref}
                    {...props}
                />
            </div>
        );
    }
);
SearchInput.displayName = "SearchInput";

export { SearchInput };
