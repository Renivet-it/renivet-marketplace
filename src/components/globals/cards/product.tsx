"use client";

import { showAddToCartToast } from "@/components/globals/custom-toasts/add-to-cart-toast";
import { Icons } from "@/components/icons";
import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
    SheetTrigger,
} from "@/components/ui/sheet";
import { trpc } from "@/lib/trpc/client";
import { cn, convertPaiseToRupees, formatPriceTag } from "@/lib/utils";
import { handleCartFlyAnimation } from "@/lib/utils/cartAnimation";
import { ProductWithBrand } from "@/lib/validations";
import { Check, ShoppingCart } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { ProductCartAddForm } from "../forms";

/* --------------------------------------------------------
   GUEST CART HOOK
-------------------------------------------------------- */
function useGuestCart() {
    const [guestCart, setGuestCart] = useState<any[]>([]);

    useEffect(() => {
        try {
            const stored = localStorage.getItem("guest_cart");
            if (stored) setGuestCart(JSON.parse(stored));
        } catch {
            setGuestCart([]);
        }
    }, []);

    const addToGuestCart = (item: any) => {
        const stored = localStorage.getItem("guest_cart");
        const prev = stored ? JSON.parse(stored) : [];

        const existing = prev.find(
            (x: any) =>
                x.productId === item.productId &&
                (x.variantId || null) === (item.variantId || null)
        );

        const updated = existing
            ? prev.map((x: any) =>
                  x.productId === item.productId &&
                  (x.variantId || null) === (item.variantId || null)
                      ? { ...x, quantity: x.quantity + item.quantity }
                      : x
              )
            : [...prev, item];

        localStorage.setItem("guest_cart", JSON.stringify(updated));
        setGuestCart(updated);
        window.dispatchEvent(new Event("guestCartUpdated"));
        if (item.fullProduct) {
            showAddToCartToast(
                item.fullProduct,
                null,
                existing ? "Increased quantity in Cart" : "Item added to cart!"
            );
        } else {
            toast.success(existing ? "Updated Cart" : "Added to Cart!");
        }
    };

    return { guestCart, addToGuestCart };
}

interface PageProps extends GenericProps {
    product: ProductWithBrand;
    isWishlisted: boolean;
    userId?: string;
}

