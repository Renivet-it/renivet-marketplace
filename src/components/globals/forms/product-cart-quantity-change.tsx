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
import { CachedCart } from "@/lib/validations";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { useEffect, useRef } from "react";
import { toast } from "sonner";
import { z } from "zod";

interface PageProps {
    item: CachedCart;
    userId: string;
}

const formSchema = z.object({
    quantity: z.number().min(1, "Quantity must be at least 1"),
});

type FormData = z.infer<typeof formSchema>;

export function ProductCartQuantityChangeForm({ item, userId }: PageProps) {
    const form = useForm<FormData>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            quantity: item.quantity,
        },
    });

    const { refetch } = trpc.general.users.cart.getCartForUser.useQuery({
        userId,
    });

    const persistedQuantity = useRef(item.quantity);
    const requestedQuantity = useRef(item.quantity);
    const quantityUpdateQueue = useRef(Promise.resolve());
    const quantityUpdateTimer = useRef<ReturnType<typeof setTimeout> | null>(
        null
    );

    const { mutateAsync: updateProduct } =
        trpc.general.users.cart.updateProductQuantityInCart.useMutation({
            onMutate: () => {
                const toastId = toast.loading("Updating cart...");
                return { toastId };
            },
            onSuccess: (_, __, { toastId }) => {
                toast.success("Cart updated", { id: toastId });
            },
            onError: (err, _, ctx) => {
                return handleClientError(err, ctx?.toastId);
            },
        });

    const persistQuantity = (quantity: number) => {
        quantityUpdateQueue.current = quantityUpdateQueue.current
            .catch(() => undefined)
            .then(async () => {
                if (quantity === persistedQuantity.current) return;

                await updateProduct({
                    userId,
                    productId: item.productId,
                    variantId: item.variantId,
                    quantity,
                });

                persistedQuantity.current = quantity;
                requestedQuantity.current = quantity;
                await refetch();
            })
            .catch((error) => {
                requestedQuantity.current = persistedQuantity.current;
                form.setValue("quantity", persistedQuantity.current);
                handleClientError(error);
            });
    };

    const scheduleQuantityUpdate = (quantity: number) => {
        requestedQuantity.current = quantity;
        form.setValue("quantity", quantity, { shouldDirty: true });
        if (quantityUpdateTimer.current) {
            clearTimeout(quantityUpdateTimer.current);
        }
        quantityUpdateTimer.current = setTimeout(() => {
            quantityUpdateTimer.current = null;
            persistQuantity(quantity);
        }, 200);
    };

    useEffect(
        () => () => {
            if (quantityUpdateTimer.current) {
                clearTimeout(quantityUpdateTimer.current);
            }
        },
        []
    );

    const maxQuantity = item.variantId
        ? (item.product.variants.find((v) => v.id === item.variantId)
              ?.quantity ?? 0)
        : (item.product.quantity ?? 0);

    return (
        <Form {...form}>
            <form className="space-y-4">
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
                                    <div className="flex h-10 w-fit items-center overflow-hidden rounded-md border border-input shadow-sm">
                                        <Button
                                            type="button"
                                            className="h-full rounded-none border-0 border-r border-input bg-transparent px-3 text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground disabled:opacity-50"
                                            variant="ghost"
                                            size="icon"
                                            aria-label="Decrement quantity"
                                            disabled={
                                                field.value <= 1
                                            }
                                            onClick={() =>
                                                scheduleQuantityUpdate(
                                                    Math.max(
                                                        requestedQuantity.current -
                                                            1,
                                                        1
                                                    )
                                                )
                                            }
                                        >
                                            <Icons.Minus
                                                size={16}
                                                strokeWidth={2}
                                            />
                                        </Button>

                                        <div className="flex min-w-12 items-center justify-center px-2 text-sm font-medium tabular-nums">
                                            {field.value}
                                        </div>

                                        <Button
                                            type="button"
                                            className="h-full rounded-none border-0 border-l border-input bg-transparent px-3 text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground disabled:opacity-50"
                                            variant="ghost"
                                            size="icon"
                                            aria-label="Increment quantity"
                                            disabled={
                                                field.value >= maxQuantity
                                            }
                                            onClick={() =>
                                                scheduleQuantityUpdate(
                                                    Math.min(
                                                        requestedQuantity.current +
                                                            1,
                                                        maxQuantity
                                                    )
                                                )
                                            }
                                        >
                                            <Icons.Plus
                                                size={16}
                                                strokeWidth={2}
                                            />
                                        </Button>
                                    </div>
                                </div>
                            </FormControl>

                            <FormMessage />
                        </FormItem>
                    )}
                />

            </form>
        </Form>
    );
}
