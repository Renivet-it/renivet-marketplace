import { cn } from "@/lib/utils";
import { HomeShopByCategory } from "@/lib/validations";
import Image from "next/image";
import Link from "next/link";

interface PageProps extends GenericProps {
    shopByCategories: HomeShopByCategory[];
    titleData?: { title: string };
}

export function ShopByNewCategories({
    className,
    shopByCategories,
    titleData,
    ...props
}: PageProps) {
    return (
        <section
            className={cn(
                "flex w-full justify-center py-4",
                className
            )}
            {...props}
        >
            <div className="w-full space-y-4">
                {/* Title */}
                <h2 className="text-center text-[20px] font-bold uppercase tracking-wide text-gray-800">
                    {titleData?.title || "Shop by Category"}
                </h2>

                {/* Horizontal Scrollable Categories */}
                <div className="scrollbar-hide grid auto-cols-[calc(33.333%-8px)] grid-flow-col gap-3 overflow-x-auto px-2 md:auto-cols-[150px]">
                    {shopByCategories.map((category, index) => (
                        <Link
                            key={index}
                            href={category.url || "/shop"}
                            className="block"
                        >
                            <div className="flex flex-col items-center bg-gray-50 rounded-md p-2 w-full">
                                {/* Image Container */}
                                <div className="overflow-hidden rounded-md w-full">
                                    <Image
                                        src={category.imageUrl}
                                        alt={category.title || "Category"}
                                        width={150}
                                        height={180}
                                        quality={85}
                                        className="h-[180px] w-full object-cover md:w-[150px]"
                                    />
                                </div>
                                {/* Category Title and Link */}
                                <div className="mt-3 text-center w-full">
                                    <p className="text-[14px] font-bold text-gray-800">
                                        {category.title || "Category"}
                                    </p>
                                    <p
                                        className={cn(
                                            "text-[12px] hover:underline",
                                            index === 0 ? "text-blue-600 font-semibold" : "text-gray-500"
                                        )}
                                    >
                                        {index === 0 ? "Shop Now!" : "Shop"}
                                    </p>
                                </div>
                            </div>
                        </Link>
                    ))}
                </div>
            </div>
        </section>
    );
}