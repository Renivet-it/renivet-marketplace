import { cn } from "@/lib/utils";
import { addMonths } from "date-fns";
import Image from "next/image";

const NEW_PRODUCT_ELIGIBILITY_START = new Date("2026-07-01T00:00:00+05:30");

function isRecentlyCreated(product: unknown) {
    if (!product || typeof product !== "object") return false;

    const { createdAt: createdAtValue, publishedAt } = product as {
        publishedAt?: Date | string | number | null;
        createdAt?: Date | string | number;
    };
    const newListingDate = createdAtValue ?? publishedAt;
    const createdAt =
        newListingDate instanceof Date
            ? newListingDate
            : new Date(newListingDate ?? "");

    if (Number.isNaN(createdAt.getTime())) return false;

    const now = new Date();
    const expiresAt = addMonths(createdAt, 2);

    return (
        createdAt >= NEW_PRODUCT_ELIGIBILITY_START &&
        createdAt <= now &&
        now < expiresAt
    );
}

export function NewProductRibbon({
    product,
    className,
}: {
    product?: unknown;
    className?: string;
}) {
    if (!isRecentlyCreated(product)) return null;

    return (
        <span
            aria-label="New product"
            className={cn(
                "pointer-events-none absolute left-0 top-0 z-20 block h-[55px] w-[60px] overflow-hidden bg-[linear-gradient(135deg,#355247_0%,#536048_52%,#726e49_100%)] [clip-path:polygon(0_0,100%_0,0_100%)]",
                className
            )}
        >
            <Image
                src="/assets/product-tags/new-ribbon.png"
                alt=""
                width={1504}
                height={1371}
                className="size-full object-fill"
            />
        </span>
    );
}
