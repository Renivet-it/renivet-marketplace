import { cn } from "@/lib/utils";

type NewProductBadgeProps = {
    className?: string;
    side?: "left" | "right";
    variant?: "corner" | "pill";
};

/** A right-side corner ribbon for products added in the last 30 days. */
export function NewProductBadge({
    className,
    side = "left",
    variant = "corner",
}: NewProductBadgeProps) {
    if (variant === "pill") {
        return (
            <span
                className={cn(
                    "pointer-events-none absolute inline-flex h-6 min-w-[60px] items-center justify-center bg-[linear-gradient(135deg,#315848_0%,#6d7447_100%)] px-2 pr-4 text-[10px] font-extrabold uppercase tracking-[0.1em] text-white shadow-[0_6px_14px_rgba(24,28,44,0.18)] [clip-path:polygon(0_0,100%_0,calc(100%-14px)_50%,100%_100%,0_100%)]",
                    className
                )}
            >
                New
            </span>
        );
    }

    return (
        <span
            className={cn(
                "pointer-events-none absolute flex size-[52px] items-start justify-start overflow-hidden bg-[linear-gradient(135deg,#315848_0%,#8d8150_100%)] text-white shadow-[0_10px_24px_rgba(24,28,44,0.22)] sm:size-[64px]",
                side === "left"
                    ? "[clip-path:polygon(0_0,100%_0,0_100%)]"
                    : "[clip-path:polygon(0_0,100%_0,100%_100%)]",
                className
            )}
        >
            <span
                className={cn(
                    "absolute text-[7px] font-extrabold uppercase tracking-[0.14em] sm:text-[8px]",
                    side === "left"
                        ? "left-2 top-2.5 -rotate-45 sm:left-2.5 sm:top-3"
                        : "right-2 top-2.5 rotate-45 sm:right-2.5 sm:top-3"
                )}
            >
                New
            </span>
        </span>
    );
}
