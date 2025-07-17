import { cn } from "@/lib/utils";
import { HomeShopByCategory } from "@/lib/validations";
import Image from "next/image";
import Link from "next/link";

interface PageProps extends GenericProps {
    shopByCategories: HomeShopByCategory[];
    titleData?: { title: string };
}

export function ShopByCategories({
    className,
    shopByCategories,
    titleData,
    ...props
}: PageProps) {
    return (
        <section
            className={cn(
                "bg-[#F4F0EC] flex w-full justify-center py-5 md:px-8 md:py-10",
                className
            )}
            {...props}
        >
            <div className="w-full max-w-5xl space-y-5 xl:max-w-[100rem]">
                <h2 className="mb-6 text-center text-4xl font-semibold capitalize tracking-tight text-accent">
                    {titleData?.title || "Shop by Category"}
                </h2>

                <div className="scrollbar-hide grid auto-cols-[40%] grid-flow-col grid-rows-2 gap-3 overflow-x-auto sm:hidden">
                    {shopByCategories.map((category, index) => (
                        <Link
                            key={index}
                            href={category.url || "/shop"}
                            className="block"
                        >
                            <div className="overflow-hidden rounded-lg shadow-sm">
                                <Image
                                    src={category.imageUrl}
                                    alt="Category"
                                    width={300} // optional: to match the ratio better
                                    height={400}
                                    quality={90}
                                    className="max-h-full max-w-full object-contain"
                                />
                            </div>
                        </Link>
                    ))}
                </div>

                {/* Desktop - Grid Layout */}
                <div className="hidden grid-cols-2 gap-4 sm:grid sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
                    {shopByCategories.map((category, index) => (
                        <Link
                            key={index}
                            href={category.url || "/shop"}
                            className="block"
                        >
                            <div className="overflow-hidden rounded-lg shadow-sm">
                                <Image
                                    src={category.imageUrl}
                                    alt="Category"
                                    width={300} // optional: to match the ratio better
                                    height={400}
                                    quality={90}
                                    className="max-h-full max-w-full object-contain"
                                />
                            </div>
                        </Link>
                    ))}
                </div>
            </div>
        </section>
    );
}
