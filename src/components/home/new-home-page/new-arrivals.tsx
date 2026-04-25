"use client";
import { Spinner } from "@/components/ui/spinner";
import { showAddToCartToast } from "@/components/globals/custom-toasts/add-to-cart-toast";
import { AnimatedProductLink } from "@/components/home/new-home-page/animated-product-link";
import { Icons } from "@/components/icons";
import { useAddToCartTracking } from "@/lib/hooks/useAddToCartTracking";
import { useGuestWishlist } from "@/lib/hooks/useGuestWishlist";
import { trpc } from "@/lib/trpc/client";
import { cn, convertPaiseToRupees, formatPriceTag } from "@/lib/utils";
import { handleCartFlyAnimation } from "@/lib/utils/cartAnimation";
import { ChevronLeft, ChevronRight, Layers } from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Dialog, DialogContent, DialogTrigger, DialogTitle } from "@/components/ui/dialog-general";
import React, { useEffect, useState } from "react";
import { toast } from "sonner";

function useGuestCart() {
    const [guestCart, setGuestCart] = useState<any[]>([]);
    useEffect(() => {
        try { const s = localStorage.getItem("guest_cart"); if (s) setGuestCart(JSON.parse(s)); } catch { setGuestCart([]); }
    }, []);
    const addToGuestCart = (item: any) => {
        const prev = (() => { try { const s = localStorage.getItem("guest_cart"); return s ? JSON.parse(s) : []; } catch { return []; } })();
        const existing = prev.find((x: any) => x.productId === item.productId && (x.variantId || null) === (item.variantId || null));
        const updated = existing ? prev.map((x: any) => x.productId === item.productId && (x.variantId || null) === (item.variantId || null) ? { ...x, quantity: x.quantity + item.quantity } : x) : [...prev, item];
        localStorage.setItem("guest_cart", JSON.stringify(updated));
        setGuestCart(updated);
        window.dispatchEvent(new Event("guestCartUpdated"));
        item.fullProduct ? showAddToCartToast(item.fullProduct, null, existing ? "Increased quantity in Cart" : "Item added to cart!") : toast.success(existing ? "Updated Cart" : "Added to Cart!");
    };
    return { guestCart, addToGuestCart };
}

interface Product {
    slug: any; id: string; title: string; description?: string; isAvailable?: boolean;
    media: { mediaItem: { url: string } }[];
    brand?: { name: string }; brandId?: string;
    compareAtPrice?: number; price?: number;
    variants?: { id: string; price: number; compareAtPrice?: number; combinations?: any; image?: string }[];
    options?: { id: string; name: string; values: { id: string; name: string }[] }[];
    specifications?: { key: string; value: string }[];
}
interface ProductWrapper { id: string; category: string; product: Product; }
interface ProductGridProps extends React.HTMLAttributes<HTMLDivElement> { products: ProductWrapper[]; userId?: string; }

const SECTIONS = ["Most Ordered", "In Season", "Basic Collection"] as const;
type Section = (typeof SECTIONS)[number];

export function ProductGridNewArrivals({ className, products, userId, ...props }: ProductGridProps) {
    const [activeTab, setActiveTab] = useState<Section>("Most Ordered");
    if (!products?.length) return null;
    const availableTabs = SECTIONS.filter(s => products.some(p => p.category === s));
    const sectionProducts = products.filter(p => p.category === activeTab);

    return (
        <section className={cn("w-full bg-white py-10 md:py-14", className)} {...props}>
            <div className="mx-auto max-w-screen-3xl px-4 sm:px-6 lg:px-8">
                <div className="mb-8 flex flex-col items-start">
                    <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-gray-500 md:text-[11px]">
                        Curated For You
                    </span>
                    <h2 className="mt-2 font-playfair text-[28px] font-normal leading-[1.3] text-gray-900 md:text-[36px] uppercase">
                        New Arrivals
                    </h2>
                    
                    <div className="mt-6 flex items-center border border-gray-200 overflow-hidden w-fit rounded-md">
                        {availableTabs.map(tab => {
                            const isActive = activeTab === tab;
                            const IconComponent = tab === "Most Ordered" ? Icons.Sparkles : tab === "Basic Collection" ? Layers : Icons.Sun;
                            return (
                                <button key={tab} onClick={() => setActiveTab(tab)}
                                    className={cn(
                                        "flex items-center gap-2 px-8 py-2.5 text-[11px] font-semibold uppercase tracking-[0.15em] transition-all duration-200",
                                        isActive 
                                            ? "bg-[#222] text-white" 
                                            : "bg-white text-gray-500 hover:text-gray-900 hover:bg-gray-50"
                                    )}>
                                    <IconComponent className="w-3.5 h-3.5" />
                                    {tab}
                                </button>
                            );
                        })}
                    </div>
                </div>
                <div className="grid grid-cols-3 gap-3 md:grid-cols-4 md:gap-5 lg:grid-cols-5 xl:grid-cols-7">
                    {sectionProducts.map(({ product }) => (
                        <ProductCard key={product.id} product={product} userId={userId} />
                    ))}
                </div>
            </div>
        </section>
    );
}

