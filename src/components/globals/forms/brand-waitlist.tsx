"use client";

import { Button } from "@/components/ui/button";
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { useIntroModalStore } from "@/lib/store";
import { trpc } from "@/lib/trpc/client";
import {
    CreateBrandWaitlist,
    createBrandWaitlistSchema,
} from "@/lib/validations";
import { zodResolver } from "@hookform/resolvers/zod";
import { Dispatch, SetStateAction } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

interface PageProps {
    setCurrentTab: Dispatch<SetStateAction<"community" | "brand">>;
}

export function BrandWaitlistForm({ setCurrentTab }: PageProps) {
    const setIsOpen = useIntroModalStore((state) => state.setIsOpen);

    const form = useForm<CreateBrandWaitlist>({
        resolver: zodResolver(createBrandWaitlistSchema),
        defaultValues: {
            name: "",
            email: "",
            phone: "",
            brandEmail: "",
            brandName: "",
            brandWebsite: "",
            brandPhone: "",
        },
    });

    const { mutate: addBrandToWaitlist, isPending } =
        trpc.brandsWaitlist.createBrandsWaitlistEntry.useMutation({
            onMutate: () => {
                const toastId = toast.loading(
                    "Adding your brand to the waitlist..."
                );
                return { toastId };
            },
            onSuccess: (_, __, { toastId }) => {
                setIsOpen(false);
                return toast.success(
                    "Your brand has been added to the waitlist!",
                    {
                        id: toastId,
                    }
                );
            },
            onError: (err, _, ctx) => {
                return toast.error(err.message, { id: ctx?.toastId });
            },
        });

    return (
        <Form {...form}>
            <form
                onSubmit={form.handleSubmit((values) =>
                    addBrandToWaitlist(values)
                )}
                className="space-y-4"
            >
                <div className="space-y-2">
                    <div className="space-y-1">
                        <h4 className="font-semibold">About You</h4>
                        <Separator className="bg-foreground/50" />
                    </div>

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

                    <div className="flex items-center gap-2">
                        <FormField
                            control={form.control}
                            name="email"
                            render={({ field }) => (
                                <FormItem className="w-full">
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

                        <FormField
                            control={form.control}
                            name="phone"
                            render={({ field }) => (
                                <FormItem className="w-full">
                                    <FormLabel>Your Phone</FormLabel>

                                    <FormControl>
                                        <Input
                                            placeholder="Enter your phone"
                                            disabled={isPending}
                                            {...field}
                                            onChange={(e) => {
                                                const value = e.target.value;
                                                if (!/^\d+$/.test(value))
                                                    e.target.value = "";
                                                field.onChange(e);
                                            }}
                                        />
                                    </FormControl>

                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                    </div>
                </div>

                <div className="space-y-2">
                    <div className="space-y-1">
                        <h4 className="font-semibold">About Your Brand</h4>
                        <Separator className="bg-foreground/50" />
                    </div>

                    <div className="flex items-center gap-2">
                        <FormField
                            control={form.control}
                            name="brandName"
                            render={({ field }) => (
                                <FormItem className="w-full">
                                    <FormLabel>Brand Name</FormLabel>

                                    <FormControl>
                                        <Input
                                            placeholder="Enter your brand name"
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
                            name="brandEmail"
                            render={({ field }) => (
                                <FormItem className="w-full">
                                    <FormLabel>Brand Email</FormLabel>

                                    <FormControl>
                                        <Input
                                            type="email"
                                            placeholder="Enter your brand email"
                                            disabled={isPending}
                                            {...field}
                                        />
                                    </FormControl>

                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                    </div>

                    <div className="flex items-center gap-2">
                        <FormField
                            control={form.control}
                            name="brandPhone"
                            render={({ field }) => (
                                <FormItem className="w-full">
                                    <FormLabel>Brand Phone</FormLabel>

                                    <FormControl>
                                        <Input
                                            placeholder="Enter your brand phone"
                                            disabled={isPending}
                                            {...field}
                                            value={field.value || ""}
                                            onChange={(e) => {
                                                const value = e.target.value;
                                                if (!/^\d+$/.test(value))
                                                    e.target.value = "";
                                                field.onChange(e);
                                            }}
                                        />
                                    </FormControl>

                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="brandWebsite"
                            render={({ field }) => (
                                <FormItem className="w-full">
                                    <FormLabel>Brand Website</FormLabel>

                                    <FormControl>
                                        <Input
                                            placeholder="Enter your brand website"
                                            disabled={isPending}
                                            {...field}
                                            value={field.value || ""}
                                        />
                                    </FormControl>

                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                    </div>
                </div>

                <div className="flex justify-end">
                    <button
                        type="button"
                        onClick={() => setCurrentTab("community")}
                        className="text-sm text-muted-foreground underline"
                    >
                        Join our Community
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
