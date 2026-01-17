"use client";

import { Icons } from "@/components/icons";
import {
    Carousel,
    CarouselContent,
    CarouselItem,
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

interface Props {
    products: { product: Product }[];
    userId?: string;
    className?: string;
}

/* ---------------- TAG CONFIG ---------------- */

const TAGS = [
    { label: "Best Seller", tone: "dark" },
    { label: "100% Vegan", tone: "green" },
    { label: "Sustainable", tone: "earth" },
];

function getRandomTags(productId: string) {
    const hash = productId
        .split("")
        .reduce((acc, c) => acc + c.charCodeAt(0), 0);

    return [TAGS[hash % TAGS.length]];
}

/* ---------------- COMPONENT ---------------- */

export function StyleWithSubstance({ products, userId, className }: Props) {
    const { addToGuestWishlist } = useGuestWishlist();

    const { mutateAsync: addToWishlist } =
        trpc.general.users.wishlist.addProductInWishlist.useMutation({
            onSuccess: () => toast.success("Added to Wishlist"),
        });

    const handleWishlist = async (e: React.MouseEvent, product: Product) => {
        e.preventDefault();

        if (userId) {
            await addToWishlist({ productId: product.id });
        } else {
            addToGuestWishlist({
                productId: product.id,
                variantId: null,
                title: product.title,
                brand: product.brand?.name,
                price: null,
                image: product.media?.[0]?.mediaItem?.url ?? null,
                sku: null,
                fullProduct: product,
            });
            toast.success("Added to Wishlist");
        }
    };

    if (!products?.length) return null;

    /* -------- MOBILE SLIDES (2 × 2) -------- */
    const mobileSlides: Product[][] = [];
    for (let i = 0; i < products.length; i += 4) {
        mobileSlides.push(products.slice(i, i + 4).map((p) => p.product));
    }

    return (
        <section className={cn("bg-[#FCFBF4] py-2 pt-4", className)}>
            {/* TITLE */}
            <h2 className="mb-6 text-center font-playfair text-[18px] font-[400] leading-[1.3] tracking-[0.5px] text-[#7A6338] md:text-[26px]">
                Best Sellers
            </h2>

            {/* ================= MOBILE ================= */}
            {/* ================= MOBILE ================= */}
            <div className="px-2 md:hidden">
                <Carousel>
                    <CarouselContent>
                        <CarouselItem>
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
                                        onWishlist={handleWishlist}
                                        variant="mobile"
                                    />
                                ))}
                            </div>
                        </CarouselItem>
                    </CarouselContent>
                </Carousel>
            </div>

            {/* ================= DESKTOP (DO NOT TOUCH) ================= */}
            <div className="hidden md:block">
                <Carousel
                    opts={{
                        align: "start",
                        loop: true,
                    }}
                >
                    <CarouselContent className="gap-6 px-12">
                        {products.map(({ product }) => (
                            <CarouselItem
                                key={product.id}
                                className="basis-auto"
                            >
                                <ProductCard
                                    product={product}
                                    onWishlist={handleWishlist}
                                    variant="desktop"
                                />
                            </CarouselItem>
                        ))}
                    </CarouselContent>
                </Carousel>
            </div>
        </section>
    );
}

/* ---------------- PRODUCT CARD ---------------- */

function ProductCard({
    product,
    onWishlist,
    variant,
}: {
    product: Product;
    onWishlist: (e: React.MouseEvent, product: Product) => void;
    variant: "mobile" | "desktop";
}) {
    const isMobile = variant === "mobile";

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
                    {getRandomTags(product.id).map((tag) => (
                        <span
                            key={tag.label}
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
                    ))}
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