function ProductCard({ product, userId }: { product: Product; userId?: string }) {
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
    const mediaUrls = Array.from(new Set(product.media?.filter(m => m.mediaItem?.url).map(m => m.mediaItem.url))) as string[];
    const imageUrl = mediaUrls[0] || "https://4o4vm2cu6g.ufs.sh/f/HtysHtJpctzNNQhfcW4g0rgXZuWwadPABUqnljV5RbJMFsx1";
    const quickViewImages = Array.from(new Set([imageUrl, ...mediaUrls])).filter(Boolean) as string[];
    const productUrl = product.slug ? `/products/${product.slug}` : "/shop";

    const selectedVariant = React.useMemo(() => {
        if (!product.variants?.length) return null;
        if (!product.options?.length || !Object.keys(selectedOptions).length) return product.variants[0];
        return product.variants.find(v => Object.entries(selectedOptions).every(([oid, vid]) => (v.combinations as any)?.[oid] === vid)) || product.variants[0];
    }, [product.variants, product.options, selectedOptions]);

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
            else { addToGuestWishlist({ productId: product.id, variantId: null, title: product.title, brand: product.brand?.name, price: rawPrice, image: imageUrl, sku: null, fullProduct: product }); toast.success("Added to Wishlist!"); }
            setIsWishlisted(true);
        } catch (err: any) { toast.error(err.message || "Could not add to wishlist"); }
    };

    const handleQuickAddCart = async (e: React.MouseEvent) => {
        e.preventDefault(); e.stopPropagation();
        handleCartFlyAnimation(e, imageUrl);
        try {
            await trackAddToCartEvent({ productId: product.id, brandId: product.brandId || "", productTitle: product.title, brandName: product.brand?.name, productPrice: rawPrice, quantity });
            if (userId) { await addToCart({ productId: product.id, variantId: selectedVariant?.id || null, quantity, userId }); showAddToCartToast(product, selectedVariant, "Item added to cart!"); }
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
        <div className="group/card relative flex flex-col cursor-pointer overflow-hidden bg-white">
            <AnimatedProductLink href={productUrl} className="block">
                <div className="relative aspect-[3/4] w-full overflow-hidden bg-[#F5F5F5]">
                    <Image src={imageUrl} alt={product.title} fill className="object-cover transition-transform duration-500 group-hover/card:scale-105" sizes="(max-width: 640px) 33vw, 14vw" />
                    {discount && discount > 0 && <span className="absolute left-0 top-2 rounded-r-sm bg-[#E95123] px-2 py-0.5 text-[9px] font-bold uppercase tracking-wide text-white">-{discount}%</span>}

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

                        <DialogContent className="max-h-[95dvh] w-[96vw] max-w-5xl overflow-hidden rounded-md p-0 md:h-[85vh]">
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
                                        {product.options?.map(opt => {
                                            const selectedVal = selectedOptions[opt.id] || opt.values[0]?.id;
                                            return (
                                                <div key={opt.id}>
                                                    <div className="mb-2 text-xs md:text-sm flex items-center gap-2">
                                                        <span className="font-medium text-gray-900">{opt.name} :</span>
                                                        <span className="text-gray-500">{opt.values.find(v => v.id === selectedVal)?.name}</span>
                                                    </div>
                                                    <div className="flex flex-wrap gap-1.5 md:gap-2.5">
                                                        {opt.values.map(val => (
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

                                        {product.specifications && product.specifications.length > 0 && (
                                            <div className="mt-4 pt-4 border-t border-gray-100">
                                                <p className="text-[9px] uppercase tracking-[0.18em] text-gray-400 font-medium mb-3">Specifications</p>
                                                <div className="grid grid-cols-2 gap-2">
                                                    {product.specifications.map((spec, i) => (
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

                <div className="pt-2 pb-1">
                    <h3 className="truncate text-[11px] font-normal text-gray-800 sm:text-xs leading-tight">{product.title}</h3>
                    <div className="mt-1 flex items-baseline gap-1.5">
                        <span className="text-[12px] font-semibold text-gray-900">₹{price}</span>
                        {displayOriginal && <span className="text-[10px] text-gray-400 line-through">₹{displayOriginal}</span>}
                    </div>
                </div>
            </AnimatedProductLink>
        </div>
    );
}
