"use client";

import { Button } from "@/components/ui/button-general";
import { cn, formatPriceTag } from "@/lib/utils";
import Image from "next/image";
import Link from "next/link";

interface PageProps extends GenericProps {
    product: {
        name: string;
        price: number;
        description: string;
        image: string;
    };
}

export function ProductShowcaseCard({
    className,
    product,
    ...props
}: PageProps) {
    return (
        <div className={cn("space-y-4", className)} {...props}>
            <Link href="/shop" className="space-y-4">
                <div className="h-80 xl:h-[30rem]">
                    <Image
                        width={1000}
                        height={1000}
                        src={product.image}
                        alt={product.name}
                        className="size-full object-cover"
                    />
                </div>

                <div className="flex flex-col">
                    <h3 className="text-md font-semibold uppercase">
                        {product.name}
                    </h3>

                    <p className="mb-1 text-sm font-semibold">
                        {formatPriceTag(product.price, true)}
                    </p>

                    <p className="truncate text-sm text-muted-foreground">
                        {product.description}
                    </p>
                </div>
            </Link>

            <Button variant="accent" className="font-semibold" asChild>
                <Link href="/shop">Add to Cart</Link>
            </Button>
        </div>
    );
}
