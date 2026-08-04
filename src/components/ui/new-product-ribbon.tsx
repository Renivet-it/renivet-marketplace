import { cn } from "@/lib/utils";
import { isNewProduct } from "@/lib/utils/new-product";
import Image from "next/image";

export function NewProductRibbon({
    product,
    className,
}: {
    product?: unknown;
    className?: string;
}) {
    if (!isNewProduct(product)) return null;

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
