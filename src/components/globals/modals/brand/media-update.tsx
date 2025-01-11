"use client";

import { TableMedia } from "@/components/dashboard/brands/media";
import { Button } from "@/components/ui/button-dash";
import {
    Dialog,
    DialogClose,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog-dash";
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
    UpdateBrandMediaItem,
    updateBrandMediaItemSchema,
} from "@/lib/validations";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { Dispatch, SetStateAction } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

interface PageProps {
    media: TableMedia;
    isOpen: boolean;
    setIsOpen: Dispatch<SetStateAction<boolean>>;
}

export function MediaUpdateModal({ media, isOpen, setIsOpen }: PageProps) {
    const router = useRouter();

    const mediaName = media.name.split(".").slice(0, -1).join(".");
    const mediaType = media.name.split(".").pop();

    const form = useForm<UpdateBrandMediaItem>({
        resolver: zodResolver(updateBrandMediaItemSchema),
        defaultValues: {
            alt: media.alt ?? "",
            name: mediaName,
            size: media.size,
            type: media.type,
            url: media.url,
        },
    });

    const { mutate: updateMedia, isPending: isUpdating } =
        trpc.brands.media.updateMediaItem.useMutation({
            onMutate: () => {
                const toastId = toast.loading("Updating media...");
                return { toastId };
            },
            onSuccess: (_, data, { toastId }) => {
                toast.success("Media updated", { id: toastId });
                router.refresh();
                setIsOpen(false);
                form.reset(data.values as UpdateBrandMediaItem);
            },
            onError: (err, _, ctx) => {
                return handleClientError(err, ctx?.toastId);
            },
        });

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Update Media Details</DialogTitle>
                    <DialogDescription>
                        Update media name and alt
                    </DialogDescription>
                </DialogHeader>

                <Form {...form}>
                    <form
                        className="space-y-4"
                        onSubmit={form.handleSubmit((values) =>
                            updateMedia({
                                id: media.id,
                                values: {
                                    ...values,
                                    name: `${values.name}.${mediaType}`,
                                },
                            })
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
                                            placeholder="Enter media name"
                                            disabled={isUpdating}
                                        />
                                    </FormControl>

                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="alt"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Alt</FormLabel>

                                    <FormControl>
                                        <Input
                                            {...field}
                                            placeholder="Enter media alt"
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
                                <Button
                                    type="reset"
                                    variant="ghost"
                                    size="sm"
                                    disabled={isUpdating}
                                >
                                    Cancel
                                </Button>
                            </DialogClose>

                            <Button
                                type="submit"
                                size="sm"
                                disabled={isUpdating || !form.formState.isDirty}
                            >
                                Update
                            </Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
}
