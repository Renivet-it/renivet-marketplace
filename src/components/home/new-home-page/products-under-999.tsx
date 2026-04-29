"use client";

import { showAddToCartToast } from "@/components/globals/custom-toasts/add-to-cart-toast";
import { AnimatedProductLink } from "@/components/home/new-home-page/animated-product-link";
import { Icons } from "@/components/icons";
import { Spinner } from "@/components/ui/spinner";
import { Dialog, DialogContent, DialogTrigger, DialogTitle } from "@/components/ui/dialog-general";
import { useAddToCartTracking } from "@/lib/hooks/useAddToCartTracking";
import { useGuestWishlist } from "@/lib/hooks/useGuestWishlist";
import { trpc } from "@/lib/trpc/client";
import { cn, convertPaiseToRupees, formatPriceTag } from "@/lib/utils";
import { handleCartFlyAnimation } from "@/lib/utils/cartAnimation";
import { ProductWithBrand } from "@/lib/validations";
import { ChevronLeft, ChevronRight } from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import React, { useState, useRef, useEffect } from "react";
import { toast } from "sonner";

const PLACEHOLDER_IMAGE_URL =
    "https://4o4vm2cu6g.ufs.sh/f/HtysHtJpctzNNQhfcW4g0rgXZuWwadPABUqnljV5RbJMFsx1";

