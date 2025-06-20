"use client";

import { Button } from "@/components/ui/button-dash";
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
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

interface PageProps {
    titleData?: { title: string };
}

export function ShopByCategoryTitle({ titleData }: PageProps) {
    const form = useForm<{ title: string }>({
        resolver: zodResolver(
            z.object({ title: z.string().min(1, "A title is required") })
        ),
        defaultValues: {
            title: titleData?.title || "Shop by Category",
        },
    });

    const { mutate: updateTitle, isPending } =
        trpc.general.content.homeShopByCategoryTitle.updateHomeShopByCategoryTitle.useMutation(
            {
                onMutate: () => {
                    const toastId = toast.loading("Updating title...");
                    return { toastId };
                },
                onSuccess: (_, res, { toastId }) => {
                    toast.success("Title updated", { id: toastId });
                    form.reset(res);
                },
                onError: (err, _, ctx) => {
                    return handleClientError(err, ctx?.toastId);
                },
            }
        );

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit((values) => updateTitle(values))}>
                <FormField
                    control={form.control}
                    name="title"
                    render={({ field }) => (
                        <FormItem className="w-full">
                            <FormLabel>Title</FormLabel>

                            <div className="flex flex-col items-center gap-2 md:flex-row">
                                <FormControl>
                                    <Input
                                        {...field}
                                        placeholder="Shop by Category"
                                    />
                                </FormControl>

                                <Button
                                    type="submit"
                                    className="h-9 w-full px-3 text-xs md:h-10 md:w-auto md:px-4 md:text-sm"
                                    disabled={
                                        !form.formState.isDirty || isPending
                                    }
                                >
                                    Save
                                </Button>
                            </div>

                            <FormMessage />
                        </FormItem>
                    )}
                />
            </form>
        </Form>
    );
}
