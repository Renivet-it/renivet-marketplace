"use client";

import { showAddToCartToast } from "@/components/globals/custom-toasts/add-to-cart-toast";
import { AnimatedProductLink } from "@/components/home/new-home-page/animated-product-link";
import { Icons } from "@/components/icons";
import { Spinner } from "@/components/ui/spinner";
import { useAddToCartTracking } from "@/lib/hooks/useAddToCartTracking";
import { useGuestWishlist } from "@/lib/hooks/useGuestWishlist";
import { trpc } from "@/lib/trpc/client";
import { cn, convertPaiseToRupees, formatPriceTag } from "@/lib/utils";
import { handleCartFlyAnimation } from "@/lib/utils/cartAnimation";
import { Banner } from "@/lib/validations";
import { Check, ShoppingCart, X, Package, ChevronLeft, ChevronRight } from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Dialog, DialogContent, DialogTrigger, DialogTitle } from "@/components/ui/dialog-general";
import { ProductCartAddForm } from "@/components/globals/forms";
import React, { useEffect, useRef, useState } from "react";
import { toast } from "sonner";

/* =============================
   ⭐ GUEST CART HOOK (UNCHANGED)
============================= */
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

const PLACEHOLDER_IMAGE_URL =
    "https://4o4vm2cu6g.ufs.sh/f/HtysHtJpctzNNQhfcW4g0rgXZuWwadPABUqnljV5RbJMFsx1";

/* =============================
   ⭐ PRODUCT CARD
============================= */

interface ProductCardProps {
    banner: Banner;
    userId?: string;
}

