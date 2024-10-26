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
            className={cn(
                "flex justify-center px-4 py-5 md:px-8 md:py-10",
                className
            )}
            {...props}
        >
            <div className="w-full max-w-5xl space-y-5 md:space-y-10 xl:max-w-[100rem]">
                <div className="flex items-center justify-center gap-4">
                    <h2 className="text-2xl font-semibold uppercase md:text-3xl">
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
                        className="w-full min-w-40 border-accent font-semibold text-accent md:w-min"
                        size="lg"
                        asChild
                    >
                        <Link href="/products">View All</Link>
                    </Button>
                </div>
            </div>
        </section>
    );
}
