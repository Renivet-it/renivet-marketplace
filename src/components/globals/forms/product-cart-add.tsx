"use client";

import { trackAddToCartCapi } from "@/actions/analytics";
import { trackAddToCart } from "@/actions/track-product";
import { Icons } from "@/components/icons";
import { Button } from "@/components/ui/button-general";
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { RichTextViewer } from "@/components/ui/rich-text-viewer";
import { getColorHex } from "@/lib/color-utils";
import { fbEvent } from "@/lib/fbpixel";
import { useGuestWishlist } from "@/lib/hooks/useGuestWishlist";
import { trpc } from "@/lib/trpc/client";
import {
    cn,
    convertPaiseToRupees,
    formatPriceTag,
    getAbsoluteURL,
} from "@/lib/utils";
import {
    CachedCart,
    CreateCart,
    createCartSchema,
    ProductWithBrand,
} from "@/lib/validations";
import { useUser } from "@clerk/nextjs";
import { zodResolver } from "@hookform/resolvers/zod";
import { redirect, useRouter } from "next/navigation";
import { useQueryState } from "nuqs";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { DeliveryOption } from "../../products/product/product-delivery";
import { WishlistButton } from "../buttons";

//
// 🔹 Guest cart hook
//
function useGuestCart() {
    const [guestCart, setGuestCart] = useState<any[]>([]);

    // Load guest cart from localStorage
    useEffect(() => {
        const stored = localStorage.getItem("guest_cart");
        if (stored) setGuestCart(JSON.parse(stored));
    }, []);

    // 🔥 Listen for custom events to update cart
    useEffect(() => {
        const handleCartUpdate = () => {
            const stored = localStorage.getItem("guest_cart");
            setGuestCart(stored ? JSON.parse(stored) : []);
        };

        window.addEventListener("guestCartUpdated", handleCartUpdate);
        window.addEventListener("storage", handleCartUpdate);

        return () => {
            window.removeEventListener("guestCartUpdated", handleCartUpdate);
            window.removeEventListener("storage", handleCartUpdate);
        };
    }, []);

    const addToGuestCart = (item: any) => {
        const stored = localStorage.getItem("guest_cart");
        const prev = stored ? JSON.parse(stored) : [];

        const existing = prev.find(
            (x: any) =>
                x.productId === item.productId &&
                (x.variantId || null) === (item.variantId || null)
        );

        let updated;
        if (existing) {
            updated = prev.map((x: any) =>
                x.productId === item.productId &&
                (x.variantId || null) === (item.variantId || null)
                    ? { ...x, quantity: x.quantity + item.quantity }
                    : x
            );
            toast.success("Increased quantity in Cart"); // ✅ toast for guest
        } else {
            updated = [...prev, item];
            toast.success("Added to Cart!"); // ✅ toast for guest
        }

        localStorage.setItem("guest_cart", JSON.stringify(updated));
        setGuestCart(updated);

        // ✅ Defer event so Navbar updates safely
        setTimeout(() => {
            window.dispatchEvent(new Event("guestCartUpdated"));
        }, 0);
    };

    const clearGuestCart = () => {
        localStorage.removeItem("guest_cart");
        setGuestCart([]);
        window.dispatchEvent(new Event("guestCartUpdated"));
    };

    return { guestCart, addToGuestCart, clearGuestCart };
}

//
// 🔹 ProductCartAddForm
//
interface PageProps {
    initialCart?: CachedCart[];
    product: ProductWithBrand;
    userId?: string;
    isWishlisted: boolean;
    isProductWishlisted?: boolean;
    setIsProductWishlisted?: (value: boolean) => void;
    initialZipCode?: string;
    warehousePincode: string | null | undefined;
    estimatedDelivery?: string;
    setZipCode: (zip: string) => void;
    setEstimatedDelivery: (date: string) => void;
}

