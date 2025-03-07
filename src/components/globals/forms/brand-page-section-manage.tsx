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
import { trpc } from "@/lib/trpc/client";
import { handleClientError } from "@/lib/utils";
import {
    CachedBrand,
    CreateBrandPageSection,
    createBrandPageSectionSchema,
} from "@/lib/validations";
import { zodResolver } from "@hookform/resolvers/zod";
import { Dispatch, SetStateAction } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

interface PageProps {
    brand: CachedBrand;
    pageSection?: CachedBrand["pageSections"][number];
    setIsOpen: Dispatch<SetStateAction<boolean>>;
}

export function BrandPageSectionManage({
    brand,
    pageSection,
    setIsOpen,
}: PageProps) {
    const form = useForm<CreateBrandPageSection>({
        resolver: zodResolver(createBrandPageSectionSchema),
        defaultValues: {
            brandId: brand.id,
            name: pageSection?.name ?? "",
            description: pageSection?.description ?? "",
            position: pageSection?.position ?? brand.pageSections.length + 1,
        },
    });

    const { refetch } = trpc.brands.brands.getBrand.useQuery({
        id: brand.id,
    });

    const { mutate: createSection, isPending: isCreating } =
        trpc.brands.pageSections.createBrandPageSection.useMutation({
            onMutate: () => {
                const toastId = toast.loading("Creating section...");
                return { toastId };
            },
            onSuccess: (_, __, { toastId }) => {
                setIsOpen(false);
                refetch();
                return toast.success("Section created", { id: toastId });
            },
            onError: (err, _, ctx) => {
                return handleClientError(err, ctx?.toastId);
            },
        });

    const { mutate: updateSection, isPending: isUpdating } =
        trpc.brands.pageSections.updateBrandPageSection.useMutation({
            onMutate: () => {
                const toastId = toast.loading("Updating section...");
                return { toastId };
            },
            onSuccess: (_, __, { toastId }) => {
                setIsOpen(false);
                refetch();
                return toast.success("Section updated", { id: toastId });
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
                    pageSection
                        ? updateSection({
                              id: pageSection.id,
                              values,
                          })
                        : createSection(values)
                )}
            >
                <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Name</FormLabel>

                            <FormControl>
                                <Input
                                    {...field}
                                    placeholder="New Arrivals"
                                    disabled={isCreating || isUpdating}
                                />
                            </FormControl>

                            <FormMessage />
                        </FormItem>
                    )}
                />

                <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Description</FormLabel>

                            <FormControl>
                                <Input
                                    {...field}
                                    placeholder="The latest products"
                                    value={field.value || ""}
                                    disabled={isCreating || isUpdating}
                                />
                            </FormControl>

                            <FormMessage />
                        </FormItem>
                    )}
                />

                <DialogFooter>
                    <DialogClose asChild>
                        <Button
                            type="reset"
                            variant="ghost"
                            size="sm"
                            disabled={isCreating || isUpdating}
                        >
                            Cancel
                        </Button>
                    </DialogClose>

                    <Button
                        type="submit"
                        size="sm"
                        disabled={
                            isCreating || isUpdating || !form.formState.isDirty
                        }
                    >
                        {pageSection ? "Update" : "Create"}
                    </Button>
                </DialogFooter>
            </form>
        </Form>
    );
}
