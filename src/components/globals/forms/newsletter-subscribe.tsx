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
import { Input } from "@/components/ui/input-general";
import { useIntroModalStore } from "@/lib/store";
import { trpc } from "@/lib/trpc/client";
import {
    CreateNewsletterSubscriber,
    createNewsletterSubscriberSchema,
} from "@/lib/validations";
import { zodResolver } from "@hookform/resolvers/zod";
import { Dispatch, SetStateAction } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

interface PageProps {
    setCurrentTab: Dispatch<SetStateAction<"community" | "brand">>;
}

export function NewsLetterSubscribeForm({ setCurrentTab }: PageProps) {
    const setIsOpen = useIntroModalStore((state) => state.setIsOpen);

    const form = useForm<CreateNewsletterSubscriber>({
        resolver: zodResolver(createNewsletterSubscriberSchema),
        defaultValues: {
            name: "",
            email: "",
        },
    });

    const { mutate: createNewsletterSub, isPending } =
        trpc.general.newsletterSubscribers.createNewsletterSubscriber.useMutation(
            {
                onMutate: () => {
                    const toastId = toast.loading(
                        "Adding you to the newsletter..."
                    );
                    return { toastId };
                },
                onSuccess: (_, __, { toastId }) => {
                    setIsOpen(false);
                    return toast.success(
                        "You've been added to the newsletter!",
                        {
                            id: toastId,
                        }
                    );
                },
                onError: (err, _, ctx) => {
                    return toast.error(err.message, { id: ctx?.toastId });
                },
            }
        );

    return (
        <Form {...form}>
            <form
                onSubmit={form.handleSubmit((values) =>
                    createNewsletterSub(values)
                )}
                className="space-y-4"
            >
                <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Your Name</FormLabel>

                            <FormControl>
                                <Input
                                    placeholder="Enter your full name"
                                    disabled={isPending}
                                    {...field}
                                />
                            </FormControl>

                            <FormMessage />
                        </FormItem>
                    )}
                />

                <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Your Email</FormLabel>

                            <FormControl>
                                <Input
                                    type="email"
                                    placeholder="Enter your email"
                                    disabled={isPending}
                                    {...field}
                                />
                            </FormControl>

                            <FormMessage />
                        </FormItem>
                    )}
                />

                <div className="flex justify-end">
                    <button
                        type="button"
                        onClick={() => setCurrentTab("brand")}
                        className="text-sm text-muted-foreground underline"
                    >
                        Join as a Brand
                    </button>
                </div>

                <Button
                    variant="accent"
                    className="w-full"
                    type="submit"
                    disabled={isPending || !form.formState.isDirty}
                >
                    Join Now!
                </Button>
            </form>
        </Form>
    );
}