export function ProductCartAddForm({
    product,
    isWishlisted,
    isProductWishlisted: parentIsProductWishlisted,
    setIsProductWishlisted: parentSetIsProductWishlisted,
    initialCart,
    userId,
    initialZipCode,
    warehousePincode,
    estimatedDelivery,
    setZipCode,
    setEstimatedDelivery,
}: PageProps) {
    const { guestCart, addToGuestCart } = useGuestCart();
    const { guestWishlist, addToGuestWishlist } = useGuestWishlist();

    // Floating bar: show only when inline buttons scroll out of view on mobile
    const buttonsRef = useRef<HTMLDivElement>(null);
    const [showFloatingBar, setShowFloatingBar] = useState(false);

    useEffect(() => {
        const el = buttonsRef.current;
        if (!el) return;

        const observer = new IntersectionObserver(
            ([entry]) => setShowFloatingBar(!entry.isIntersecting),
            { threshold: 0 }
        );
        observer.observe(el);
        return () => observer.disconnect();
    }, []);
    const router = useRouter();
    const { user } = useUser();

    const handleAddProductCart = async (productId: string, brandId: string) => {
        try {
            await trackAddToCart(productId, brandId);

            // 🔹 Generate Event ID
            const eventId = crypto.randomUUID();

            // 🔹 FB Pixel (Client)
            fbEvent(
                "AddToCart",
                {
                    content_ids: [productId],
                    content_name: product.title,
                    content_category: product.brand?.name || "Unknown Brand",
                    content_type: "product",
                    value: parseFloat(convertPaiseToRupees(productPrice)),
                    currency: "INR",
                    brand_id: brandId,
                    quantity: 1,
                    ...(user
                        ? {
                              em: user.primaryEmailAddress?.emailAddress,
                              ph: user.primaryPhoneNumber?.phoneNumber,
                              fn: user.firstName ?? undefined,
                              ln: user.lastName ?? undefined,
                              external_id: user.id,
                          }
                        : {}),
                },
                { eventId }
            );

            // 🔹 CAPI (Server)
            const userData = {
                em: user?.primaryEmailAddress?.emailAddress,
                ph: user?.primaryPhoneNumber?.phoneNumber,
                fn: user?.firstName ?? undefined,
                ln: user?.lastName ?? undefined,
                external_id: user?.id,
                fb_login_id: user?.externalAccounts.find(
                    (acc) => acc.provider === "oauth_facebook"
                )?.externalId,
            };

            trackAddToCartCapi(
                eventId,
                userData,
                {
                    content_ids: [productId],
                    content_name: product.title,
                    content_category: product.brand?.name || "Unknown Brand",
                    content_type: "product",
                    value: parseFloat(convertPaiseToRupees(productPrice)),
                    currency: "INR",
                },
                getAbsoluteURL(window.location.href) // Send current URL
            ).catch((err) => console.error("CAPI Error:", err));
        } catch (error) {
            console.error("Failed to track click:", error);
        }
    };

    const [localIsProductWishlisted, setLocalIsProductWishlisted] =
        useState(isWishlisted);
    const isProductWishlisted =
        parentIsProductWishlisted !== undefined
            ? parentIsProductWishlisted
            : localIsProductWishlisted;
    const setIsProductWishlisted =
        parentSetIsProductWishlisted || setLocalIsProductWishlisted;

    // Find the variant with the lowest price to use as default
    const lowestPriceVariant = useMemo(() => {
        if (!product.variants?.length) return null;
        return product.variants.reduce(
            (min, variant) => (variant.price < min.price ? variant : min),
            product.variants[0]
        );
    }, [product.variants]);

    const [selectedSku, setSelectedSku] = useQueryState("sku", {
        defaultValue: lowestPriceVariant?.nativeSku,
    });
    const [isAddedToCart, setIsAddedToCart] = useState(false);
    const [isBuyNow, setIsBuyNow] = useState(false);
    const isBuyNowRef = useRef(false);

    // User cart
    const { data: userCart, refetch } =
        trpc.general.users.cart.getCartForUser.useQuery(
            { userId: userId! },
            { enabled: !!userId, initialData: initialCart }
        );

    // Selected variant
    const selectedVariant = useMemo(() => {
        if (!product.productHasVariants || !selectedSku) return null;
        return (
            product.variants.find(
                (variant) => variant.nativeSku === selectedSku
            ) ?? null
        );
    }, [product.productHasVariants, product.variants, selectedSku]);

    // Product in cart?
    const isProductInCart = useMemo(() => {
        const cart = userId ? userCart || [] : guestCart;

        if (!product.productHasVariants) {
            return cart.some(
                (item) => item.productId === product.id && !item.variantId
            );
        }

        if (!selectedSku || !selectedVariant) return false;

        return cart.some(
            (item) =>
                item.productId === product.id &&
                item.variantId === selectedVariant.id
        );
    }, [
        userId,
        userCart,
        guestCart,
        selectedSku,
        product.productHasVariants,
        selectedVariant,
        product.id,
    ]);

    // Variants utils
    const getAvailableVariantsForOption = useCallback(
        (
            optionId: string,
            valueId: string,
            currentSelections: Record<string, string>
        ) => {
            const testSelection = { ...currentSelections, [optionId]: valueId };
            return product.variants.some((variant) => {
                return Object.entries(testSelection).every(
                    ([key, value]) => variant.combinations[key] === value
                );
            });
        },
        [product.variants]
    );

    const getVariantStockByOption = useCallback(
        (
            optionId: string,
            valueId: string,
            currentSelections: Record<string, string>
        ) => {
            const matchingVariants = product.variants.filter((variant) => {
                const selections = {
                    ...currentSelections,
                    [optionId]: valueId,
                };
                return Object.entries(selections).every(
                    ([key, value]) => variant.combinations[key] === value
                );
            });

            return matchingVariants.reduce(
                (sum, variant) => sum + (variant.quantity || 0),
                0
            );
        },
        [product.variants]
    );

    const currentSelections = useMemo(() => {
        if (!selectedVariant) return {};
        return selectedVariant.combinations;
    }, [selectedVariant]);

    // Form
    const form = useForm<CreateCart>({
        resolver: zodResolver(createCartSchema),
        defaultValues: {
            productId: product.id,
            variantId: selectedVariant?.id || null,
            quantity: 1,
            userId: userId ?? "guest",
        },
    });

    const handleOptionSelect = useCallback(
        (optionId: string, valueId: string) => {
            const newSelections = { ...currentSelections, [optionId]: valueId };
            const matchingVariant = product.variants.find((variant) =>
                Object.entries(newSelections).every(
                    ([key, value]) => variant.combinations[key] === value
                )
            );
            if (matchingVariant) setSelectedSku(matchingVariant.nativeSku);
        },
        [currentSelections, product.variants, setSelectedSku]
    );

    const productPrice = useMemo(() => {
        if (!product.productHasVariants) return product.price ?? 0;
        if (!selectedVariant) return 0;
        return selectedVariant.price;
    }, [product, selectedVariant, selectedSku]);

    const productCompareAtPrice = useMemo(() => {
        if (!product.productHasVariants) return product.compareAtPrice;
        if (!selectedVariant) return null;
        return productPrice > selectedVariant.price
            ? null
            : selectedVariant.compareAtPrice;
    }, [product, selectedVariant, productPrice]);

    const sortedOptions = useMemo(() => {
        return [...product.options].sort((a, b) => {
            const order = ["color", "size"];
            const aIndex = order.indexOf(a.name.toLowerCase());
            const bIndex = order.indexOf(b.name.toLowerCase());
            if (aIndex === -1 && bIndex === -1) return 0;
            if (aIndex === -1) return 1;
            if (bIndex === -1) return -1;
            return aIndex - bIndex;
        });
    }, [product.options]);

    // Mutation for logged in users
    const { mutate: addToCart, isPending } =
        trpc.general.users.cart.addProductToCart.useMutation({
            onMutate: () => {
                toast.success(
                    isProductInCart
                        ? "Increased quantity in Cart"
                        : "Added to Cart!"
                );
            },
            onSuccess: () => {
                setIsAddedToCart(true);
                refetch?.();
            },
            onError: (err) => {
                toast.error(err.message);
            },
        });

    //
    // Render
    //
    return (
        <div className="space-y-6">
            {/* Price */}
            <div>
                <div className="flex items-end gap-2">
                    <p className="text-3xl font-semibold text-gray-900">
                        {formatPriceTag(
                            parseFloat(convertPaiseToRupees(productPrice)),
                            true
                        )}
                    </p>
                    {productCompareAtPrice &&
                        productCompareAtPrice > productPrice && (
                            <>
                                <p className="text-lg text-gray-400 line-through">
                                    {formatPriceTag(
                                        parseFloat(
                                            convertPaiseToRupees(
                                                productCompareAtPrice
                                            )
                                        ),
                                        true
                                    )}
                                </p>
                                <p className="text-lg font-semibold text-green-700">
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
                                            parseFloat(
                                                convertPaiseToRupees(
                                                    productCompareAtPrice
                                                )
                                            )) *
                                            100
                                    )}
                                    % OFF
                                </p>
                            </>
                        )}
                </div>
                {productCompareAtPrice &&
                    productCompareAtPrice > productPrice && (
                        <p className="mt-1 text-sm font-medium text-green-700">
                            You save{" "}
                            {formatPriceTag(
                                (productCompareAtPrice - productPrice) / 100,
                                true
                            )}
                        </p>
                    )}
                <p className="text-sm text-gray-500">inclusive of all taxes</p>
            </div>

            {/* Options */}
            <Form {...form}>
                <form
                    onSubmit={form.handleSubmit((values) => {
                        if (
                            !product.isAvailable ||
                            !product.isActive ||
                            !product.isPublished ||
                            product.isDeleted ||
                            product.verificationStatus !== "approved"
                        ) {
                            return toast.error(
                                "Requested product is not available"
                            );
                        }

                        if (userId) {
                            addToCart(values, {
                                onSuccess: () => {
                                    setIsAddedToCart(true);
                                    refetch?.();
                                    if (isBuyNowRef.current || isBuyNow)
                                        router.push(
                                            `/checkout?buy_now=true&item=${product.id}&variant=${selectedVariant?.id || ""}&qty=${values.quantity}`
                                        );
                                },
                            });
                        } else {
                            const cartItem = {
                                ...values, // productId, variantId, quantity
                                title: product.title,
                                brand: product.brand?.name,
                                price: productPrice, // paise
                                compareAtPrice: productCompareAtPrice,
                                image:
                                    selectedVariant?.image ??
                                    product.thumbnail ??
                                    null,
                                sku: selectedVariant?.nativeSku ?? null,
                                fullProduct: product, // 👈 quick fix: insert full product object
                            };

                            addToGuestCart(cartItem);
                            setIsAddedToCart(true);
                            if (isBuyNowRef.current || isBuyNow)
                                router.push(
                                    `/checkout?buy_now=true&item=${product.id}&variant=${selectedVariant?.id || ""}&qty=${values.quantity}`
                                );
                        }
                    })}
                >
                    <div className="space-y-6">
                        {/* Variant options */}
                        {product.productHasVariants &&
                            sortedOptions.map((option) => (
                                <FormField
                                    key={option.id}
                                    control={form.control}
                                    name="variantId"
                                    render={({ field }) => (
                                        <FormItem className="space-y-3">
                                            <FormLabel className="text-base font-semibold">
                                                {option.name}
                                            </FormLabel>
                                            <FormControl>
                                                <RadioGroup
                                                    value={
                                                        currentSelections[
                                                            option.id
                                                        ]
                                                    }
                                                    onValueChange={(value) => {
                                                        handleOptionSelect(
                                                            option.id,
                                                            value
                                                        );
                                                        const variant =
                                                            product.variants.find(
                                                                (v) =>
                                                                    Object.entries(
                                                                        {
                                                                            ...currentSelections,
                                                                            [option.id]:
                                                                                value,
                                                                        }
                                                                    ).every(
                                                                        ([
                                                                            k,
                                                                            val,
                                                                        ]) =>
                                                                            v
                                                                                .combinations[
                                                                                k
                                                                            ] ===
                                                                            val
                                                                    )
                                                            );
                                                        if (variant)
                                                            field.onChange(
                                                                variant.id
                                                            );
                                                    }}
                                                    className="flex flex-wrap gap-2"
                                                >
                                                    {option.values.map(
                                                        (value) => {
                                                            const isAvailable =
                                                                getAvailableVariantsForOption(
                                                                    option.id,
                                                                    value.id,
                                                                    currentSelections
                                                                );
                                                            const stockCount =
                                                                getVariantStockByOption(
                                                                    option.id,
                                                                    value.id,
                                                                    currentSelections
                                                                );
                                                            const lowStock =
                                                                stockCount >
                                                                    0 &&
                                                                stockCount < 5;

                                                            return (
                                                                <div
                                                                    key={
                                                                        value.id
                                                                    }
                                                                    className="flex flex-col items-center gap-2"
                                                                >
                                                                    <RadioGroupItem
                                                                        value={
                                                                            value.id
                                                                        }
                                                                        id={
                                                                            value.id
                                                                        }
                                                                        className="peer sr-only"
                                                                        disabled={
                                                                            !isAvailable ||
                                                                            stockCount ===
                                                                                0
                                                                        }
                                                                    />
                                                                    <Label
                                                                        htmlFor={
                                                                            value.id
                                                                        }
                                                                        className={cn(
                                                                            option.name.toLowerCase() ===
                                                                                "color"
                                                                                ? "h-8 w-8 rounded-full border"
                                                                                : "flex cursor-pointer items-center justify-center rounded-full border px-5 py-3 text-sm font-medium",
                                                                            currentSelections[
                                                                                option
                                                                                    .id
                                                                            ] ===
                                                                                value.id &&
                                                                                "border-black bg-gray-100",
                                                                            (!isAvailable ||
                                                                                stockCount ===
                                                                                    0) &&
                                                                                "cursor-not-allowed opacity-50"
                                                                        )}
                                                                        style={
                                                                            option.name.toLowerCase() ===
                                                                            "color"
                                                                                ? {
                                                                                      backgroundColor:
                                                                                          getColorHex(
                                                                                              value.name
                                                                                          ),
                                                                                  }
                                                                                : {}
                                                                        }
                                                                    >
                                                                        {option.name.toLowerCase() !==
                                                                            "color" &&
                                                                            value.name}
                                                                    </Label>
                                                                    {lowStock && (
                                                                        <span className="text-xs text-red-500">
                                                                            Only{" "}
                                                                            {
                                                                                stockCount
                                                                            }{" "}
                                                                            left
                                                                        </span>
                                                                    )}
                                                                    {stockCount ===
                                                                        0 && (
                                                                        <span className="text-xs text-red-500">
                                                                            Out
                                                                            of
                                                                            stock
                                                                        </span>
                                                                    )}
                                                                </div>
                                                            );
                                                        }
                                                    )}
                                                </RadioGroup>
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            ))}
                        {/* Delivery */}
                        <DeliveryOption
                            initialZipCode={initialZipCode}
                            warehousePincode={warehousePincode}
                            estimatedDelivery={estimatedDelivery || ""}
                            setZipCode={setZipCode}
                            setEstimatedDelivery={setEstimatedDelivery}
                        />

                        {/* Inline buttons (normal flow) */}
                        <div ref={buttonsRef} className="flex gap-2 sm:gap-4">
                            <Button
                                type="submit"
                                size="sm"
                                className={cn(
                                    "h-9 rounded-full bg-[#E0E2E1] px-5 text-sm font-medium text-black hover:bg-[#E0E2E1]",
                                    userId ? "flex-1" : "flex-1"
                                )}
                                disabled={
                                    !product.isAvailable ||
                                    (!!selectedVariant &&
                                        (selectedVariant.isDeleted ||
                                            selectedVariant?.quantity === 0)) ||
                                    (product.productHasVariants &&
                                        !selectedVariant) ||
                                    isPending
                                }
                                onClick={(e) => {
                                    if (isAddedToCart) {
                                        e.preventDefault();
                                        router.push("/mycart");
                                        return;
                                    }
                                    setIsBuyNow(false);
                                    isBuyNowRef.current = false;
                                    handleAddProductCart(
                                        product.id,
                                        product.brandId
                                    );
                                }}
                            >
                                {isPending ? (
                                    <>
                                        <Icons.Loader2 className="mr-2 size-5 animate-spin" />
                                        Adding...
                                    </>
                                ) : isAddedToCart ? (
                                    <>
                                        Go to Cart{" "}
                                        <Icons.ArrowRight className="ml-2 size-5" />
                                    </>
                                ) : (
                                    <>
                                        <Icons.ShoppingCart className="mr-2 size-5" />{" "}
                                        Add to Cart
                                    </>
                                )}
                            </Button>

                            {userId && (
                                <Button
                                    type="submit"
                                    size="lg"
                                    className="flex-1 rounded-full bg-black text-lg font-semibold text-white hover:bg-gray-800 md:hidden"
                                    disabled={
                                        !product.isAvailable ||
                                        (!!selectedVariant &&
                                            (selectedVariant.isDeleted ||
                                                selectedVariant?.quantity ===
                                                    0)) ||
                                        (product.productHasVariants &&
                                            !selectedVariant) ||
                                        isPending
                                    }
                                    onClick={(e) => {
                                        if (isAddedToCart) {
                                            e.preventDefault();
                                            router.push("/checkout");
                                            return;
                                        }
                                        setIsBuyNow(true);
                                        isBuyNowRef.current = true;
                                        handleAddProductCart(
                                            product.id,
                                            product.brandId
                                        );
                                    }}
                                >
                                    {isPending && isBuyNow ? (
                                        <>
                                            <Icons.Loader2 className="mr-2 size-5 animate-spin" />
                                            Wait...
                                        </>
                                    ) : (
                                        "Buy Now"
                                    )}
                                </Button>
                            )}

                            {userId ? (
                                <WishlistButton
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    className="hidden h-9 flex-1 rounded-full px-5 text-sm font-medium md:flex"
                                    userId={userId}
                                    productId={product.id}
                                    isProductWishlisted={isProductWishlisted}
                                    setIsProductWishlisted={
                                        setIsProductWishlisted
                                    }
                                    iconClassName={cn(
                                        isProductWishlisted &&
                                            "fill-primary stroke-primary"
                                    )}
                                />
                            ) : (
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    className="hidden h-9 flex-1 rounded-full px-5 text-sm font-medium md:flex"
                                    onClick={() => {
                                        addToGuestWishlist({
                                            productId: product.id,
                                            variantId:
                                                selectedVariant?.id || null,
                                            title: product.title,
                                            brand: product.brand?.name,
                                            price: productPrice,
                                            image:
                                                selectedVariant?.image ??
                                                product.thumbnail ??
                                                null,
                                            sku:
                                                selectedVariant?.nativeSku ??
                                                null,
                                            fullProduct: product,
                                        });
                                    }}
                                >
                                    <Icons.Heart
                                        className={cn(
                                            guestWishlist.some(
                                                (w) =>
                                                    w.productId ===
                                                        product.id &&
                                                    String(
                                                        w.variantId ?? ""
                                                    ) ===
                                                        String(
                                                            selectedVariant?.id ??
                                                                ""
                                                        )
                                            ) && "fill-primary stroke-primary"
                                        )}
                                    />
                                    Wishlist
                                </Button>
                            )}
                        </div>
                        {/* Size & fit */}
                        <div>
                            <RichTextViewer
                                content={product.sizeAndFit ?? "<p></p>"}
                                customClasses={{
                                    orderedList:
                                        "text-16 leading-[1.6] text-myntra-primary text-opacity-90",
                                    bulletList:
                                        "text-16 leading-[1.6] text-myntra-primary text-opacity-90",
                                    heading:
                                        "text-16 leading-[1.6] text-myntra-primary text-opacity-90",
                                }}
                                editorClasses="pt-3"
                            />
                        </div>
                    </div>

                    {/* Floating bottom bar — mobile only, visible when inline buttons are scrolled past */}
                    {showFloatingBar && (
                        <div className="fixed inset-x-0 bottom-0 z-50 border-t border-gray-200 bg-white px-4 py-3 shadow-[0_-4px_12px_rgba(0,0,0,0.1)] md:hidden">
                            <div className="flex gap-3">
                                <Button
                                    type="submit"
                                    size="lg"
                                    className={cn(
                                        "rounded-full bg-[#E0E2E1] text-base font-semibold text-black hover:bg-[#E0E2E1]",
                                        userId ? "flex-1" : "flex-1"
                                    )}
                                    disabled={
                                        !product.isAvailable ||
                                        (!!selectedVariant &&
                                            (selectedVariant.isDeleted ||
                                                selectedVariant?.quantity ===
                                                    0)) ||
                                        (product.productHasVariants &&
                                            !selectedVariant) ||
                                        isPending
                                    }
                                    onClick={(e) => {
                                        if (isAddedToCart) {
                                            e.preventDefault();
                                            router.push("/mycart");
                                            return;
                                        }
                                        setIsBuyNow(false);
                                        isBuyNowRef.current = false;
                                        handleAddProductCart(
                                            product.id,
                                            product.brandId
                                        );
                                    }}
                                >
                                    {isPending && !isBuyNow ? (
                                        <>
                                            <Icons.Loader2 className="mr-2 size-4 animate-spin" />
                                            Wait...
                                        </>
                                    ) : isAddedToCart ? (
                                        <>
                                            Go to Cart
                                            <Icons.ArrowRight className="ml-2 size-4" />
                                        </>
                                    ) : (
                                        <>
                                            <Icons.ShoppingCart className="mr-2 size-4" />
                                            Add to Cart
                                        </>
                                    )}
                                </Button>

                                {userId && (
                                    <Button
                                        type="submit"
                                        size="lg"
                                        className="flex-1 rounded-full bg-black text-base font-semibold text-white hover:bg-gray-800"
                                        disabled={
                                            !product.isAvailable ||
                                            (!!selectedVariant &&
                                                (selectedVariant.isDeleted ||
                                                    selectedVariant?.quantity ===
                                                        0)) ||
                                            (product.productHasVariants &&
                                                !selectedVariant) ||
                                            isPending
                                        }
                                        onClick={(e) => {
                                            if (isAddedToCart) {
                                                e.preventDefault();
                                                router.push("/checkout");
                                                return;
                                            }
                                            setIsBuyNow(true);
                                            isBuyNowRef.current = true;
                                            handleAddProductCart(
                                                product.id,
                                                product.brandId
                                            );
                                        }}
                                    >
                                        {isPending && isBuyNow ? (
                                            <>
                                                <Icons.Loader2 className="mr-2 size-4 animate-spin" />
                                                Wait...
                                            </>
                                        ) : (
                                            "Buy Now"
                                        )}
                                    </Button>
                                )}
                            </div>
                        </div>
                    )}
                </form>
            </Form>
        </div>
    );
}
