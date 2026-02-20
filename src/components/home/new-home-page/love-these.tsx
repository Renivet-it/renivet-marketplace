"use client";

import { Icons } from "@/components/icons";
import { useGuestWishlist } from "@/lib/hooks/useGuestWishlist";
import { trpc } from "@/lib/trpc/client";
import { convertPaiseToRupees } from "@/lib/utils";
import { Banner } from "@/lib/validations";
import Image from "next/image";
import Link from "next/link";
import { toast } from "sonner";

const PLACEHOLDER_IMAGE_URL =
    "https://4o4vm2cu6g.ufs.sh/f/HtysHtJpctzNNQhfcW4g0rgXZuWwadPABUqnljV5RbJMFsx1";

export const ProductCard = ({
    banner,
    userId,
}: {
    banner: Banner;
    userId?: string;
}) => {
    const { product } = banner;
    if (!product) return null;

    const { addToGuestWishlist } = useGuestWishlist();

    const { mutateAsync: addToWishlist } =
        trpc.general.users.wishlist.addProductInWishlist.useMutation({
            onSuccess: () => toast.success("Added to Wishlist!"),
            onError: (err) =>
                toast.error(err.message || "Could not add to wishlist."),
        });

    const price = convertPaiseToRupees(
        product.variants?.[0]?.price ?? product.price ?? 0
    );

    const imageUrl =
        product.media?.[0]?.mediaItem?.url || PLACEHOLDER_IMAGE_URL;

    const productUrl = `/products/${product.slug}`;

    const handleWishlist = async (e: React.MouseEvent<HTMLButtonElement>) => {
        e.preventDefault();
        e.stopPropagation();

        if (userId) {
            await addToWishlist({ productId: product.id });
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
        <Link
            href={productUrl}
            className="relative block w-[120px] sm:w-[200px]"
        >
            {/* IMAGE */}
            <div className="relative h-[180px] w-full overflow-hidden bg-gray-50 sm:h-[220px]">
                <Image
                    src={imageUrl}
                    alt={product.title}
                    fill
                    sizes="(max-width: 640px) 120px, 200px"
                    className="object-cover"
                />

                {/* ❤️ WISHLIST BUTTON */}
                <button
                    onClick={handleWishlist}
                    className="absolute right-2 top-2 z-10 flex h-8 w-8 items-center justify-center rounded-full bg-white/90 shadow transition hover:bg-black hover:text-white"
                >
                    <Icons.Heart className="h-4 w-4" />
                </button>
            </div>

            {/* CONTENT */}
            <div className="pt-2">
                <h3 className="line-clamp-2 h-9 text-[12px] font-normal text-gray-800 sm:text-[14px]">
                    {product.title}
                </h3>

                <span className="text-[14px] font-semibold text-gray-900 sm:text-[15px]">
                    ₹{price}
                </span>
            </div>
        </Link>
    );
};

// ============================================================
// ⭐ MOBILE = 2 ROWS + HORIZONTAL SCROLL
// ⭐ DESKTOP = NORMAL GRID (18 items)
// ============================================================
export function LoveThese({
    banners,
    userId,
}: {
    banners: Banner[];
    userId?: string;
}) {
    if (!banners.length) return null;

    const shownProducts = banners.slice(0, 18);

    return (
        <section className="w-full bg-[#FCFBF4] py-4">
            <h2 className="mb-6 text-center font-playfair text-[18px] font-[400] leading-[1.3] tracking-[0.5px] text-[#7A6338] md:text-[26px]">
                You May Like
            </h2>

            {/* MOBILE */}
            <div className="scrollbar-hide overflow-x-auto px-4 md:hidden">
                <div className="grid w-max auto-cols-max grid-flow-col grid-rows-2 gap-x-4 gap-y-5">
                    {shownProducts.map((item) => (
                        <ProductCard
                            key={item.id}
                            banner={item}
                            userId={userId}
                        />
                    ))}
                </div>
            </div>

            {/* DESKTOP */}
            <div className="mx-auto hidden max-w-screen-2xl px-6 md:block">
                <div className="grid grid-cols-2 gap-10 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6">
                    {shownProducts.map((item) => (
                        <ProductCard
                            key={item.id}
                            banner={item}
                            userId={userId}
                        />
                    ))}
                </div>
            </div>
        </section>
    );
}
