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
                    quantity: form.watch("quantity"),
                });
            },
            onError: (err, _, ctx) => {
                return handleClientError(err, ctx?.toastId);
            },
        });

    const maxQuantity = item.variantId
        ? (item.product.variants.find((v) => v.id === item.variantId)
              ?.quantity ?? 0)
        : (item.product.quantity ?? 0);

    return (
        <Form {...form}>
            <form
                className="space-y-4"
                onSubmit={form.handleSubmit((values) =>
                    updateProduct({
                        userId,
                        productId: item.productId,
                        variantId: item.variantId,
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
                                                disabled={
                                                    isUpdating ||
                                                    field.value >= maxQuantity
                                                }
                                                onClick={() =>
                                                    field.onChange(
                                                        Math.min(
                                                            field.value + 1,
                                                            maxQuantity
                                                        )
                                                    )
                                                }
                                            >
                                                <Icons.ChevronUp
                                                    size={16}
                                                    strokeWidth={2}
                                                    aria-hidden="true"
                                                />
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
                                                disabled={
                                                    isUpdating ||
                                                    field.value <= 1
                                                }
                                                onClick={() =>
                                                    field.onChange(
                                                        Math.max(
                                                            field.value - 1,
                                                            1
                                                        )
                                                    )
                                                }
                                            >
                                                <Icons.ChevronDown
                                                    size={16}
                                                    strokeWidth={2}
                                                    aria-hidden="true"
                                                />
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
