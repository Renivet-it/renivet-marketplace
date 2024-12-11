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
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { trpc } from "@/lib/trpc/client";
import { cn, handleClientError } from "@/lib/utils";
import {
    CachedWishlist,
    CreateCart,
    createCartSchema,
} from "@/lib/validations";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

interface PageProps {
    item: CachedWishlist;
    userId: string;
}

export function ProductCartMoveForm({ item: { product }, userId }: PageProps) {
    const form = useForm<CreateCart>({
        resolver: zodResolver(createCartSchema),
        defaultValues: {
            color: null,
            productId: product.id,
            userId: userId,
            quantity: 1,
            size: undefined,
        },
    });

    const { refetch: refetchCart } = trpc.general.users.cart.getCart.useQuery({
        userId,
    });
    const { refetch: refetchWishlist } =
        trpc.general.users.wishlist.getWishlist.useQuery({ userId });

    const { mutate: moveToCart, isPending: isMoving } =
        trpc.general.users.wishlist.moveProductToCart.useMutation({
            onMutate: () => {
                const toastId = toast.success("Moving to cart...");
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
                    if (product.colors.length > 0 && !values.color)
                        return form.setError("color", {
                            type: "required",
                            message: "Color is required",
                        });

                    moveToCart(values);
                })}
            >
                {product.colors.length > 0 && (
                    <FormField
                        control={form.control}
                        name="color"
                        render={({ field }) => (
                            <FormItem className="space-y-4">
                                <FormLabel>Select Colors</FormLabel>

                                <FormControl>
                                    <RadioGroup
                                        onValueChange={(value) =>
                                            field.onChange(
                                                product.colors.find(
                                                    (c) => c.hex === value
                                                ) || null
                                            )
                                        }
                                        defaultValue={field.value?.hex}
                                        className="flex flex-wrap gap-2"
                                        disabled={isMoving}
                                    >
                                        {product.colors.map((c) => (
                                            <FormItem key={c.name}>
                                                <FormControl>
                                                    <RadioGroupItem
                                                        value={c.hex}
                                                        id={c.name}
                                                        className="sr-only"
                                                        disabled={isMoving}
                                                    />
                                                </FormControl>

                                                <FormLabel htmlFor={c.name}>
                                                    <div className="flex flex-col items-center gap-2">
                                                        <div
                                                            title={c.name}
                                                            className={cn(
                                                                "size-12 cursor-pointer rounded-full border border-foreground/10",
                                                                c.hex ===
                                                                    field.value
                                                                        ?.hex &&
                                                                    "outline outline-2 outline-offset-1"
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
                                                                    field.value
                                                                        ?.hex &&
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

                <FormField
                    control={form.control}
                    name="size"
                    render={({ field }) => (
                        <FormItem className="space-y-4">
                            <FormLabel>Select Size</FormLabel>

                            <FormControl>
                                <RadioGroup
                                    onValueChange={field.onChange}
                                    defaultValue={field.value}
                                    className="flex flex-wrap gap-2"
                                    disabled={isMoving}
                                >
                                    {product.sizes.map((s) => (
                                        <FormItem key={s.name}>
                                            <FormControl>
                                                <RadioGroupItem
                                                    value={s.name}
                                                    id={s.name}
                                                    disabled={s.quantity === 0}
                                                    className="sr-only"
                                                />
                                            </FormControl>

                                            <FormLabel htmlFor={s.name}>
                                                <div className="flex flex-col items-center gap-2">
                                                    <div
                                                        title={s.name}
                                                        className={cn(
                                                            "flex size-12 cursor-pointer items-center justify-center rounded-full border border-foreground/30 p-2 text-sm disabled:cursor-not-allowed disabled:opacity-60",
                                                            s.name ===
                                                                field.value &&
                                                                "bg-primary text-background"
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

                <DialogFooter>
                    <DialogClose asChild>
                        <Button type="reset" variant="ghost" size="sm">
                            Cancel
                        </Button>
                    </DialogClose>

                    <Button
                        type="submit"
                        size="sm"
                        disabled={isMoving || !form.formState.isDirty}
                    >
                        Move to Cart
                    </Button>
                </DialogFooter>
            </form>
        </Form>
    );
}
