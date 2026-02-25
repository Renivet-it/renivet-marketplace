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

            // Trigger flying animation
            handleCartFlyAnimation(e, imageUrl);

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

            <div className="space-y-1 py-2 md:p-2">
                <div>
                    <div className="flex items-center gap-1">
                        <p className="truncate text-sm font-semibold">
                            {product.title}
                        </p>

                        <div className="md:hidden">
                            <Sheet>
                                <SheetTrigger asChild>
                                    <button
                                        className={cn(
                                            "flex items-center justify-center rounded-sm px-3 py-1.5 text-xs font-semibold tracking-wider transition-all",
                                            isAdded
                                                ? "bg-green-600 text-white"
                                                : "bg-black text-white hover:bg-gray-800"
                                        )}
                                    >
                                        Buy Now
                                    </button>
                                </SheetTrigger>
                                <SheetContent
                                    side="bottom"
                                    className="h-auto max-h-[90vh] w-full overflow-y-auto rounded-t-xl px-4 pb-6 pt-10"
                                >
                                    <SheetHeader className="sr-only">
                                        <SheetTitle>Add to Cart</SheetTitle>
                                    </SheetHeader>
                                    <ProductCartAddForm
                                        product={product}
                                        isWishlisted={false}
                                        userId={userId}
                                        warehousePincode={
                                            product.brand?.warehousePostalCode
                                        }
                                        setZipCode={() => {}}
                                        setEstimatedDelivery={() => {}}
                                    />
                                </SheetContent>
                            </Sheet>
                        </div>
                    </div>

                    <p className="text-xs text-muted-foreground">
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
