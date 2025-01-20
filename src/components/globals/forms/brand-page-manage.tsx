"use client";

import { Button } from "@/components/ui/button-dash";
import { DialogClose, DialogFooter } from "@/components/ui/dialog-dash";
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input-dash";
import { Textarea } from "@/components/ui/textarea-dash";
import { trpc } from "@/lib/trpc/client";
import { handleClientError } from "@/lib/utils";
import { CachedBrand, UpdateBrand, updateBrandSchema } from "@/lib/validations";
import { zodResolver } from "@hookform/resolvers/zod";
import { Dispatch, SetStateAction } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

interface PageProps {
    brand: CachedBrand;
    setIsOpen: Dispatch<SetStateAction<boolean>>;
}

export function BrandPageManageForm({ brand, setIsOpen }: PageProps) {
    const form = useForm<UpdateBrand>({
        resolver: zodResolver(updateBrandSchema),
        defaultValues: {
            bio: brand.bio ?? "",
            website: brand.website ?? "",
            coverUrl: brand.coverUrl,
            logoUrl: brand.logoUrl,
        },
    });

    const { refetch } = trpc.brands.brands.getBrand.useQuery({ id: brand.id });

    const { mutate: updateBrand, isPending: isUpdating } =
        trpc.brands.brands.updateBrand.useMutation({
            onMutate: () => {
                const toastId = toast.loading("Updating brand...");
                return { toastId };
            },
            onSuccess: (_, values, { toastId }) => {
                refetch();
                form.reset(values.values as UpdateBrand);
                setIsOpen(false);
                return toast.success("Brand updated", { id: toastId });
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
                    updateBrand({ id: brand.id, values })
                )}
            >
                <FormField
                    control={form.control}
                    name="bio"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Bio</FormLabel>

                            <FormControl>
                                <div className="relative">
                                    <Textarea
                                        {...field}
                                        placeholder="Tell us about your brand"
                                        minRows={5}
                                        maxLength={255}
                                        value={field.value ?? ""}
                                        disabled={isUpdating}
                                    />

                                    <div className="absolute bottom-1 right-1 flex items-center text-xs text-muted-foreground">
                                        {255 - (field.value ?? "").length}
                                    </div>
                                </div>
                            </FormControl>

                            <FormMessage />
                        </FormItem>
                    )}
                />

                <FormField
                    control={form.control}
                    name="website"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Website</FormLabel>

                            <FormControl>
                                <Input
                                    {...field}
                                    placeholder="https://example.com"
                                    value={field.value ?? ""}
                                    disabled={isUpdating}
                                />
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
                        disabled={isUpdating || !form.formState.isDirty}
                    >
                        Save
                    </Button>
                </DialogFooter>
            </form>
        </Form>
    );
}