function useGuestCart() {
    type GuestCartItem = {
        productId: string;
        variantId?: string | null;
        quantity: number;
        title?: string;
        brand?: string;
        price?: number;
        image?: string;
        sku?: string | null;
        fullProduct?: ProductWithBrand;
    };

    const addToGuestCart = (item: GuestCartItem) => {
        const stored = localStorage.getItem("guest_cart");
        const prev: GuestCartItem[] = stored ? JSON.parse(stored) : [];

        const existing = prev.find(
            (x) =>
                x.productId === item.productId &&
                (x.variantId || null) === (item.variantId || null)
        );

        const updated = existing
            ? prev.map((x) =>
                  x.productId === item.productId &&
                  (x.variantId || null) === (item.variantId || null)
                      ? { ...x, quantity: x.quantity + item.quantity }
                      : x
              )
            : [...prev, item];

        localStorage.setItem("guest_cart", JSON.stringify(updated));
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

    return { addToGuestCart };
}

function Under999ProductCard({ product, userId }: { product: ProductWithBrand; userId?: string; }) {
    const { trackAddToCartEvent } = useAddToCartTracking();
    const router = useRouter();
    const { addToGuestCart } = useGuestCart();
    const { addToGuestWishlist } = useGuestWishlist();
    const [isWishlisted, setIsWishlisted] = useState(false);
    const [quantity, setQuantity] = useState(1);
    const [selectedOptions, setSelectedOptions] = useState<Record<string, string>>({});
    const [quickViewImageIndex, setQuickViewImageIndex] = useState(0);
    const [isQuickViewOpen, setIsQuickViewOpen] = useState(false);

    const { mutateAsync: addToCart, isLoading } = trpc.general.users.cart.addProductToCart.useMutation({
        onSuccess: () => {}, onError: (err) => toast.error(err.message || "Could not add to cart"),
    });
    const { mutateAsync: addToWishlist } = trpc.general.users.wishlist.addProductInWishlist.useMutation({
        onSuccess: () => toast.success("Added to Wishlist!"), onError: (err) => toast.error(err.message || "Could not add to wishlist"),
    });

    const rawPrice = product.variants?.[0]?.price ?? product.price ?? 0;
    const originalPrice = product.variants?.[0]?.compareAtPrice ?? product.compareAtPrice;
    const discount = originalPrice && originalPrice > rawPrice ? Math.round(((originalPrice - rawPrice) / originalPrice) * 100) : null;
    const mediaUrls = Array.from(new Set(product.media?.filter((m: any) => m.mediaItem?.url).map((m: any) => m.mediaItem.url))) as string[];
    const imageUrl = mediaUrls[0] || PLACEHOLDER_IMAGE_URL;
    const quickViewImages = Array.from(new Set([imageUrl, ...mediaUrls])).filter(Boolean) as string[];
    const productUrl = product.slug ? `/products/${product.slug}` : "/shop";

    const selectedVariant = React.useMemo(() => {
        if (!product.variants?.length) return null;
        const opts = (product as any).options;
        if (!opts?.length || !Object.keys(selectedOptions).length) return product.variants[0];
        return product.variants.find((v: any) => Object.entries(selectedOptions).every(([oid, vid]) => (v.combinations as any)?.[oid] === vid)) || product.variants[0];
    }, [product.variants, (product as any).options, selectedOptions]);

    useEffect(() => {
        let interval: number | undefined;
        if (isQuickViewOpen && quickViewImages.length > 1) {
            interval = window.setInterval(() => setQuickViewImageIndex(p => p === quickViewImages.length - 1 ? 0 : p + 1), 3000);
        }
        return () => { if (interval) window.clearInterval(interval); };
    }, [isQuickViewOpen, quickViewImages.length]);

    const handleAddToWishlist = async (e: React.MouseEvent) => {
        e.preventDefault(); e.stopPropagation();
        try {
            if (userId) { await addToWishlist({ productId: product.id }); }
            else { addToGuestWishlist({ productId: product.id, variantId: null, title: product.title, brand: product.brand?.name, price: rawPrice, image: imageUrl, sku: null, fullProduct: product as any }); toast.success("Added to Wishlist!"); }
            setIsWishlisted(true);
        } catch (err: any) { toast.error(err.message || "Could not add to wishlist"); }
    };

    const handleQuickAddCart = async (e: React.MouseEvent) => {
        e.preventDefault(); e.stopPropagation();
        handleCartFlyAnimation(e, imageUrl);
        try {
            await trackAddToCartEvent({ productId: product.id, brandId: product.brandId || "", productTitle: product.title, brandName: product.brand?.name, productPrice: rawPrice, quantity });
            if (userId) { await addToCart({ productId: product.id, variantId: selectedVariant?.id || null, quantity, userId }); showAddToCartToast(product as any, selectedVariant as any, "Item added to cart!"); }
            else { addToGuestCart({ productId: product.id, variantId: selectedVariant?.id || null, quantity, price: selectedVariant?.price ?? rawPrice, image: imageUrl, fullProduct: product }); }
        } catch (err: any) { toast.error(err.message || "Could not add to cart"); }
    };

    const handleBuyNow = async (e: React.MouseEvent) => {
        e.preventDefault(); e.stopPropagation();
        try {
            if (userId) { await addToCart({ productId: product.id, variantId: selectedVariant?.id || null, quantity, userId }); }
            else { addToGuestCart({ productId: product.id, variantId: selectedVariant?.id || null, quantity, price: selectedVariant?.price ?? rawPrice, image: imageUrl, fullProduct: product }); }
            router.push(`/checkout?buy_now=true&item=${product.id}&variant=${selectedVariant?.id || ""}&qty=${quantity}`);
        } catch (err: any) { toast.error(err.message || "Could not proceed"); }
    };

    const price = Math.round(Number(convertPaiseToRupees(rawPrice)));
    const displayOriginal = originalPrice && originalPrice > rawPrice ? Math.round(Number(convertPaiseToRupees(originalPrice))) : null;

    return (
        <div className="group/card relative flex flex-col cursor-pointer overflow-hidden bg-white w-[140px] shrink-0 sm:w-[200px] md:w-[240px]">
            <div className="relative aspect-[3/4] w-full overflow-hidden bg-[#F5F5F5]">
                <AnimatedProductLink href={productUrl} className="absolute inset-0 z-10">
                    <span className="sr-only">{product.title}</span>
                </AnimatedProductLink>
                <Image src={imageUrl} alt={product.title} fill className="object-cover transition-transform duration-500 group-hover/card:scale-105 z-0" sizes="(max-width: 640px) 33vw, 14vw" />
                {discount && discount > 0 && <span className="absolute left-0 top-2 rounded-r-sm bg-[#E95123] px-2 py-0.5 text-[9px] font-bold uppercase tracking-wide text-white z-20">-{discount}%</span>}

                {/* Wishlist — top right */}
                <button onClick={handleAddToWishlist} className="absolute right-2 top-2 z-20 flex h-7 w-7 items-center justify-center rounded-full bg-white/90 shadow-sm transition-all hover:scale-110 hover:bg-white">
                    <Icons.Heart className={cn("h-3.5 w-3.5 transition-colors", isWishlisted ? "fill-red-500 text-red-500" : "text-gray-600 hover:text-red-500")} />
                </button>

                {/* Quick View trigger — bottom right on mobile (icon), desktop hover pill */}
                <Dialog open={isQuickViewOpen} onOpenChange={setIsQuickViewOpen}>
                    <div className="absolute bottom-2 right-2 z-20 md:hidden" onClick={e => { e.preventDefault(); e.stopPropagation(); }}>
                        <DialogTrigger asChild>
                            <button className="flex h-7 w-7 items-center justify-center rounded-full btn-liquid btn-liquid-secondary shadow-sm group/btn">
                                <svg className="w-3.5 h-3.5 text-inherit" fill="none" stroke="currentColor" strokeWidth="1.75" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-1.5 6h11M10 21a1 1 0 100-2 1 1 0 000 2zm7 0a1 1 0 100-2 1 1 0 000 2z"/>
                                </svg>
                            </button>
                        </DialogTrigger>
                    </div>
                    {/* Desktop hover pill */}
                    <div className="absolute inset-x-0 bottom-0 hidden md:block translate-y-full group-hover/card:translate-y-0 transition-transform duration-300 ease-out z-20" onClick={e => { e.preventDefault(); e.stopPropagation(); }}>
                        <DialogTrigger asChild>
                            <button className="w-full py-2.5 btn-liquid btn-liquid-primary text-[10px] font-bold tracking-[0.12em] uppercase flex items-center justify-center">
                                QUICK BUY
                            </button>
                        </DialogTrigger>
                    </div>

                    <DialogContent className="max-h-[95dvh] w-[96vw] max-w-5xl overflow-hidden rounded-md p-0 md:h-[85vh]" onCloseAutoFocus={(e) => e.preventDefault()}>
                        <DialogTitle className="sr-only">{product.title}</DialogTitle>
                        <div className="flex h-full flex-col md:flex-row bg-white overflow-y-auto md:overflow-hidden">
                            {/* Image side */}
                            <div className="relative h-[320px] sm:h-[380px] w-full shrink-0 bg-[#F5F5F5] md:h-full md:w-1/2 group/slider">
                                <Image src={quickViewImages[quickViewImageIndex] || imageUrl} alt={product.title} fill className="object-contain md:object-cover md:object-center" sizes="(max-width: 768px) 100vw, 50vw" />
                                {quickViewImages.length > 1 && (
                                    <>
                                        <button onClick={e => { e.stopPropagation(); setQuickViewImageIndex(p => p === 0 ? quickViewImages.length - 1 : p - 1); }} className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 bg-white/90 rounded-full flex items-center justify-center shadow-sm opacity-0 group-hover/slider:opacity-100 transition-opacity z-10 hover:bg-white">
                                            <ChevronLeft className="w-5 h-5 text-gray-600" />
                                        </button>
                                        <button onClick={e => { e.stopPropagation(); setQuickViewImageIndex(p => p === quickViewImages.length - 1 ? 0 : p + 1); }} className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 bg-white/90 rounded-full flex items-center justify-center shadow-sm opacity-0 group-hover/slider:opacity-100 transition-opacity z-10 hover:bg-white">
                                            <ChevronRight className="w-5 h-5 text-gray-600" />
                                        </button>
                                        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-2 z-10">
                                            {quickViewImages.map((_, i) => <div key={i} className={cn("w-1.5 h-1.5 rounded-full transition-colors", i === quickViewImageIndex ? "bg-gray-800" : "bg-gray-300")} />)}
                                        </div>
                                    </>
                                )}
                            </div>

                            {/* Details side */}
                            <div className="flex flex-col p-4 md:p-12 md:w-1/2 md:overflow-y-auto scrollbar-hide">
                                <h2 className="font-serif text-xl sm:text-2xl md:text-[32px] font-light text-gray-900 leading-tight pr-8">{product.title}</h2>
                                <div className="mt-2 md:mt-5 flex items-baseline gap-3">
                                    <span className="text-lg md:text-xl font-medium text-gray-900">Rs. {formatPriceTag(parseFloat(convertPaiseToRupees(selectedVariant?.price || rawPrice)), true)}</span>
                                    {originalPrice && <span className="text-sm font-medium text-gray-400 line-through">Rs. {formatPriceTag(parseFloat(convertPaiseToRupees(originalPrice)), true)}</span>}
                                </div>
                                {product.description && <div className="mt-2 md:mt-6 text-xs md:text-sm text-gray-500 leading-relaxed line-clamp-2 md:line-clamp-3" dangerouslySetInnerHTML={{ __html: product.description }} />}

                                <div className="mt-4 md:mt-8 space-y-3 md:space-y-6">
                                    {(product as any).options?.map((opt: any) => {
                                        const selectedVal = selectedOptions[opt.id] || opt.values[0]?.id;
                                        return (
                                            <div key={opt.id}>
                                                <div className="mb-2 text-xs md:text-sm flex items-center gap-2">
                                                    <span className="font-medium text-gray-900">{opt.name} :</span>
                                                    <span className="text-gray-500">{opt.values.find((v: any) => v.id === selectedVal)?.name}</span>
                                                </div>
                                                <div className="flex flex-wrap gap-1.5 md:gap-2.5">
                                                    {opt.values.map((val: any) => (
                                                        <button key={val.id} onClick={() => setSelectedOptions(p => ({ ...p, [opt.id]: val.id }))}
                                                            className={cn("h-8 md:h-10 px-3 md:px-4 border text-xs md:text-sm font-medium transition-colors min-w-[36px]",
                                                                selectedVal === val.id ? "border-gray-900 text-gray-900" : "border-gray-300 text-gray-600 hover:border-gray-400")}>
                                                            {val.name}
                                                        </button>
                                                    ))}
                                                </div>
                                            </div>
                                        );
                                    })}

                                    <div className="flex items-stretch gap-2 mt-4 md:mt-10">
                                        <div className="flex items-center border border-gray-300 h-11 w-24 shrink-0">
                                            <button onClick={() => setQuantity(Math.max(1, quantity - 1))} className="flex-1 h-full text-gray-500 hover:text-gray-900 flex items-center justify-center text-lg">−</button>
                                            <span className="flex-1 text-center text-sm font-medium">{quantity}</span>
                                            <button onClick={() => setQuantity(quantity + 1)} className="flex-1 h-full text-gray-500 hover:text-gray-900 flex items-center justify-center text-lg">+</button>
                                        </div>
                                        <button onClick={handleQuickAddCart} disabled={isLoading} className="flex-1 btn-liquid btn-liquid-secondary text-[10px] md:text-sm font-semibold tracking-[0.08em] h-11 flex items-center justify-center rounded-sm">
                                            {isLoading ? <Spinner className="w-4 h-4 animate-spin text-gray-700" /> : "ADD TO CART"}
                                        </button>
                                        <button onClick={handleBuyNow} disabled={isLoading} className="flex-1 btn-liquid btn-liquid-primary text-[10px] md:text-sm font-semibold tracking-[0.08em] h-11 flex items-center justify-center rounded-sm group/btn">
                                            {isLoading ? <Spinner className="w-4 h-4 animate-spin text-white group-hover/btn:text-black" /> : "BUY NOW"}
                                        </button>
                                    </div>

                                    {(product as any).specifications && (product as any).specifications.length > 0 && (
                                        <div className="mt-4 pt-4 border-t border-gray-100">
                                            <p className="text-[9px] uppercase tracking-[0.18em] text-gray-400 font-medium mb-3">Specifications</p>
                                            <div className="grid grid-cols-2 gap-2">
                                                {(product as any).specifications.map((spec: any, i: number) => (
                                                    <div key={i} className="bg-gray-50 rounded px-3 py-2">
                                                        <span className="block text-[8px] uppercase tracking-widest text-gray-400 mb-0.5">{spec.key}</span>
                                                        <span className="block text-[11px] font-semibold text-gray-800 leading-tight">{spec.value}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    <div className="mt-4 pt-4 border-t border-gray-100">
                                        <p className="text-[9px] uppercase tracking-[0.18em] text-gray-400 font-medium mb-3">100% Secure Checkout</p>
                                        <div className="flex items-center gap-2 flex-wrap">
                                            <div className="h-8 px-3 border border-gray-200 rounded flex items-center justify-center bg-white"><span className="font-black text-[11px] italic tracking-tight text-[#1A1F71]">VISA</span></div>
                                            <div className="h-8 px-2.5 border border-gray-200 rounded flex items-center justify-center bg-white gap-0.5"><div className="w-[14px] h-[14px] rounded-full bg-[#EB001B]" /><div className="w-[14px] h-[14px] rounded-full bg-[#F79E1B] -ml-[7px]" /></div>
                                            <div className="h-8 px-3 border border-gray-200 rounded flex items-center justify-center bg-white"><span className="font-black text-[11px] tracking-tight" style={{background:"linear-gradient(90deg,#097939 40%,#ed752e 100%)",WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent"}}>UPI</span></div>
                                            <div className="h-8 px-3 border border-gray-200 rounded flex items-center justify-center bg-white"><span className="font-black text-[10px] tracking-tight text-[#1a6dd4]">RuPay</span></div>
                                            <div className="h-8 px-3 border border-gray-200 rounded flex items-center justify-center bg-white"><span className="font-bold text-[9px] tracking-widest text-gray-500">COD</span></div>
                                            <div className="ml-auto flex items-center gap-1.5 text-[10px] text-gray-400">
                                                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0110 0v4"/></svg>
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

            <AnimatedProductLink href={productUrl} className="block pt-2 pb-1 relative z-10">
                <h3 className="truncate text-[11px] font-normal text-gray-800 sm:text-xs leading-tight">{product.title}</h3>
                <div className="mt-1 flex items-baseline gap-1.5">
                    <span className="text-[12px] font-semibold text-gray-900">₹{price}</span>
                    {displayOriginal && <span className="text-[10px] text-gray-400 line-through">₹{displayOriginal}</span>}
                </div>
            </AnimatedProductLink>
        </div>
    );
}

interface ProductsUnder999Props extends React.HTMLAttributes<HTMLDivElement> {
    products: ProductWithBrand[];
    userId?: string;
}

export function ProductsUnder999({
    products,
    userId,
    className,
    ...props
}: ProductsUnder999Props) {
    const desktopRef = useRef<HTMLDivElement>(null);
    const mobileRef = useRef<HTMLDivElement>(null);

    if (!products?.length) return null;

    const scroll = (ref: any, direction: "left" | "right") => {
        if (ref.current) {
            ref.current.scrollBy({
                left: direction === "left" ? -400 : 400,
                behavior: "smooth",
            });
        }
    };

    const shownProducts = products.slice(0, 18);

    return (
        <section
            className={cn("w-full bg-white py-10 md:py-14", className)}
            {...props}
        >
            <div className="mx-auto max-w-screen-3xl px-4 sm:px-6 lg:px-8">
                <div className="mb-8 flex flex-col items-start">
                    <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-gray-500 md:text-[11px]">
                        Affordable Picks
                    </span>
                    <h2 className="mt-2 font-playfair text-[28px] font-normal uppercase leading-[1.3] text-gray-900 md:text-[36px]">
                        Products Under 999
                    </h2>
                </div>
            </div>

            {/* DESKTOP */}
            <div className="relative mx-auto hidden max-w-screen-3xl px-4 sm:px-6 md:block lg:px-8">
                <button
                    onClick={() => scroll(desktopRef, "left")}
                    className="absolute left-2 top-1/3 z-20 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full border border-gray-100 bg-white shadow-md hover:bg-gray-50"
                >
                    <ChevronLeft className="h-5 w-5 text-gray-700" />
                </button>

                <div
                    ref={desktopRef}
                    className="scrollbar-hide scroll-smooth overflow-x-auto pb-4"
                >
                    <div className="flex w-max space-x-5">
                        {shownProducts.map((product) => (
                            <Under999ProductCard
                                key={product.id}
                                product={product}
                                userId={userId}
                            />
                        ))}
                    </div>
                </div>

                <button
                    onClick={() => scroll(desktopRef, "right")}
                    className="absolute right-2 top-1/3 z-20 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full border border-gray-100 bg-white shadow-md hover:bg-gray-50"
                >
                    <ChevronRight className="h-5 w-5 text-gray-700" />
                </button>
            </div>

            {/* MOBILE */}
            <div className="scrollbar-hide overflow-x-auto px-4 pb-4 md:hidden">
                <div ref={mobileRef} className="flex space-x-3">
                    {shownProducts.map((product) => (
                        <Under999ProductCard
                            key={product.id}
                            product={product}
                            userId={userId}
                        />
                    ))}
                </div>
            </div>
        </section>
    );
}
