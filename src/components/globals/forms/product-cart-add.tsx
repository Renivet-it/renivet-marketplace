"use client";

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
import { DEFAULT_MESSAGES } from "@/config/const";
import { trpc } from "@/lib/trpc/client";
import { cn, convertPaiseToRupees, formatPriceTag } from "@/lib/utils";
import {
    CachedCart,
    CreateCart,
    createCartSchema,
    ProductWithBrand,
} from "@/lib/validations";
import { zodResolver } from "@hookform/resolvers/zod";
import { redirect } from "next/navigation";
import { useQueryState } from "nuqs";
import { useCallback, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { WishlistButton } from "../buttons";
import { Spinner } from "@/components/ui/spinner";

interface PageProps {
    initialCart?: CachedCart[];
    product: ProductWithBrand;
    userId?: string;
    isWishlisted: boolean;
}

export function ProductCartAddForm({
    product,
    isWishlisted,
    initialCart,
    userId,
}: PageProps) {
    // const router = useRouter();
    const [isProductWishlisted, setIsProductWishlisted] =
        useState(isWishlisted);
    const [selectedSku, setSelectedSku] = useQueryState("sku", {
        defaultValue: product.variants?.[0]?.nativeSku,
    });
    const [isAddedToCart, setIsAddedToCart] = useState(false);
    const { data: user, isPending: isUserFetching } =
        trpc.general.users.currentUser.useQuery();

    const { data: userCart, refetch } =
        trpc.general.users.cart.getCartForUser.useQuery(
            { userId: userId! },
            { enabled: !!userId, initialData: initialCart }
        );

    const selectedVariant = useMemo(() => {
        if (!product.productHasVariants || !selectedSku) return null;
        return (
            product.variants.find(
                (variant) => variant.nativeSku === selectedSku
            ) ?? null
        );
    }, [product.productHasVariants, product.variants, selectedSku]);

    const isProductInCart = useMemo(() => {
        if (!userCart) return false;

        if (!product.productHasVariants) {
            return userCart.some(
                (item) => item.productId === product.id && !item.variantId
            );
        }

        if (!selectedSku || !selectedVariant) return false;

        return userCart.some(
            (item) =>
                item.productId === product.id &&
                item.variantId === selectedVariant.id
        );
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [userCart, selectedSku, product.productHasVariants]);

    const getAvailableVariantsForOption = useCallback(
        (
            optionId: string,
            valueId: string,
            currentSelections: Record<string, string>
        ) => {
            const testSelection = {
                ...currentSelections,
                [optionId]: valueId,
            };

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

            const totalStock = matchingVariants.reduce(
                (sum, variant) => sum + (variant.quantity || 0),
                0
            );
            return totalStock;
        },
        [product.variants]
    );

    const currentSelections = useMemo(() => {
        if (!selectedVariant) return {};
        return selectedVariant.combinations;
    }, [selectedVariant]);

    const form = useForm<CreateCart>({
        resolver: zodResolver(createCartSchema),
        defaultValues: {
            productId: product.id,
            variantId: selectedVariant?.id || null,
            quantity: 1,
            userId: userId ?? "unknown",
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
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [selectedSku]);

    const productCompareAtPrice = useMemo(() => {
        if (!product.productHasVariants) return product.compareAtPrice;
        if (!selectedVariant) return null;

        return productPrice > selectedVariant.price
            ? null
            : selectedVariant.compareAtPrice;
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [selectedSku, productPrice]);

    const { mutate: addToCart, isPending } =
        trpc.general.users.cart.addProductToCart.useMutation({
            // onMutate: () => {
            //     toast.success(
            //         isProductInCart
            //             ? "Increased quantity in cart"
            //             : "Added to cart"
            //     );
            // },
            onMutate: () => {
                toast.success(
                  isProductInCart ? "Increased quantity in Cart" : "Added to Cart!",
                  {
                    position: "top-right",
                    duration: 3000,
                    className:
                      "bg-green-100 text-green-800 border border-green-300 rounded-md shadow-lg flex items-center gap-2",
                    icon: <Icons.CheckCircle className="size-5" />,
                  }
                );
              },
            onSuccess: () => {
                setIsAddedToCart(true);
                refetch();
            },
            onError: (err) => {
                toast.error(err.message);
            },
        });

    return (
        <>
            <div className="md:space-y-1">
                <div className="flex items-end gap-2">
                    <p className="text-2xl font-semibold md:text-3xl">
                        {formatPriceTag(
                            parseFloat(convertPaiseToRupees(productPrice)),
                            true
                        )}
                    </p>

                    {productCompareAtPrice && productCompareAtPrice > productPrice && (
                        <div className="flex items-center gap-2 text-xs font-semibold md:text-sm">
                            <p className="text-red-800 line-through">
                                {formatPriceTag(
                                    parseFloat(
                                        convertPaiseToRupees(
                                            productCompareAtPrice
                                        )
                                    ),
                                    true
                                )}
                            </p>

        {/* <p className="text-accent/80">
            (
            {formatPriceTag(
                parseFloat(
                    convertPaiseToRupees(
                        productCompareAtPrice - productPrice
                    )
                )
            )}{" "}
            OFF)
        </p>
         */}

        <p className="text-accent/80">
            ({Math.round(
                (
                    (parseFloat(convertPaiseToRupees(productCompareAtPrice)) -
                        parseFloat(convertPaiseToRupees(productPrice))) /
                    parseFloat(convertPaiseToRupees(productCompareAtPrice))
                ) * 100
            )}% OFF)
        </p>
                        </div>
                    )}
                </div>

                <p className="text-xs font-semibold text-accent/80 md:text-sm">
                    inclusive of all taxes
                </p>
            </div>

            <Form {...form}>
                <form
                    onSubmit={form.handleSubmit((values) => {
                        if (isUserFetching)
                            return toast.error(
                                DEFAULT_MESSAGES.ERRORS.USER_FETCHING
                            );
                        if (!userId || !user) redirect("/auth/signin");
                        if (user.roles.length > 0)
                            return toast.error(
                                DEFAULT_MESSAGES.ERRORS.USER_NOT_CUSTOMER
                            );

                        if (
                            !product.isAvailable ||
                            !product.isActive ||
                            !product.isPublished ||
                            product.isDeleted ||
                            product.verificationStatus !== "approved"
                        )
                            return toast.error(
                                "Requested product is not available"
                            );

                        addToCart(values);
                    })}
                >
                    <div className="space-y-6">
                        {product.productHasVariants &&
                            product.options.map((option) => (
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
                                                                            "flex cursor-pointer items-center justify-center rounded-full border px-5 py-3 text-sm font-medium peer-data-[state=checked]:border-primary peer-data-[state=checked]:bg-secondary peer-data-[state=checked]:text-primary-foreground",
                                                                            (!isAvailable ||
                                                                                stockCount ===
                                                                                    0) &&
                                                                                "cursor-not-allowed opacity-50",
                                                                            "relative"
                                                                        )}
                                                                    >
                                                                        {
                                                                            value.name
                                                                        }
                                                                    </Label>

                                                                    {lowStock && (
                                                                        <span className="whitespace-nowrap text-center text-xs text-red-500">
                                                                            Only{" "}
                                                                            {
                                                                                stockCount
                                                                            }{" "}
                                                                            left
                                                                        </span>
                                                                    )}
                                                                    {stockCount ===
                                                                        0 && (
                                                                        <span className="text-center text-xs text-red-500">
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

                        <div className="flex flex-col gap-2 md:flex-row md:gap-4">
                            <Button
                                type="submit"
                                size="lg"
                                className="w-full rounded-sm bg-secondary font-semibold uppercase md:h-14 md:basis-2/4 md:text-base"
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
                                          e.preventDefault(); // Prevent form submission
                                          redirect("/mycart");
                                      }
                                      // Default form submission handles addToCart
                                  }}
                            >
                                                {isPending ? (
                                            <>
                                            <Icons.Loader2 className="mr-2 size-5 animate-spin" />
                                            Adding to Cart
                                            </>
                                        ) : isAddedToCart ? (
                                            <>
                                            Go to Cart
                                            <Icons.ArrowRight className="ml-2 size-5" />
                                            </>
                                        ) : (
                                            <>
                                            <Icons.ShoppingCart className="mr-2 size-5" />
                                            {!product.isAvailable ||
                                            (selectedVariant &&
                                                (selectedVariant.isDeleted || selectedVariant?.quantity === 0)) ||
                                            (product.productHasVariants && !selectedVariant)
                                                ? "Out of Stock"
                                                : "Add to Cart"}
                                            </>
                                        )}
                            </Button>

                            <WishlistButton
                                type="button"
                                variant="outline"
                                size="lg"
                                className={cn(
                                    "group w-full rounded-sm font-semibold uppercase hover:bg-secondary md:h-14 md:basis-1/3 md:text-base"
                                )}
                                userId={userId}
                                productId={product.id}
                                isProductWishlisted={isProductWishlisted}
                                setIsProductWishlisted={setIsProductWishlisted}
                                iconClassName={cn(
                                    isWishlisted &&
                                        "fill-primary stroke-primary group-hover:fill-background group-hover:stroke-background"
                                )}
                            />
                        </div>
                    </div>
                </form>
            </Form>
        </>
    );
}
