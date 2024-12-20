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
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Separator } from "@/components/ui/separator";
import { DEFAULT_MESSAGES } from "@/config/const";
import { trpc } from "@/lib/trpc/client";
import { cn } from "@/lib/utils";
import {
    CachedCart,
    CreateCart,
    createCartSchema,
    ProductWithBrand,
} from "@/lib/validations";
import { zodResolver } from "@hookform/resolvers/zod";
import { parseAsStringLiteral, useQueryState } from "nuqs";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { WishlistButton } from "../buttons";

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
    const [isProductWishlisted, setIsProductWishlisted] =
        useState(isWishlisted);

    const { data: user, isPending: isUserFetching } =
        trpc.general.users.currentUser.useQuery();

    const [color, setColor] = useQueryState("color", { defaultValue: "" });
    const [size, setSize] = useQueryState(
        "size",
        parseAsStringLiteral([
            "One Size",
            "XS",
            "S",
            "M",
            "L",
            "XL",
            "XXL",
        ] as const)
    );

    useEffect(() => {
        if (product.sizes.length === 1 && product.sizes[0].name === "One Size")
            setSize("One Size");

        if (product.colors.length === 1) setColor(product.colors[0].hex);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [product.sizes, product.colors]);

    const form = useForm<CreateCart>({
        resolver: zodResolver(createCartSchema),
        defaultValues: {
            color: product.colors.find((c) => c.hex === color) || null,
            productId: product.id,
            userId: userId,
            quantity: 1,
            size: product.sizes.find((s) => s.name === size)?.name,
        },
    });

    const { data: userCart, refetch } =
        trpc.general.users.cart.getCart.useQuery(
            { userId: userId! },
            { enabled: !!userId, initialData: initialCart }
        );

    const isProductInCart = userCart?.some(
        (item) =>
            item.productId === product.id &&
            item.size === size &&
            item.color?.hex === color
    );

    const { mutate: addToCart } =
        trpc.general.users.cart.addProductInCart.useMutation({
            onMutate: () => {
                toast.success(
                    isProductInCart
                        ? "Increased quantity in cart"
                        : "Added to cart"
                );
            },
            onSuccess: () => {
                refetch();
            },
            onError: (err) => {
                toast.error(err.message);
            },
        });

    return (
        <Form {...form}>
            <form
                className="space-y-3 md:space-y-5"
                onSubmit={form.handleSubmit((values) => {
                    if (isUserFetching)
                        return toast.error(
                            DEFAULT_MESSAGES.ERRORS.USER_FETCHING
                        );
                    if (!userId || !user)
                        return toast.error(
                            DEFAULT_MESSAGES.ERRORS.USER_NOT_LOGGED_IN
                        );
                    if (user.roles.length > 0)
                        return toast.error(
                            DEFAULT_MESSAGES.ERRORS.USER_NOT_CUSTOMER
                        );

                    if (product.colors.length > 0 && !values.color)
                        return form.setError("color", {
                            type: "required",
                            message: "Color is required",
                        });
                    if (!product.isAvailable)
                        return toast.error(
                            "This product is currently out of stock. You can still add it to your wishlist."
                        );

                    addToCart(values);
                })}
            >
                {product.colors.length > 0 && (
                    <FormField
                        control={form.control}
                        name="color"
                        render={({ field }) => (
                            <FormItem className="space-y-4">
                                <FormLabel className="font-semibold uppercase">
                                    More Colors
                                </FormLabel>

                                <FormControl>
                                    <RadioGroup
                                        onValueChange={(value) => {
                                            field.onChange(
                                                product.colors.find(
                                                    (c) => c.hex === value
                                                ) || null
                                            );
                                            setColor(value);
                                        }}
                                        defaultValue={field.value?.hex}
                                        className="flex flex-wrap gap-2"
                                        disabled={!product.isAvailable}
                                    >
                                        {product.colors.map((c) => (
                                            <FormItem key={c.name}>
                                                <FormControl>
                                                    <RadioGroupItem
                                                        value={c.hex}
                                                        id={c.name}
                                                        className="sr-only"
                                                        disabled={
                                                            !product.isAvailable
                                                        }
                                                    />
                                                </FormControl>

                                                <FormLabel htmlFor={c.name}>
                                                    <div className="flex flex-col items-center gap-2">
                                                        <div
                                                            title={c.name}
                                                            className={cn(
                                                                "size-12 cursor-pointer rounded-full border border-foreground/10",
                                                                c.hex ===
                                                                    color &&
                                                                    "outline outline-2 outline-offset-1",
                                                                !product.isAvailable &&
                                                                    "cursor-not-allowed opacity-50"
                                                            )}
                                                            style={{
                                                                backgroundColor:
                                                                    c.hex,
                                                            }}
                                                        >
                                                            <span className="sr-only">
                                                                {c.name}
                                                            </span>
                                                        </div>

                                                        <span
                                                            className={cn(
                                                                "text-sm",
                                                                c.hex ===
                                                                    color &&
                                                                    "font-semibold"
                                                            )}
                                                        >
                                                            {c.name}
                                                        </span>
                                                    </div>
                                                </FormLabel>
                                            </FormItem>
                                        ))}
                                    </RadioGroup>
                                </FormControl>

                                <FormMessage />
                            </FormItem>
                        )}
                    />
                )}

                <Separator />

                <FormField
                    control={form.control}
                    name="size"
                    render={({ field }) => (
                        <FormItem className="space-y-4">
                            <FormLabel className="font-semibold uppercase">
                                Select Size
                            </FormLabel>

                            <FormControl>
                                <RadioGroup
                                    onValueChange={(value) => {
                                        field.onChange(value);
                                        setSize(
                                            value as ProductWithBrand["sizes"][number]["name"]
                                        );
                                    }}
                                    defaultValue={field.value}
                                    className="flex flex-wrap gap-2"
                                    disabled={!product.isAvailable}
                                >
                                    {product.sizes.map((s) => (
                                        <FormItem key={s.name}>
                                            <FormControl>
                                                <RadioGroupItem
                                                    value={s.name}
                                                    id={s.name}
                                                    disabled={
                                                        s.quantity === 0 ||
                                                        !product.isAvailable
                                                    }
                                                    className="sr-only"
                                                />
                                            </FormControl>

                                            <FormLabel htmlFor={s.name}>
                                                <div className="flex flex-col items-center gap-2">
                                                    <div
                                                        title={s.name}
                                                        className={cn(
                                                            "flex size-12 cursor-pointer items-center justify-center rounded-full border border-foreground/30 p-2 text-sm",
                                                            s.name === size &&
                                                                "bg-primary text-background",
                                                            s.name ===
                                                                "One Size" &&
                                                                "size-auto px-3",
                                                            (s.quantity === 0 ||
                                                                !product.isAvailable) &&
                                                                "cursor-not-allowed opacity-50"
                                                        )}
                                                    >
                                                        <span>{s.name}</span>
                                                    </div>

                                                    {s.quantity < 3 && (
                                                        <span className="text-xs text-destructive">
                                                            {s.quantity} left
                                                        </span>
                                                    )}
                                                </div>
                                            </FormLabel>
                                        </FormItem>
                                    ))}
                                </RadioGroup>
                            </FormControl>

                            <FormMessage />
                        </FormItem>
                    )}
                />

                <div className="flex flex-col gap-2 md:flex-row md:gap-4">
                    <Button
                        type="submit"
                        size="lg"
                        className="w-full font-semibold uppercase md:h-12 md:basis-2/3 md:text-base"
                        disabled={!product.isAvailable}
                    >
                        <Icons.ShoppingCart />
                        Add to Cart
                    </Button>

                    <WishlistButton
                        type="button"
                        variant="outline"
                        size="lg"
                        className={cn(
                            "group w-full font-semibold uppercase md:h-12 md:basis-1/3 md:text-base"
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

                {!product.isAvailable && (
                    <p className="text-sm text-destructive">
                        * This product is currently out of stock. You can still
                        add it to your wishlist.
                    </p>
                )}
            </form>
        </Form>
    );
}
