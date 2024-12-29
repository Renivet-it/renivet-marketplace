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
import { Input } from "@/components/ui/input-general";
import { Label } from "@/components/ui/label";
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
import { useQueryState } from "nuqs";
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

    const [size, setSize] = useQueryState("size");
    const [color, setColor] = useQueryState("color");

    const [sku, setSku] = useState<string | undefined>();

    const form = useForm<CreateCart>({
        resolver: zodResolver(createCartSchema),
        defaultValues: {
            userId: userId,
            quantity: 1,
            sku: sku || "",
        },
    });

    const sizes = Array.from(
        new Set(product.variants.map((v) => v.size).sort())
    );

    const colors = product.variants
        .filter((v) => !v.isDeleted)
        .filter((v) => v.size === size)
        .map((v) => v.color)
        .sort(
            (a, b) => a.name.localeCompare(b.name) || a.hex.localeCompare(b.hex)
        );

    useEffect(() => {
        const currentSku = product.variants.find(
            (v) => v.color.hex === color && v.size === size
        )?.sku;

        setSku(currentSku);
        form.setValue("sku", currentSku || "");
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [color, size]);

    const { data: userCart, refetch } =
        trpc.general.users.cart.getCart.useQuery(
            { userId: userId! },
            { enabled: !!userId, initialData: initialCart }
        );

    const isProductInCart = userCart?.some((item) => item.sku === sku);

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

                    if (!values.sku)
                        return toast.error("Please select a size or color");

                    if (!product.isAvailable)
                        return toast.error(
                            "This product is currently out of stock. You can still add it to your wishlist."
                        );

                    addToCart(values);
                })}
            >
                <div className="space-y-4">
                    <Label className="font-semibold uppercase">
                        Select Size
                    </Label>

                    <RadioGroup
                        onValueChange={(value) => {
                            setSize(value);
                            setColor(null);
                        }}
                        defaultValue={size!}
                        className="flex flex-wrap gap-2"
                        disabled={!product.isAvailable}
                    >
                        {sizes.map((s, i) => (
                            <div key={i}>
                                <RadioGroupItem
                                    value={s}
                                    id={s}
                                    disabled={!product.isAvailable}
                                    className="sr-only"
                                />

                                <Label htmlFor={s}>
                                    <div className="flex flex-col items-center gap-2">
                                        <div
                                            title={s}
                                            className={cn(
                                                "flex size-12 cursor-pointer items-center justify-center rounded-full border border-foreground/30 p-2 text-sm",
                                                s === size &&
                                                    "bg-primary text-background",
                                                s.length > 2 &&
                                                    "size-auto px-3",
                                                !product.isAvailable &&
                                                    "cursor-not-allowed opacity-50"
                                            )}
                                        >
                                            <span>{s}</span>
                                        </div>
                                    </div>
                                </Label>
                            </div>
                        ))}
                    </RadioGroup>
                </div>

                {size && (
                    <>
                        <Separator />

                        {
                            <div className="space-y-4">
                                <Label className="font-semibold uppercase">
                                    More Colors
                                </Label>

                                <RadioGroup
                                    key={size}
                                    onValueChange={(value) => setColor(value)}
                                    defaultValue={color ?? undefined}
                                    className="flex flex-wrap gap-2"
                                    disabled={!product.isAvailable}
                                >
                                    {colors.map((c) => {
                                        const variant = product.variants.find(
                                            (v) =>
                                                v.size === size &&
                                                v.color.hex === c.hex
                                        );

                                        return (
                                            <div key={c.name}>
                                                <RadioGroupItem
                                                    value={c.hex}
                                                    id={c.name}
                                                    className="sr-only"
                                                    disabled={
                                                        !product.isAvailable ||
                                                        !variant?.isAvailable ||
                                                        variant?.quantity === 0
                                                    }
                                                />

                                                <Label htmlFor={c.name}>
                                                    <div className="flex flex-col items-center gap-2">
                                                        <div
                                                            title={c.name}
                                                            className={cn(
                                                                "size-12 cursor-pointer rounded-full border border-foreground/10",
                                                                c.hex ===
                                                                    color &&
                                                                    "outline outline-2 outline-offset-1",
                                                                (!product.isAvailable ||
                                                                    !variant?.isAvailable ||
                                                                    variant?.quantity ===
                                                                        0) &&
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
                                                                    "font-semibold",
                                                                (!variant?.isAvailable ||
                                                                    variant?.quantity ===
                                                                        0) &&
                                                                    "text-destructive line-through"
                                                            )}
                                                        >
                                                            {c.name}
                                                        </span>

                                                        {!!variant?.quantity &&
                                                            variant.quantity <
                                                                3 && (
                                                                <span className="text-xs text-destructive">
                                                                    {
                                                                        variant.quantity
                                                                    }{" "}
                                                                    left
                                                                </span>
                                                            )}
                                                    </div>
                                                </Label>
                                            </div>
                                        );
                                    })}
                                </RadioGroup>
                            </div>
                        }
                    </>
                )}

                <FormField
                    control={form.control}
                    name="sku"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel className="hidden">SKU</FormLabel>

                            <FormControl>
                                <Input {...field} readOnly className="hidden" />
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
