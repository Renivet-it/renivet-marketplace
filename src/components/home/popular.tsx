import { Button } from "@/components/ui/button-general";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { Suspense } from "react";
import { ProductShowcaseCard } from "../globals/cards";
import { Skeleton } from "../ui/skeleton";

const dummyProducts = [
    {
        id: 1,
        name: "Candles",
        price: 49,
        description: "Scented Candles with Wooden Wick",
        image: "https://utfs.io/a/758cbqh2wo/E02w8qhSRFZnM4ZiYYdNari256c8ReoWJUD0Pyg3ZdX7Yqpb",
    },
    {
        id: 2,
        name: "Handbags",
        price: 149,
        description: "Leather Handbag with Gold Chain",
        image: "https://utfs.io/a/758cbqh2wo/E02w8qhSRFZnFVbaaKeUpgOqIWc15MXSjve3Q7xDhftJ6Zad",
    },
    {
        id: 3,
        name: "Dresses",
        price: 649,
        description: "Floral Print Maxi Dress with Belt",
        image: "https://utfs.io/a/758cbqh2wo/E02w8qhSRFZnr4p6JQzIG4SFbfdRA720aKEDHgcCUhY1XZBJ",
    },
    {
        id: 4,
        name: "T-Shirts",
        price: 1249,
        description: "Organic Cotton T-Shirt with Embroidered Logo",
        image: "https://utfs.io/a/758cbqh2wo/E02w8qhSRFZnVK7JfNl80TM4AsehRfmtqSxKLIbUCcJay9gN",
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
                <h2 className="text-balance text-center text-2xl font-semibold uppercase md:text-3xl">
                    {title}
                </h2>

                <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
                    <Suspense
                        fallback={Array.from({ length: 4 }).map((_, index) => (
                            <Skeleton key={index} className="h-20 w-full" />
                        ))}
                    >
                        {dummyProducts.reverse().map((product) => (
                            <ProductShowcaseCard
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
                        <Link href="/shop">View All</Link>
                    </Button>
                </div>
            </div>
        </section>
    );
}
