import { Input } from "@/components/ui/input-dash";
import { cn } from "@/lib/utils";
import * as React from "react";

interface PriceInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
    symbol?: string;
    currency?: string;
}

export default function PriceInput({
    symbol,
    currency,
    className,
    ...props
}: PriceInputProps) {
    return (
        <div className="relative flex w-full rounded-lg shadow-sm shadow-black/5">
            <span className="pointer-events-none absolute inset-y-0 start-0 flex items-center justify-center ps-3 text-sm text-muted-foreground">
                {symbol ?? "€"}
            </span>

            <Input
                className={cn(
                    "-me-px rounded-e-none ps-6 shadow-none",
                    className
                )}
                placeholder="0.00"
                type="text"
                {...props}
            />

            <span className="inline-flex items-center rounded-e-lg border border-input bg-background px-3 text-sm text-muted-foreground">
                {currency ?? "EUR"}
            </span>
        </div>
    );
}