const ProductCard = ({ banner, userId }: ProductCardProps) => {
    const { trackAddToCartEvent } = useAddToCartTracking();
    const router = useRouter();
    const { product } = banner;

    const { addToGuestCart } = useGuestCart();
    const { addToGuestWishlist } = useGuestWishlist();

    const [isWishlisted, setIsWishlisted] = useState(false);
    const [isAdded, setIsAdded] = useState(false);
    const [isHovered, setIsHovered] = useState(false);
    const [currentImageIndex, setCurrentImageIndex] = useState(0);

    // Quick View State
    const [quantity, setQuantity] = useState(1);
    const [selectedOptions, setSelectedOptions] = useState<Record<string, string>>({});
    const [quickViewImageIndex, setQuickViewImageIndex] = useState(0);
    const [isQuickViewOpen, setIsQuickViewOpen] = useState(false);

    /* CART MUTATION (UNCHANGED) */
    const { mutateAsync: addToCart, isLoading } =
        trpc.general.users.cart.addProductToCart.useMutation({
            onSuccess: () => {},
            onError: (err) =>
                toast.error(err.message || "Could not add to cart"),
        });

    /* WISHLIST MUTATION (NEW – SAME AS SWIPECARD) */
    const { mutateAsync: addToWishlist } =
        trpc.general.users.wishlist.addProductInWishlist.useMutation({
            onSuccess: () => toast.success("Added to Wishlist!"),
            onError: (err) =>
                toast.error(err.message || "Could not add to wishlist"),
        });

    if (!product) return null;

    const rawPrice = product.variants?.[0]?.price ?? product.price ?? 0;
    const priceStr = convertPaiseToRupees(rawPrice);
    const price = Math.round(Number(priceStr));

    const originalPrice =
        product.variants?.[0]?.compareAtPrice ?? product.compareAtPrice;

    const displayPriceStr = originalPrice
        ? convertPaiseToRupees(originalPrice)
        : null;
    const displayPrice = displayPriceStr
        ? Math.round(Number(displayPriceStr))
        : null;

    const discount =
        displayPrice && price
            ? Math.round(
                  ((Number(displayPrice) - Number(price)) /
                      Number(displayPrice)) *
                      100
              )
            : null;

    const mediaUrls =
        Array.from(
            new Set(
                product.media
                    ?.filter((media) => media.mediaItem?.url)
                    .map((media) => media.mediaItem?.url || "")
            )
        ) || [];

    const imageUrl = mediaUrls[0] || PLACEHOLDER_IMAGE_URL;
    const quickViewImages = Array.from(new Set([imageUrl, ...mediaUrls])).filter(Boolean);

    const selectedVariant = React.useMemo(() => {
        if (!product.variants || product.variants.length === 0) return null;
        const opts = (product as any).options as any[] | undefined;
        // If no options loaded yet, just return first variant
        if (!opts || opts.length === 0) return product.variants[0];
        // If user hasn't picked anything yet, auto-init selectedOptions from first variant
        if (Object.keys(selectedOptions).length === 0) return product.variants[0];
        const match = product.variants.find(v =>
            Object.entries(selectedOptions).every(([optId, valId]) => (v.combinations as any)?.[optId] === valId)
        );
        return match || product.variants[0];
    }, [product.variants, (product as any).options, selectedOptions]);

    const handleQuickAddCart = async (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();

        if (userId) {
            handleCartFlyAnimation(e, quickViewImages[quickViewImageIndex] || imageUrl, "#pdp-main-image");
            await addToCart({
                productId: product.id,
                variantId: selectedVariant?.id || null,
                quantity: quantity,
                userId: userId,
            });
            showAddToCartToast(product, selectedVariant, "Item added to cart!");
        } else {
            handleCartFlyAnimation(e, quickViewImages[quickViewImageIndex] || imageUrl, "#pdp-main-image");
            addToGuestCart({
                productId: product.id,
                variantId: selectedVariant?.id || null,
                quantity: quantity,
                price: selectedVariant ? selectedVariant.price : rawPrice,
                image: selectedVariant?.image || quickViewImages[quickViewImageIndex] || imageUrl,
                fullProduct: product,
            });
        }
    };

    const handleBuyNow = async (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();

        if (userId) {
            await addToCart({
                productId: product.id,
                variantId: selectedVariant?.id || null,
                quantity: quantity,
                userId: userId,
            });
            router.push(`/checkout?buy_now=true&item=${product.id}&variant=${selectedVariant?.id || ""}&qty=${quantity}`);
        } else {
            addToGuestCart({
                productId: product.id,
                variantId: selectedVariant?.id || null,
                quantity: quantity,
                price: selectedVariant ? selectedVariant.price : rawPrice,
                image: selectedVariant?.image || quickViewImages[quickViewImageIndex] || imageUrl,
                fullProduct: product,
            });
            router.push(`/checkout?buy_now=true&item=${product.id}&variant=${selectedVariant?.id || ""}&qty=${quantity}`);
        }
    };

    useEffect(() => {
        if (!isHovered) {
            setCurrentImageIndex(0);
        }
    }, [isHovered]);

    useEffect(() => {
        let slideshowInterval: number | undefined = undefined;
        if (isHovered && mediaUrls.length > 1) {
            slideshowInterval = window.setInterval(() => {
                setCurrentImageIndex((prevIndex) =>
                    prevIndex === mediaUrls.length - 1 ? 0 : prevIndex + 1
                );
            }, 800);
        }
        return () => {
            if (slideshowInterval !== undefined) {
                window.clearInterval(slideshowInterval);
            }
        };
    }, [isHovered, mediaUrls.length]);

    useEffect(() => {
        let quickViewInterval: number | undefined = undefined;
        if (isQuickViewOpen && quickViewImages.length > 1) {
            quickViewInterval = window.setInterval(() => {
                setQuickViewImageIndex((prevIndex) =>
                    prevIndex === quickViewImages.length - 1 ? 0 : prevIndex + 1
                );
            }, 3000);
        }
        return () => {
            if (quickViewInterval !== undefined) {
                window.clearInterval(quickViewInterval);
            }
        };
    }, [isQuickViewOpen, quickViewImages.length]);



    const variantId = product.variants?.[0]?.id || null;
    const productUrl = product.slug ? `/products/${product.slug}` : "/shop";

    /* =============================
     🛒 CART HANDLER (UNCHANGED)
  ============================= */
    const handleAddToCart = async (e: any) => {
        e.preventDefault();
        e.stopPropagation();

        handleCartFlyAnimation(e, imageUrl);

        try {
            await trackAddToCartEvent({
                productId: product.id,
                brandId: product.brandId,
                productTitle: product.title,
                brandName: product.brand?.name,
                productPrice: rawPrice,
                quantity: 1,
            });

            if (userId) {
                await addToCart({
                    productId: product.id,
                    variantId,
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

            setIsAdded(true);
            setTimeout(() => {
                setIsAdded(false);
            }, 2000);
        } catch (err: any) {
            toast.error(err.message || "Could not add to cart");
        }
    };

    /* =============================
     ❤️ WISHLIST HANDLER (REAL)
  ============================= */
    const handleAddToWishlist = async (e: any) => {
        e.preventDefault();
        e.stopPropagation();

        try {
            if (userId) {
                await addToWishlist({ productId: product.id });
            } else {
                addToGuestWishlist({
                    productId: product.id,
                    variantId: null,
                    title: product.title,
                    brand: product.brand?.name,
                    price: rawPrice,
                    image: imageUrl,
                    sku: null,
                    fullProduct: product,
                });
                toast.success("Added to Wishlist!");
            }

            setIsWishlisted(true);
        } catch (err: any) {
            toast.error(err.message || "Could not add to wishlist");
        }
    };

    return (
        <div
            className="product-card-container group flex h-full w-[146px] flex-shrink-0 flex-col cursor-pointer bg-white md:w-[300px]"
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
        >
            <AnimatedProductLink href={productUrl}>
                <div className="product-image-container relative h-[223px] w-[156px] overflow-hidden bg-[#F5F5F5] md:h-[400px] md:w-full">
                    {mediaUrls.length === 0 && (
                        <Image
                            src={PLACEHOLDER_IMAGE_URL}
                            alt={product.title}
                            fill
                            className={cn(
                                "object-cover transition-all duration-300 ease-in-out",
                                isHovered ? "scale-105" : "scale-100"
                            )}
                            sizes="(max-width: 768px) 146px, 350px"
                        />
                    )}
                    {mediaUrls.map((url, index) => {
                        const isActive = isHovered
                            ? index === currentImageIndex
                            : index === 0;
                        return (
                            <Image
                                key={url}
                                src={url}
                                alt={`${product.title} ${index + 1}`}
                                fill
                                className={cn(
                                    "absolute inset-0 object-cover transition-all duration-300 ease-in-out",
                                    isActive
                                        ? "z-10 opacity-100"
                                        : "z-0 opacity-0",
                                    isHovered ? "scale-105" : "scale-100"
                                )}
                                sizes="(max-width: 768px) 146px, 350px"
                            />
                        );
                    })}

                {/* 🏷️ Discount badge */}
                {discount && discount > 0 && (
                    <span className="absolute left-3 top-3 z-10 rounded-sm bg-[#E95123] px-2 py-0.5 text-[10px] font-bold tracking-wide text-white shadow-sm md:text-xs">
                        Sale -{discount}%
                    </span>
                )}

                {/* Floating Wishlist Button */}
                <button
                    onClick={handleAddToWishlist}
                    className="absolute right-3 top-3 z-20 flex h-10 w-10 items-center justify-center rounded-full bg-white shadow-md transition-all hover:scale-110"
                >
                    <Icons.Heart className={cn("h-5 w-5 transition-colors", isWishlisted ? "fill-red-500 text-red-500" : "text-gray-900 hover:text-red-500")} />
                </button>

                {/* QUICK VIEW MODAL & TRIGGER */}
                <Dialog open={isQuickViewOpen} onOpenChange={setIsQuickViewOpen}>
                    <div 
                        className="absolute bottom-3 right-3 z-20 md:opacity-0 md:group-hover:opacity-100 transition-opacity duration-300"
                        onClick={(e) => { e.preventDefault(); e.stopPropagation(); }}
                    >
                        <DialogTrigger asChild>
                            <button
                                className="flex h-10 items-center justify-center rounded-full bg-white px-4 shadow-md transition-all duration-300 hover:scale-105 active:scale-95"
                            >
                                <span className="whitespace-nowrap text-[11px] font-bold tracking-wider text-gray-900">
                                    QUICK BUY
                                </span>
                            </button>
                        </DialogTrigger>
                    </div>
                    <DialogContent className="max-h-[95dvh] w-[96vw] max-w-5xl overflow-hidden rounded-md p-0 md:h-[85vh]">
                        <DialogTitle className="sr-only">{product.title}</DialogTitle>
                        {/* 2-Column Grid for Desktop, Stacked for Mobile */}
                        <div className="flex h-full flex-col md:flex-row bg-white overflow-y-auto md:overflow-hidden">
                            {/* Left Side: Image Slider */}
                            <div className="relative h-[320px] sm:h-[380px] w-full shrink-0 bg-[#F5F5F5] md:h-full md:w-1/2 group/slider">
                                <Image
                                    src={quickViewImages[quickViewImageIndex] || imageUrl}
                                    alt={product.title}
                                    fill
                                    className="object-contain md:object-cover md:object-center"
                                    sizes="(max-width: 768px) 100vw, 50vw"
                                />
                                {/* Bestseller Badge */}
                                <div className="absolute top-6 left-6 bg-[#009688] text-white text-xs font-semibold px-3 py-1 tracking-wide z-10">
                                    Bestseller
                                </div>
                                
                                {/* Arrows */}
                                {quickViewImages.length > 1 && (
                                    <>
                                        <button 
                                            onClick={(e) => { e.stopPropagation(); setQuickViewImageIndex(prev => prev === 0 ? quickViewImages.length - 1 : prev - 1); }}
                                            className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 bg-white/90 rounded-full flex items-center justify-center shadow-sm opacity-0 group-hover/slider:opacity-100 transition-opacity z-10 hover:bg-white"
                                        >
                                            <ChevronLeft className="w-5 h-5 text-gray-600" />
                                        </button>
                                        <button 
                                            onClick={(e) => { e.stopPropagation(); setQuickViewImageIndex(prev => prev === quickViewImages.length - 1 ? 0 : prev + 1); }}
                                            className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 bg-white/90 rounded-full flex items-center justify-center shadow-sm opacity-0 group-hover/slider:opacity-100 transition-opacity z-10 hover:bg-white"
                                        >
                                            <ChevronRight className="w-5 h-5 text-gray-600" />
                                        </button>
                                        {/* Dots */}
                                        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-2 z-10">
                                            {quickViewImages.map((_, i) => (
                                                <div key={i} className={cn("w-1.5 h-1.5 rounded-full transition-colors", i === quickViewImageIndex ? "bg-gray-800" : "bg-gray-300")} />
                                            ))}
                                        </div>
                                    </>
                                )}
                            </div>

                            {/* Right Side: Details */}
                            <div className="flex flex-col p-4 md:p-12 md:w-1/2 md:overflow-y-auto scrollbar-hide relative">
                                <h2 className="font-serif text-xl sm:text-2xl md:text-[32px] font-light text-gray-900 leading-tight pr-8">
                                    {product.title}
                                </h2>
                                
                                <div className="mt-2 md:mt-5 flex items-baseline gap-3">
                                    <span className="text-lg md:text-xl font-medium text-gray-900">
                                        Rs. {formatPriceTag(parseFloat(convertPaiseToRupees(selectedVariant?.price || rawPrice)), true)}
                                    </span>
                                    {originalPrice && (
                                        <span className="text-sm font-medium text-gray-400 line-through">
                                            Rs. {formatPriceTag(parseFloat(convertPaiseToRupees(originalPrice)), true)}
                                        </span>
                                    )}
                                </div>

                                {product.description && (
                                    <div 
                                        className="mt-2 md:mt-6 text-xs md:text-sm text-gray-500 leading-relaxed line-clamp-2 md:line-clamp-3"
                                        dangerouslySetInnerHTML={{ __html: product.description }}
                                    />
                                )}

                                <div className="mt-4 md:mt-8 space-y-3 md:space-y-6">
                                    {/* Options (Size, etc) */}
                                    {product.options?.map(opt => {
                                        const selectedVal = selectedOptions[opt.id] || opt.values[0]?.id;
                                        return (
                                            <div key={opt.id}>
                                                <div className="mb-2 text-xs md:text-sm flex items-center gap-2">
                                                    <span className="font-medium text-gray-900">{opt.name} :</span>
                                                    <span className="text-gray-500">{opt.values.find(v => v.id === selectedVal)?.name}</span>
                                                </div>
                                                <div className="flex flex-wrap gap-1.5 md:gap-2.5">
                                                    {opt.values.map(val => {
                                                        const isSelected = selectedVal === val.id;
                                                        return (
                                                            <button 
                                                                key={val.id}
                                                                onClick={() => setSelectedOptions(prev => ({...prev, [opt.id]: val.id}))}
                                                                className={cn(
                                                                    "h-8 md:h-10 px-3 md:px-4 border text-xs md:text-sm font-medium flex items-center justify-center transition-colors min-w-[36px]",
                                                                    isSelected ? "border-gray-900 text-gray-900" : "border-gray-300 text-gray-600 hover:border-gray-400"
                                                                )}
                                                            >
                                                                {val.name}
                                                            </button>
                                                        );
                                                    })}
                                                </div>
                                            </div>
                                        );
                                    })}

                                    {/* Quantity & Cart Row */}
                                    <div className="flex items-stretch gap-2 mt-4 md:mt-10">
                                        <div className="flex items-center border border-gray-300 h-11 w-24 shrink-0">
                                            <button onClick={() => setQuantity(Math.max(1, quantity - 1))} className="flex-1 h-full text-gray-500 hover:text-gray-900 flex items-center justify-center text-lg">−</button>
                                            <span className="flex-1 text-center text-sm font-medium">{quantity}</span>
                                            <button onClick={() => setQuantity(quantity + 1)} className="flex-1 h-full text-gray-500 hover:text-gray-900 flex items-center justify-center text-lg">+</button>
                                        </div>
                                        <button 
                                            onClick={handleQuickAddCart}
                                            disabled={isLoading || !product.isAvailable}
                                            className="flex-1 border border-[#222222] text-[#222222] bg-white text-[10px] md:text-sm font-semibold tracking-[0.08em] hover:bg-gray-50 transition-colors h-11 flex items-center justify-center"
                                        >
                                            {isLoading ? <Spinner className="w-4 h-4 animate-spin" /> : "ADD TO CART"}
                                        </button>
                                        <button 
                                            onClick={handleBuyNow}
                                            disabled={isLoading || !product.isAvailable}
                                            className="flex-1 bg-[#222222] text-white text-[10px] md:text-sm font-semibold tracking-[0.08em] hover:bg-black transition-colors h-11 flex items-center justify-center"
                                        >
                                            {isLoading ? <Spinner className="w-4 h-4 animate-spin" /> : "BUY NOW"}
                                        </button>
                                    </div>

                                    {/* Trust / Payment */}
                                    <div className="mt-4 pt-4 border-t border-gray-100">
                                        <p className="text-[9px] uppercase tracking-[0.18em] text-gray-400 font-medium mb-3">100% Secure Checkout</p>
                                        <div className="flex items-center gap-2 flex-wrap">
                                            {/* Visa */}
                                            <div className="h-8 px-3 border border-gray-200 rounded flex items-center justify-center bg-white">
                                                <span className="font-black text-[11px] italic tracking-tight text-[#1A1F71]">VISA</span>
                                            </div>
                                            {/* Mastercard */}
                                            <div className="h-8 px-2.5 border border-gray-200 rounded flex items-center justify-center bg-white gap-0.5">
                                                <div className="w-[14px] h-[14px] rounded-full bg-[#EB001B]" />
                                                <div className="w-[14px] h-[14px] rounded-full bg-[#F79E1B] -ml-[7px]" />
                                            </div>
                                            {/* UPI */}
                                            <div className="h-8 px-3 border border-gray-200 rounded flex items-center justify-center bg-white">
                                                <span className="font-black text-[11px] tracking-tight" style={{background:"linear-gradient(90deg,#097939 40%,#ed752e 100%)",WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent"}}>UPI</span>
                                            </div>
                                            {/* RuPay */}
                                            <div className="h-8 px-3 border border-gray-200 rounded flex items-center justify-center bg-white">
                                                <span className="font-black text-[10px] tracking-tight text-[#1a6dd4]">RuPay</span>
                                            </div>
                                            {/* COD */}
                                            <div className="h-8 px-3 border border-gray-200 rounded flex items-center justify-center bg-white">
                                                <span className="font-bold text-[9px] tracking-widest text-gray-500">COD</span>
                                            </div>
                                            {/* SSL lock */}
                                            <div className="ml-auto flex items-center gap-1.5 text-[10px] text-gray-400">
                                                <svg className="w-3.5 h-3.5 text-gray-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                                                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                                                    <path d="M7 11V7a5 5 0 0110 0v4"/>
                                                </svg>
                                                SSL Encrypted
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </DialogContent>
                </Dialog>
                </div>
            </AnimatedProductLink>

            {/* TITLE */}
            <AnimatedProductLink
                href={productUrl}
                className="mt-4 block px-2 text-center min-h-[36px]"
            >
                <h3 className="line-clamp-2 text-[12px] font-normal leading-tight text-gray-800 sm:text-[13px]">
                    {product.title}
                </h3>
            </AnimatedProductLink>

            {/* PRICE ROW */}
            <AnimatedProductLink
                href={productUrl}
                className="mt-1 flex items-center justify-center gap-2 px-2 pb-3"
            >
                <span className="text-[13px] font-semibold text-gray-900 sm:text-[14px]">
                    Rs. {price}
                </span>

                {displayPrice && (
                    <span className="text-[11px] text-gray-400 line-through sm:text-[12px]">
                        Rs. {displayPrice}
                    </span>
                )}
            </AnimatedProductLink>

        </div>
    );
};

/* =============================
   ⭐ SWAPSPACE (UNCHANGED)
============================= */

interface SwapSpaceProps {
    banners: Banner[];
    userId?: string;
    className?: string;
}

export function SwapSpace({ banners, userId, className }: SwapSpaceProps) {
    const desktopRef = useRef<HTMLDivElement>(null);
    const mobileRef = useRef<HTMLDivElement>(null);

    if (!banners.length) return null;

    const scroll = (ref: any, direction: "left" | "right") => {
        if (ref.current) {
            ref.current.scrollBy({
                left: direction === "left" ? -400 : 400,
                behavior: "smooth",
            });
        }
    };

    return (
        <section className={cn("w-full bg-white py-12", className)}>
            <div className="mx-auto max-w-screen-3xl px-6 mb-8 flex flex-col items-start">
                <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-gray-500 md:text-[11px]">
                    Loved by Many
                </span>
                <h2 className="mt-2 font-playfair text-[28px] font-normal leading-[1.3] text-gray-900 md:text-[36px] uppercase">
                    Best Sellers
                </h2>
            </div>

            {/* DESKTOP */}
            <div className="relative mx-auto hidden px-6 md:block max-w-screen-2.5xl">
                <button
                    onClick={() => scroll(desktopRef, "left")}
                    className="absolute left-2 top-1/2 z-20 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-white shadow-md border border-gray-100 hover:bg-gray-50"
                >
                    <Icons.ChevronLeft className="h-5 w-5 text-gray-700" />
                </button>

                <div
                    ref={desktopRef}
                    className="scrollbar-hide overflow-x-auto scroll-smooth"
                >
                    <div className="flex w-max space-x-6">
                        {banners.map((item) => (
                            <ProductCard
                                key={item.id}
                                banner={item}
                                userId={userId}
                            />
                        ))}
                    </div>
                </div>

                <button
                    onClick={() => scroll(desktopRef, "right")}
                    className="absolute right-2 top-1/2 z-20 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-white shadow-md border border-gray-100 hover:bg-gray-50"
                >
                    <Icons.ChevronRight className="h-5 w-5 text-gray-700" />
                </button>
            </div>

            {/* MOBILE */}
            <div className="scrollbar-hide overflow-x-auto px-4 md:hidden">
                <div ref={mobileRef} className="flex space-x-4">
                    {banners.map((item) => (
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
