"use client";

import { Button } from "@/components/ui/button-general";
import { DialogClose, DialogFooter } from "@/components/ui/dialog-general";
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
import { trpc } from "@/lib/trpc/client";
import {
    cn,
    convertPaiseToRupees,
    formatPriceTag,
    handleClientError,
} from "@/lib/utils";
import {
    CachedWishlist,
    CreateCart,
    createCartSchema,
} from "@/lib/validations";
import { zodResolver } from "@hookform/resolvers/zod";
import { useCallback, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

interface PageProps {
    item: CachedWishlist;
    userId: string;
}

export function ProductCartMoveForm({ item: { product }, userId }: PageProps) {
    const [selectedSku, setSelectedSku] = useState<string | undefined>(
        product.variants?.[0]?.nativeSku
    );

    const selectedVariant = product.variants.find(
        (variant) => variant.nativeSku === selectedSku
    );

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
            userId,
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

    const { refetch: refetchCart } =
        trpc.general.users.cart.getCartForUser.useQuery({
            userId,
        });
    const { refetch: refetchWishlist } =
        trpc.general.users.wishlist.getWishlist.useQuery({ userId });

    const { mutate: moveToCart, isPending: isMoving } =
        trpc.general.users.wishlist.moveProductToCart.useMutation({
            onMutate: () => {
                const toastId = toast.loading("Moving to cart...");
                return { toastId };
            },
            onSuccess: ({ type }, _, { toastId }) => {
                toast.success(
                    type === "add"
                        ? "Added to cart"
                        : "Increased quantity in cart",
                    { id: toastId }
                );
                refetchCart();
                refetchWishlist();
            },
            onError: (err, _, ctx) => {
                return handleClientError(err.message, ctx?.toastId);
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

                    {productCompareAtPrice && (
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

                            <p className="text-accent/80">
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
                        </div>
                    )}
                </div>

                <p className="text-xs font-semibold text-accent/80 md:text-sm">
                    + 2% gateway fee at checkout
                </p>
            </div>

            <Form {...form}>
                <form
                    className="space-y-3 md:space-y-5"
                    onSubmit={form.handleSubmit((values) => {
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

                        moveToCart(values);
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
                                                    className="flex flex-wrap items-center gap-2"
                                                >
                                                    {option.values.map(
                                                        (value) => {
                                                            const isAvailable =
                                                                getAvailableVariantsForOption(
                                                                    option.id,
                                                                    value.id,
                                                                    currentSelections
                                                                );

                                                            return (
                                                                <div
                                                                    key={
                                                                        value.id
                                                                    }
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
                                                                            !isAvailable
                                                                        }
                                                                    />

                                                                    <Label
                                                                        htmlFor={
                                                                            value.id
                                                                        }
                                                                        className={cn(
                                                                            "flex cursor-pointer items-center justify-center rounded-full border p-2 px-6 text-sm font-medium peer-data-[state=checked]:border-primary peer-data-[state=checked]:bg-primary peer-data-[state=checked]:text-primary-foreground",
                                                                            !isAvailable &&
                                                                                "cursor-not-allowed opacity-50"
                                                                        )}
                                                                    >
                                                                        {
                                                                            value.name
                                                                        }
                                                                    </Label>
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
                    </div>

                    <DialogFooter>
                        <DialogClose asChild>
                            <Button type="reset" variant="ghost" size="sm">
                                Cancel
                            </Button>
                        </DialogClose>

                        <Button
                            type="submit"
                            size="sm"
                            disabled={
                                isMoving ||
                                !product.isAvailable ||
                                (selectedVariant &&
                                    (selectedVariant.isDeleted ||
                                        selectedVariant?.quantity === 0))
                            }
                        >
                            Move to Cart
                        </Button>
                    </DialogFooter>
                </form>
            </Form>
        </>
    );
}
