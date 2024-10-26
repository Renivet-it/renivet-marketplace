"use client";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import Image from "next/image";

interface PageProps extends GenericProps {
    product: {
        name: string;
        price: number;
        description: string;
        image: string;
    };
}

export function ProductCard({ className, product, ...props }: PageProps) {
    return (
        <div className={cn("space-y-4", className)} {...props}>
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
                    {Intl.NumberFormat("en-IN", {
                        style: "currency",
                        currency: "INR",
                    }).format(product.price)}
                </p>

                <p className="truncate text-sm text-muted-foreground">
                    {product.description}
                </p>
            </div>

            <Button variant="accent" className="font-semibold">
                Add to Cart
            </Button>
        </div>
    );
}
