import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { Suspense } from "react";
import { ProductCard } from "../globals/cards";
import { Skeleton } from "../ui/skeleton";

const dummyProducts = [
    {
        id: 1,
        name: "CULT GAIA",
        price: 49.0,
        description: "Women Lou Top Handle Handbag Limited Edition",
        image: "/images/popular1.jpeg",
    },
    {
        id: 2,
        name: "DIESEL",
        price: 149.0,
        description: "Unisex Auwt-Reinhold-Wt04 Regular Graphic Jacket",
        image: "/images/popular2.jpeg",
    },
    {
        id: 3,
        name: "VERSACE",
        price: 2249.0,
        description: "La Coupe des Versace Dieux Reversible Zip Jumper",
        image: "/images/popular3.jpeg",
    },
    {
        id: 4,
        name: "GIORGIO ARMANI",
        price: 2349.0,
        description:
            "Allover Logo Print Blouson Jacket with Designer Embroidary",
        image: "/images/popular4.jpeg",
    },
];

interface PageProps extends GenericProps {
    title: string;
}

export function Popular({ title, className, ...props }: PageProps) {
    return (
        <section
            className={cn("flex justify-center py-5 md:py-10", className)}
            {...props}
        >
            <div className="w-full max-w-[100rem] space-y-10 px-8 xl:px-4">
                <div className="flex items-center justify-center gap-4">
                    <h2 className="text-3xl font-semibold uppercase">
                        {title}
                    </h2>
                </div>

                <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
                    <Suspense
                        fallback={Array.from({ length: 4 }).map((_, index) => (
                            <Skeleton key={index} className="h-20 w-full" />
                        ))}
                    >
                        {dummyProducts.map((product) => (
                            <ProductCard
                                key={product.id}
                                product={product}
                                className="flex flex-col"
                            />
                        ))}
                    </Suspense>
                </div>

                <div className="flex items-center justify-center">
                    <Button
                        variant="outline"
                        className="min-w-40 rounded-none border-accent"
                        size="lg"
                        asChild
                    >
                        <Link
                            href="/products"
                            className="text-lg font-semibold text-accent"
                        >
                            View All
                        </Link>
                    </Button>
                </div>
            </div>
        </section>
    );
}
