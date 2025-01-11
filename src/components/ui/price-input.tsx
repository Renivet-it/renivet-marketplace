import { Input } from "@/components/ui/input-dash";
import { cn } from "@/lib/utils";
import * as React from "react";

interface PriceInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
    currency?: string;
}

export default function PriceInput({
    currency,
    className,
    ...props
}: PriceInputProps) {
    return (
        <div className="relative flex w-full rounded-lg shadow-sm shadow-black/5">
            <Input
                className={cn("-me-px rounded-e-none shadow-none", className)}
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
