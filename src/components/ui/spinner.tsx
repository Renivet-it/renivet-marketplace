import { cn } from "@/lib/utils";

export function Spinner({
    className,
    ...props
}: React.HTMLAttributes<HTMLDivElement>) {
    return (
        <div
            className={cn(
                "size-8 animate-spin rounded-full border-2 border-primary",
                className
            )}
            {...props}
        />
    );
}
