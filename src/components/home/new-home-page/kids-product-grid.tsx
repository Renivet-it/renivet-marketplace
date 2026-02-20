"use client";

import { Icons } from "@/components/icons";
import { useGuestWishlist } from "@/lib/hooks/useGuestWishlist";
import { trpc } from "@/lib/trpc/client";
import { cn, convertPaiseToRupees } from "@/lib/utils";
import Image from "next/image";
import Link from "next/link";
import { toast } from "sonner";

interface Product {
    slug: any;
    id: string;
    media: { mediaItem: { url: string } }[];
    title: string;
    variants?: { price: number }[];
    price?: number;
    brand?: { name: string };
}

interface ProductGridProps extends React.HTMLAttributes<HTMLDivElement> {
    products: { product: Product }[];
    title?: string;
    userId?: string;
}

export function ProductGrid({
    className,
    products,
    title = "Gentle on Skin. Kinder to Earth",
    userId,
    ...props
}: ProductGridProps) {
    if (!products || !Array.isArray(products)) return null;

    const { addToGuestWishlist } = useGuestWishlist();

    const { mutateAsync: addToWishlist } =
        trpc.general.users.wishlist.addProductInWishlist.useMutation({
            onSuccess: () => toast.success("Added to Wishlist!"),
            onError: (err) =>
                toast.error(err.message || "Could not add to wishlist."),
        });

    return (
        <div className={cn("bg-[#FCFBF4] py-8", className)} {...props}>
            <div className="mx-auto max-w-screen-2xl px-6">
                {/* Header */}
                <h2 className="mb-6 text-center font-playfair text-[18px] font-[400] leading-[1.3] tracking-[0.5px] text-[#7A6338] md:text-[26px]">
                    {title}
                </h2>

                {/* 🚀 UNIVERSAL CAROUSEL */}
                <div className="scrollbar-hide overflow-x-auto pb-3">
                    <div className="flex w-max gap-4">
                        {products.map(({ product }) => {
                            const price = convertPaiseToRupees(
                                product.variants?.[0]?.price ||
                                    product.price ||
                                    0
                            );

                            const imageUrl =
                                product.media[0]?.mediaItem?.url ||
                                "https://4o4vm2cu6g.ufs.sh/f/HtysHtJpctzNNQhfcW4g0rgXZuWwadPABUqnljV5RbJMFsx1";

                            const handleWishlist = async (
                                e: React.MouseEvent<HTMLButtonElement>
                            ) => {
                                e.preventDefault();
                                e.stopPropagation();

                                if (userId) {
                                    await addToWishlist({
                                        productId: product.id,
                                    });
                                } else {
                                    addToGuestWishlist({
                                        productId: product.id,
                                        variantId: null,
                                        title: product.title,
                                        brand: product.brand?.name,
                                        price,
                                        image: imageUrl,
                                        sku: null,
                                        fullProduct: product,
                                    });
                                    toast.success("Added to Wishlist!");
                                }
                            };

                            return (
                                <div
                                    key={product.id}
                                    className="relative w-[90px] flex-shrink-0 sm:w-[120px] md:w-[150px]"
                                >
                                    <Link href={`/products/${product.slug}`}>
                                        {/* IMAGE */}
                                        <div className="relative h-[120px] w-full overflow-hidden bg-white sm:h-[160px] md:h-[200px]">
                                            <Image
                                                src={imageUrl}
                                                alt={product.title}
                                                fill
                                                sizes="(max-width: 640px) 90px, (max-width: 768px) 120px, 150px"
                                                className="object-cover"
                                            />

                                            {/* ❤️ WISHLIST */}
                                            <button
                                                onClick={handleWishlist}
                                                className="absolute right-2 top-2 z-10 flex h-7 w-7 items-center justify-center rounded-full bg-white/90 shadow transition hover:bg-black hover:text-white"
                                            >
                                                <Icons.Heart className="h-3.5 w-3.5" />
                                            </button>
                                        </div>

                                        {/* TITLE */}
                                        <h3 className="mt-2 line-clamp-2 text-[11px] font-medium text-gray-800 sm:text-xs md:text-sm">
                                            {product.title}
                                        </h3>

                                        {/* PRICE */}
                                        <p className="text-xs font-semibold text-gray-900 md:text-sm">
                                            ₹{price}
                                        </p>
                                    </Link>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>
        </div>
    );
}
