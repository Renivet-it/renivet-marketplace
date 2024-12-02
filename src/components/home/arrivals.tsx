import { Button } from "@/components/ui/button-general";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { Suspense } from "react";
import { ProductShowcaseCard } from "../globals/cards";
import { Skeleton } from "../ui/skeleton";

const dummyProducts = [
    {
        id: 1,
        name: "Tote Bags",
        price: 1249,
        description: "Leather Tote Bag with Gold Chain",
        image: "https://utfs.io/a/758cbqh2wo/E02w8qhSRFZnorNcINvXBYvar8fi13IDLNAzQMbyucG0lj4t",
    },
    {
        id: 2,
        name: "Waistcoats",
        price: 1349,
        description: "Leather Waistcoat with Gold Chain",
        image: "https://utfs.io/a/758cbqh2wo/E02w8qhSRFZnlSZkhEHdy3cIoDNiMsOAgx4PfaSnXJpkKjEL",
    },
    {
        id: 3,
        name: "Shirts",
        price: 1449,
        description: "Floral Print Shirt with Belt",
        image: "https://utfs.io/a/758cbqh2wo/E02w8qhSRFZnFmUQEReUpgOqIWc15MXSjve3Q7xDhftJ6Zad",
    },
    {
        id: 4,
        name: "Co-ords",
        price: 1549,
        description: "Organic Cotton Co-ords with Embroidered Logo",
        image: "https://utfs.io/a/758cbqh2wo/E02w8qhSRFZneSlV5TAhL7pEgDy5OrGIzuiMZxmk9vWQtUF1",
    },
];

interface PageProps extends GenericProps {
    title: string;
}

export function Arrivals({ title, className, ...props }: PageProps) {
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
                        {dummyProducts.map((product) => (
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
                        <Link href="/products">View All</Link>
                    </Button>
                </div>
            </div>
        </section>
    );
}