export function ProductCard({
    className,
    product,
    userId,
    ...props
}: PageProps) {
    const [isProductHovered, setIsProductHovered] = useState(false);
    const [isWishlistHovered, setIsWishlistHovered] = useState(false);
    const [currentImageIndex, setCurrentImageIndex] = useState(0);

    const { addToGuestCart } = useGuestCart();
    const [isAdded, setIsAdded] = useState(false);

    const { mutateAsync: addToCart, isLoading } =
        trpc.general.users.cart.addProductToCart.useMutation({
            onSuccess: () => {},
            onError: (err) =>
                toast.error(err.message || "Could not add to cart."),
        });

    /**
     * Helper function
     */
    function isEmptyArray(arr: Array<any>): boolean {
        return arr.length === 0;
    }
    // Get valid media URLs from product and remove duplicates
    const mediaUrls =
        Array.from(
            new Set(
                product.media
                    ?.filter((media) => media.mediaItem?.url)
                    .map((media) => media.mediaItem?.url || "")
            )
        ) || [];

    // Reset image index when not hovering
    useEffect(() => {
        if (!isProductHovered) {
            setCurrentImageIndex(0);
        }
    }, [isProductHovered]);

    // Set up slideshow interval when hovering
    useEffect(() => {
        let slideshowInterval: number | undefined = undefined;

        if (isProductHovered && mediaUrls.length > 1) {
            slideshowInterval = window.setInterval(() => {
                setCurrentImageIndex((prevIndex) =>
                    prevIndex === mediaUrls.length - 1 ? 0 : prevIndex + 1
                );
            }, 1500); // Change image every 1.5 seconds
        }

        return () => {
            if (slideshowInterval !== undefined) {
                window.clearInterval(slideshowInterval);
            }
        };
    }, [isProductHovered, mediaUrls.length]);

    let productPrice = 0;
    let productCompareAtPrice = 0;

    if (!product.productHasVariants) {
        productPrice = product.price || 0;
        productCompareAtPrice = product.compareAtPrice || 0;
    } else {
        // Find the variant with the minimum price
        const minPriceVariant = product.variants.reduce(
            (min, variant) => (variant.price < min.price ? variant : min),
            product.variants[0]
        );

        productPrice = minPriceVariant?.price || 0;
        productCompareAtPrice = minPriceVariant?.compareAtPrice || 0;
    }

    const rawPrice = product.variants?.[0]?.price || product.price || 0;
    const variantId = product.variants?.[0]?.id || null;
    const imageUrl =
        product.media?.[0]?.mediaItem?.url ||
        "https://4o4vm2cu6g.ufs.sh/f/HtysHtJpctzNNQhfcW4g0rgXZuWwadPABUqnljV5RbJMFsx1";

    const handleAddToCart = async (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();

        // Capture ref before async — React nullifies e.currentTarget after await
        const buttonEl = e.currentTarget as HTMLElement | null;

        try {
            if (userId) {
                await addToCart({
                    productId: product.id,
                    variantId: variantId,
                    quantity: 1,
                    userId,
                });
                showAddToCartToast(product, null, "Item added to cart!");
            } else {
                addToGuestCart({
                    productId: product.id,
                    variantId,
                    quantity: 1,
                    title: product.title,
                    brand: product.brand?.name,
                    price: rawPrice,
                    image: imageUrl,
                    fullProduct: product,
                });
            }

            // Trigger flying animation (safe — buttonEl may be null in Sheet portal)
            if (buttonEl) {
                try {
                    handleCartFlyAnimation(e, imageUrl);
                } catch {
                    // Animation failure should not block cart logic
                }
            }

            setIsAdded(true);
            setTimeout(() => {
                setIsAdded(false);
            }, 2000);
        } catch (err: any) {
            toast.error(err.message || "Could not add to cart.");
        }
    };

    return (
        <div
            className={cn("", className)}
            title={product.title}
            {...props}
            onMouseEnter={() => setIsProductHovered(true)}
            onMouseLeave={() => setIsProductHovered(false)}
        >
            <div className="group/image relative block">
                <Link
                    href={`/products/${product.slug}`}
                    onClick={(e) => {
                        if (isWishlistHovered) e.preventDefault();
                    }}
                    target="_blank"
                    rel="noreferrer"
                >
                    <div className="relative aspect-[3/4] overflow-hidden">
                        {/* Product default image */}
                        {isEmptyArray(mediaUrls) && (
                            <Image
                                src="https://4o4vm2cu6g.ufs.sh/f/HtysHtJpctzNNQhfcW4g0rgXZuWwadPABUqnljV5RbJMFsx1"
                                alt="default image"
                                width={1000}
                                height={1000}
                                className={cn(
                                    "size-full object-cover transition-all duration-500 ease-in-out",
                                    isProductHovered ? "scale-105" : "scale-100"
                                )}
                            />
                        )}
                        {mediaUrls.length > 0 && (
                            <Image
                                src={mediaUrls[currentImageIndex]}
                                alt={product.title}
                                width={1000}
                                height={1000}
                                className={cn(
                                    "size-full object-cover transition-all duration-500 ease-in-out",
                                    isProductHovered ? "scale-105" : "scale-100"
                                )}
                            />
                        )}

                        {/* Image indicators for slideshow */}
                        {mediaUrls.length > 1 && (
                            <div className="absolute inset-x-0 bottom-10 z-10 flex justify-center gap-1.5">
                                {mediaUrls.map((_, index) => (
                                    <div
                                        key={index}
                                        className={cn(
                                            "h-1.5 rounded-full transition-all duration-300",
                                            currentImageIndex === index
                                                ? "w-3 bg-primary"
                                                : "w-1.5 bg-background/70"
                                        )}
                                    />
                                ))}
                            </div>
                        )}

                        <div
                            className={cn(
                                "absolute bottom-0 z-20 hidden w-full p-2 transition-all ease-in-out md:inline-block",
                                isProductHovered
                                    ? "translate-y-0 opacity-100"
                                    : "translate-y-full opacity-0"
                            )}
                        >
                            <button
                                onClick={handleAddToCart}
                                disabled={isLoading || isAdded}
                                onMouseEnter={() => setIsWishlistHovered(true)}
                                onMouseLeave={() => setIsWishlistHovered(false)}
                                className={`flex h-10 w-full items-center justify-center gap-2 rounded-md font-medium transition-all duration-300 disabled:opacity-50 ${
                                    isAdded
                                        ? "border-green-600 bg-green-600 text-white"
                                        : "border-gray-200 bg-white/95 text-gray-800 shadow-sm backdrop-blur-sm hover:border-black hover:bg-black hover:text-white"
                                }`}
                            >
                                {isLoading ? (
                                    <Icons.Loader2 className="h-5 w-5 shrink-0 animate-spin" />
                                ) : isAdded ? (
                                    <>
                                        <Check className="h-5 w-5 shrink-0" />
                                        <span>Added to Cart</span>
                                    </>
                                ) : (
                                    <>
                                        <ShoppingCart className="h-5 w-5 shrink-0" />
                                        <span>Add to Cart</span>
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </Link>

                {/* Mobile Floating Add to Cart */}
                <div className="absolute bottom-2 right-2 z-20 md:hidden">
                    <Sheet>
                        <SheetTrigger asChild>
                            <button
                                className={cn(
                                    "flex h-9 w-9 items-center justify-center rounded-full border shadow-sm backdrop-blur-md transition-all active:scale-95",
                                    isAdded
                                        ? "border-green-600 bg-green-600 text-white"
                                        : "border-gray-100 bg-white/90 text-gray-800"
                                )}
                            >
                                <ShoppingCart className="size-[18px]" />
                            </button>
                        </SheetTrigger>
                        <SheetContent
                            side="bottom"
                            className="h-auto max-h-[85vh] w-full overflow-y-auto rounded-t-2xl px-0 pb-8 pt-3"
                        >
                            <SheetHeader className="sr-only">
                                <SheetTitle>Quick Add</SheetTitle>
                            </SheetHeader>

                            {/* Drag handle indicator */}
                            <div className="mb-4 flex justify-center">
                                <div className="h-1 w-10 rounded-full bg-gray-300" />
                            </div>

                            {/* Image Gallery — horizontally scrollable */}
                            <div className="scrollbar-hide flex gap-2.5 overflow-x-auto px-4 pb-4">
                                {(mediaUrls.length > 0
                                    ? mediaUrls.slice(0, 5)
                                    : [imageUrl]
                                ).map((url, idx) => (
                                    <div
                                        key={idx}
                                        className="relative aspect-[3/4] w-24 shrink-0 overflow-hidden rounded-xl border border-gray-100 bg-gray-50"
                                    >
                                        <Image
                                            src={url}
                                            alt={`${product.title} ${idx + 1}`}
                                            fill
                                            className="object-cover"
                                        />
                                    </div>
                                ))}
                            </div>

                            {/* Product Info */}
                            <div className="space-y-3 px-5">
                                {/* Title + Brand */}
                                <div>
                                    <h3 className="text-base font-semibold leading-snug text-gray-900">
                                        {product.title}
                                    </h3>
                                    <p className="mt-0.5 text-xs text-gray-500">
                                        {product.brand.name}
                                    </p>
                                </div>

                                {/* Price */}
                                <div className="flex items-baseline gap-2">
                                    <span className="text-xl font-bold text-gray-900">
                                        {formatPriceTag(
                                            parseFloat(
                                                convertPaiseToRupees(
                                                    productPrice
                                                )
                                            )
                                        )}
                                    </span>
                                    {productCompareAtPrice > productPrice && (
                                        <>
                                            <span className="text-sm text-gray-400 line-through">
                                                {formatPriceTag(
                                                    parseFloat(
                                                        convertPaiseToRupees(
                                                            productCompareAtPrice
                                                        )
                                                    )
                                                )}
                                            </span>
                                            <span className="rounded-full bg-green-50 px-2 py-0.5 text-xs font-semibold text-green-700">
                                                {Math.round(
                                                    ((parseFloat(
                                                        convertPaiseToRupees(
                                                            productCompareAtPrice
                                                        )
                                                    ) -
                                                        parseFloat(
                                                            convertPaiseToRupees(
                                                                productPrice
                                                            )
                                                        )) /
                                                        (parseFloat(
                                                            convertPaiseToRupees(
                                                                productCompareAtPrice
                                                            )
                                                        ) || 1)) *
                                                        100
                                                )}
                                                % OFF
                                            </span>
                                        </>
                                    )}
                                </div>

                                {/* Description */}
                                {product.description && (
                                    <p className="line-clamp-3 text-sm leading-relaxed text-gray-600">
                                        {product.description.replace(
                                            /<[^>]*>/g,
                                            ""
                                        )}
                                    </p>
                                )}

                                {/* Specifications */}
                                {product.specifications &&
                                    product.specifications.length > 0 && (
                                        <div className="space-y-2">
                                            <div className="flex items-center gap-1.5">
                                                <div className="flex size-5 items-center justify-center rounded-md bg-indigo-100">
                                                    <Icons.FileText className="size-3 text-indigo-600" />
                                                </div>
                                                <p className="text-xs font-bold uppercase tracking-wider text-indigo-600">
                                                    Specifications
                                                </p>
                                            </div>
                                            <div className="overflow-hidden rounded-xl border border-indigo-100 bg-gradient-to-b from-indigo-50/40 to-white">
                                                {product.specifications
                                                    .slice(0, 4)
                                                    .map((spec, idx) => (
                                                        <div
                                                            key={idx}
                                                            className={cn(
                                                                "flex items-center justify-between px-3.5 py-2.5",
                                                                idx % 2 === 0
                                                                    ? "bg-indigo-50/30"
                                                                    : "bg-white"
                                                            )}
                                                        >
                                                            <span className="text-xs font-medium text-gray-500">
                                                                {spec.key}
                                                            </span>
                                                            <span className="text-xs font-semibold text-gray-800">
                                                                {spec.value}
                                                            </span>
                                                        </div>
                                                    ))}
                                            </div>
                                        </div>
                                    )}

                                {/* Delivery Badge */}
                                <div className="flex items-center gap-3 rounded-xl border border-emerald-100 bg-gradient-to-r from-emerald-50 to-teal-50/50 px-4 py-3">
                                    <div className="flex size-9 items-center justify-center rounded-full bg-emerald-100 shadow-sm">
                                        <Icons.Truck className="size-4 text-emerald-600" />
                                    </div>
                                    <div>
                                        <p className="text-sm font-semibold text-gray-800">
                                            Estimated delivery in{" "}
                                            <span className="font-bold text-emerald-700">
                                                4-6 days
                                            </span>
                                        </p>
                                        <p className="text-xs text-emerald-600/80">
                                            Free delivery on all orders
                                        </p>
                                    </div>
                                </div>

                                {/* Variant selection + Add to Cart + Buy Now */}
                                <ProductCartAddForm
                                    product={product}
                                    isWishlisted={false}
                                    userId={userId}
                                    warehousePincode={
                                        product.brand?.warehousePostalCode
                                    }
                                    setZipCode={() => {}}
                                    setEstimatedDelivery={() => {}}
                                    compact
                                />
                            </div>
                        </SheetContent>
                    </Sheet>
                </div>
            </div>

            <div className="space-y-1 py-2 md:p-2">
                <div>
                    <div className="flex items-center gap-1">
                        <p className="truncate text-sm font-semibold">
                            {product.title}
                        </p>
                    </div>

                    <p className="mt-0.5 text-xs text-muted-foreground">
                        {product.brand.name}
                    </p>
                </div>

                {/* <p className="text-sm font-semibold">
                    {formatPriceTag(
                        parseFloat(convertPaiseToRupees(productPrice)),
                        true
                    )}
                       -  {parseFloat(convertPaiseToRupees(product.compareAtPrice))}

                </p> */}

                <p className="text-sm font-semibold">
                    <span className="text-gray-900">
                        Rs.
                        {formatPriceTag(
                            parseFloat(convertPaiseToRupees(productPrice))
                        )}
                    </span>
                    {productCompareAtPrice &&
                    productCompareAtPrice > productPrice ? (
                        <>
                            {" "}
                            <span className="text-gray-400 line-through">
                                Rs.
                                {formatPriceTag(
                                    parseFloat(
                                        convertPaiseToRupees(
                                            productCompareAtPrice
                                        )
                                    )
                                )}
                            </span>{" "}
                            <span className="text-red-600">
                                (
                                {Math.round(
                                    ((parseFloat(
                                        convertPaiseToRupees(
                                            productCompareAtPrice
                                        )
                                    ) -
                                        parseFloat(
                                            convertPaiseToRupees(productPrice)
                                        )) /
                                        (parseFloat(
                                            convertPaiseToRupees(
                                                productCompareAtPrice
                                            )
                                        ) || 1)) *
                                        100
                                )}
                                % OFF)
                            </span>
                        </>
                    ) : null}
                </p>
            </div>
        </div>
    );
}
