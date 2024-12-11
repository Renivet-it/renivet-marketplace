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
import { trpc } from "@/lib/trpc/client";
import { handleClientError } from "@/lib/utils";
import { CachedCart, UpdateCart, updateCartSchema } from "@/lib/validations";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

interface PageProps {
    item: CachedCart;
    userId: string;
}

export function ProductCartQuantityChangeForm({ item, userId }: PageProps) {
    const form = useForm<UpdateCart>({
        resolver: zodResolver(updateCartSchema),
        defaultValues: item,
    });

    const { refetch } = trpc.general.users.cart.getCart.useQuery({ userId });

    const { mutate: updateProduct, isPending: isUpdating } =
        trpc.general.users.cart.updateProductQuantityInCart.useMutation({
            onMutate: () => {
                const toastId = toast.loading("Updating cart...");
                return { toastId };
            },
            onSuccess: (_, __, { toastId }) => {
                toast.success("Cart updated", { id: toastId });
                refetch();
                form.reset({
                    ...item,
                    quantity: form.watch("quantity"),
                });
            },
            onError: (err, _, ctx) => {
                return handleClientError(err, ctx?.toastId);
            },
        });

    return (
        <Form {...form}>
            <form
                className="space-y-4"
                onSubmit={form.handleSubmit((values) =>
                    updateProduct({
                        productId: item.product.id,
                        userId,
                        color: item.color,
                        size: item.size,
                        quantity: values.quantity,
                    })
                )}
            >
                <FormField
                    control={form.control}
                    name="quantity"
                    render={({ field }) => (
                        <FormItem className="space-y-4">
                            <FormLabel className="font-semibold uppercase">
                                Select Quantity
                            </FormLabel>

                            <FormControl>
                                <div>
                                    <div className="inline-flex -space-x-px shadow-sm shadow-black/5 rtl:space-x-reverse">
                                        <div>
                                            <Button
                                                type="button"
                                                className="rounded-none shadow-none"
                                                variant="outline"
                                                size="icon"
                                                aria-label="Increment quantity"
                                                disabled={isUpdating}
                                                onClick={() =>
                                                    field.onChange(
                                                        Math.min(
                                                            field.value + 1,
                                                            99
                                                        )
                                                    )
                                                }
                                                onMouseDown={() => {
                                                    const interval =
                                                        setInterval(() => {
                                                            field.onChange(
                                                                (
                                                                    prevValue: number
                                                                ) =>
                                                                    Math.min(
                                                                        prevValue +
                                                                            1,
                                                                        99
                                                                    )
                                                            );
                                                        }, 200);

                                                    const handleMouseUp =
                                                        () => {
                                                            clearInterval(
                                                                interval
                                                            );
                                                            window.removeEventListener(
                                                                "mouseup",
                                                                handleMouseUp
                                                            );
                                                        };

                                                    window.addEventListener(
                                                        "mouseup",
                                                        handleMouseUp
                                                    );
                                                }}
                                            >
                                                <Icons.ChevronUp
                                                    size={16}
                                                    strokeWidth={2}
                                                    aria-hidden="true"
                                                />
                                                <span className="sr-only">
                                                    Increment quantity
                                                </span>
                                            </Button>
                                        </div>

                                        <div className="flex w-16 items-center justify-center border border-input text-sm">
                                            {field.value}
                                        </div>

                                        <div>
                                            <Button
                                                type="button"
                                                className="rounded-none shadow-none"
                                                variant="outline"
                                                size="icon"
                                                aria-label="Decrement quantity"
                                                disabled={isUpdating}
                                                onClick={() =>
                                                    field.onChange(
                                                        Math.max(
                                                            field.value - 1,
                                                            1
                                                        )
                                                    )
                                                }
                                                onMouseDown={() => {
                                                    const interval =
                                                        setInterval(() => {
                                                            field.onChange(
                                                                (
                                                                    prevValue: number
                                                                ) =>
                                                                    Math.max(
                                                                        prevValue -
                                                                            1,
                                                                        1
                                                                    )
                                                            );
                                                        }, 200);

                                                    const handleMouseUp =
                                                        () => {
                                                            clearInterval(
                                                                interval
                                                            );
                                                            window.removeEventListener(
                                                                "mouseup",
                                                                handleMouseUp
                                                            );
                                                        };

                                                    window.addEventListener(
                                                        "mouseup",
                                                        handleMouseUp
                                                    );
                                                }}
                                            >
                                                <Icons.ChevronDown
                                                    size={16}
                                                    strokeWidth={2}
                                                    aria-hidden="true"
                                                />
                                                <span className="sr-only">
                                                    Decrement quantity
                                                </span>
                                            </Button>
                                        </div>
                                    </div>
                                </div>
                            </FormControl>

                            <FormMessage />
                        </FormItem>
                    )}
                />

                <Button
                    size="sm"
                    className="w-full"
                    disabled={!form.formState.isDirty || isUpdating}
                >
                    Save Changes
                </Button>
            </form>
        </Form>
    );
}
