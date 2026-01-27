"use client";

import { Icons } from "@/components/icons";
import {
    Carousel,
    CarouselContent,
    CarouselItem,
    CarouselNext,
    CarouselPrevious,
} from "@/components/ui/carousel";
import { useGuestWishlist } from "@/lib/hooks/useGuestWishlist";
import { trpc } from "@/lib/trpc/client";
import { cn } from "@/lib/utils";
import Image from "next/image";
import Link from "next/link";
import { toast } from "sonner";

/* ---------------- TYPES ---------------- */

interface Product {
    id: string;
    slug: string;
    title: string;
    media: { mediaItem: { url: string } }[];
    brand?: { name: string };
}

interface ProductGridProps {
    products: { product: Product }[];
    title?: string;
    userId?: string;
    className?: string;
}

/* ---------------- TAG CONFIG ---------------- */

const TAGS = [
    { label: "Best Seller", tone: "dark" },
    { label: "100% Vegan", tone: "green" },
    { label: "Sustainable", tone: "earth" },
];

function getRandomTag(productId: string) {
    const hash = productId
        .split("")
        .reduce((acc, c) => acc + c.charCodeAt(0), 0);

    return TAGS[hash % TAGS.length];
}

/* ---------------- COMPONENT ---------------- */

export function ProductGrid({
    products,
    title = "Top Picks for You",
    userId,
    className,
}: ProductGridProps) {
    if (!products?.length) return null;

    const { addToGuestWishlist } = useGuestWishlist();

    const { mutateAsync: addToWishlist } =
        trpc.general.users.wishlist.addProductInWishlist.useMutation({
            onSuccess: () => toast.success("Added to Wishlist"),
        });

    const handleWishlist = async (e: React.MouseEvent, product: Product) => {
        e.preventDefault();
        e.stopPropagation();

        if (userId) {
            await addToWishlist({ productId: product.id });
        } else {
            addToGuestWishlist({
                productId: product.id,
                variantId: null,
                title: product.title,
                brand: product.brand?.name ?? "",
                price: null,
                image: product.media?.[0]?.mediaItem?.url ?? null,
                sku: null,
                fullProduct: product,
            });
            toast.success("Added to Wishlist");
        }
    };

    return (
        <section className={cn("bg-[#FCFBF4] py-4", className)}>
            {/* TITLE */}
            <h2 className="mb-6 text-center font-playfair text-[18px] font-[400] leading-[1.3] tracking-[0.5px] text-[#7A6338] md:text-[26px]">
                {title}
            </h2>

            {/* ================= MOBILE ================= */}
            <div className="px-2 md:hidden">
                <div
                    className="grid justify-center gap-x-3 gap-y-5"
                    style={{
                        gridTemplateColumns:
                            "repeat(auto-fit, minmax(110px, max-content))",
                    }}
                >
                    {products.map(({ product }) => (
                        <ProductCard
                            key={product.id}
                            product={product}
                            variant="mobile"
                            onWishlist={handleWishlist}
                        />
                    ))}
                </div>
            </div>

            {/* ================= DESKTOP ================= */}
            <div className="relative mx-auto hidden w-full px-4 md:block">
                <Carousel
                    opts={{ align: "start", loop: true }}
                    className="w-full"
                >
                    <CarouselContent className="gap-4 py-4">
                        {products.map(({ product }) => (
                            <CarouselItem
                                key={product.id}
                                className="basis-auto pl-1"
                            >
                                <ProductCard
                                    product={product}
                                    variant="desktop"
                                    onWishlist={handleWishlist}
                                />
                            </CarouselItem>
                        ))}
                    </CarouselContent>
                    <CarouselPrevious className="left-4 border-neutral-200 bg-white text-black shadow-lg transition-all [&>svg]:transition-transform [&>svg]:duration-300 hover:[&>svg]:-translate-x-0.5" />
                    <CarouselNext className="right-4 border-neutral-200 bg-white text-black shadow-lg transition-all [&>svg]:transition-transform [&>svg]:duration-300 hover:[&>svg]:translate-x-0.5" />
                </Carousel>
            </div>
        </section>
    );
}

/* ---------------- PRODUCT CARD ---------------- */

function ProductCard({
    product,
    variant,
    onWishlist,
}: {
    product: Product;
    variant: "mobile" | "desktop";
    onWishlist: (e: React.MouseEvent, product: Product) => void;
}) {
    const isMobile = variant === "mobile";
    const tag = getRandomTag(product.id);

    return (
        <Link
            href={`/products/${product.slug}`}
            className={cn("group block", isMobile ? "w-[110px]" : "w-[240px]")}
        >
            {/* IMAGE */}
            <div
                className={cn(
                    "relative overflow-hidden rounded-md bg-[#EFE9DF]",
                    isMobile
                        ? "h-[185px]"
                        : "aspect-[3/4] transition-transform duration-300 group-hover:scale-[1.02]"
                )}
            >
                <Image
                    src={
                        product.media?.[0]?.mediaItem?.url ||
                        "https://4o4vm2cu6g.ufs.sh/f/HtysHtJpctzNNQhfcW4g0rgXZuWwadPABUqnljV5RbJMFsx1"
                    }
                    alt={product.title}
                    fill
                    className="object-cover"
                />

                {/* TAG */}
                <div
                    className={cn(
                        "absolute z-10",
                        isMobile ? "left-2 top-2" : "left-3 top-3"
                    )}
                >
                    <span
                        className={cn(
                            "rounded-full border font-medium tracking-wide backdrop-blur-md",
                            isMobile
                                ? "px-2 py-[2px] text-[9px]"
                                : "px-3 py-1 text-[11px]",
                            tag.tone === "dark" &&
                                "border-white/20 bg-black/50 text-white",
                            tag.tone === "green" &&
                                "border-emerald-300/40 bg-emerald-600/70 text-white",
                            tag.tone === "earth" &&
                                "border-[#d6c7a1]/40 bg-[#7a6a4f]/70 text-white"
                        )}
                    >
                        {tag.label}
                    </span>
                </div>

                {/* ❤️ WISHLIST */}
                <button
                    onClick={(e) => onWishlist(e, product)}
                    className={cn(
                        "absolute rounded-full border border-white/40 bg-white/30 shadow-sm backdrop-blur-md transition hover:bg-white/40",
                        isMobile ? "right-2 top-2 p-1.5" : "right-3 top-3 p-2"
                    )}
                >
                    <Icons.Heart
                        className={cn(
                            isMobile ? "h-3 w-3" : "h-4 w-4",
                            "text-neutral-900"
                        )}
                    />
                </button>
            </div>

            {/* TITLE */}
            <p
                className={cn(
                    "mt-2 leading-snug text-neutral-900",
                    isMobile
                        ? "line-clamp-2 text-[12px] font-normal"
                        : "mt-4 text-sm font-medium"
                )}
            >
                {product.title}
            </p>
        </Link>
    );
}
