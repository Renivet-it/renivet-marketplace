"use client";

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
import { trpc } from "@/lib/trpc/client";
import { cn, handleClientError } from "@/lib/utils";
import { CachedCart, UpdateCart, updateCartSchema } from "@/lib/validations";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

interface PageProps {
    item: CachedCart;
    userId: string;
}

export function ProductCartSizeChangeForm({ item, userId }: PageProps) {
    const form = useForm<UpdateCart>({
        resolver: zodResolver(updateCartSchema),
        defaultValues: item,
    });

    const { refetch } = trpc.general.users.cart.getCart.useQuery({ userId });

    const { mutate: updateProduct, isPending: isUpdating } =
        trpc.general.users.cart.updateProductSizeInCart.useMutation({
            onMutate: () => {
                const toastId = toast.loading("Updating cart...");
                return { toastId };
            },
            onSuccess: (_, __, { toastId }) => {
                toast.success("Cart updated", { id: toastId });
                refetch();
                form.reset({
                    ...item,
                    size: form.watch("size"),
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
                        oldSize: item.size,
                        newSize: values.size,
                    })
                )}
            >
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
                                    onValueChange={field.onChange}
                                    defaultValue={field.value}
                                    className="flex flex-wrap gap-2"
                                    disabled={isUpdating}
                                >
                                    {item.product.sizes.map((s) => (
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
                                                                form.watch(
                                                                    "size"
                                                                ) &&
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
