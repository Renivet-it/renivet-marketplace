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
import { Input } from "@/components/ui/input-general";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Separator } from "@/components/ui/separator";
import { SIZES } from "@/config/sizes";
import { trpc } from "@/lib/trpc/client";
import { cn, handleClientError } from "@/lib/utils";
import {
    CachedWishlist,
    CreateCart,
    createCartSchema,
} from "@/lib/validations";
import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

interface PageProps {
    item: CachedWishlist;
    userId: string;
}

export function ProductCartMoveForm({ item: { product }, userId }: PageProps) {
    const [sku, setSku] = useState<string | undefined>();
    const [size, setSize] = useState<string | undefined>();
    const [color, setColor] = useState<string | undefined>();

    const form = useForm<CreateCart>({
        resolver: zodResolver(createCartSchema),
        defaultValues: {
            userId: userId,
            quantity: 1,
            sku: sku || "",
        },
    });

    const sizes = Array.from(
        new Set(
            product.variants
                .map((v) => v.size)
                .sort(
                    (a, b) =>
                        SIZES.indexOf(a) - SIZES.indexOf(b) ||
                        a.localeCompare(b)
                )
        )
    );

    const colors = product.variants
        .filter((v) => !v.isDeleted)
        .filter((v) => v.size === size)
        .map((v) => v.color)
        .sort(
            (a, b) => a.name.localeCompare(b.name) || a.hex.localeCompare(b.hex)
        );

    useEffect(() => {
        if (product.variants.length === 1) setSize(product.variants[0].size);
        if (product.variants.length === 1)
            setColor(product.variants[0].color.hex);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    useEffect(() => {
        const currentSku = product.variants.find(
            (v) => v.color.hex === color && v.size === size
        )?.sku;

        setSku(currentSku);
        form.setValue("sku", currentSku || "");
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [color, size]);

    const { refetch: refetchCart } = trpc.general.users.cart.getCart.useQuery({
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
        <Form {...form}>
            <form
                className="space-y-3 md:space-y-5"
                onSubmit={form.handleSubmit((values) => {
                    if (!values.sku)
                        return toast.error("Please select a size or color");
                    if (!product.isAvailable)
                        return toast.error(
                            "This product is currently out of stock. You can still add it to your wishlist."
                        );

                    moveToCart(values);
                })}
            >
                <div className="space-y-4">
                    <Label className="font-semibold uppercase">
                        Select Size
                    </Label>

                    <RadioGroup
                        onValueChange={(value) => {
                            setSize(value);
                            setColor(undefined);
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
                                                s === "One Size" &&
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
                                    onValueChange={(value) => setColor(value)}
                                    defaultValue={color}
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

                <DialogFooter>
                    <DialogClose asChild>
                        <Button type="reset" variant="ghost" size="sm">
                            Cancel
                        </Button>
                    </DialogClose>

                    <Button type="submit" size="sm" disabled={isMoving}>
                        Move to Cart
                    </Button>
                </DialogFooter>
            </form>
        </Form>
    );
}
