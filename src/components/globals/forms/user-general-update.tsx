"use client";

import { Button } from "@/components/ui/button-general";
import { CardContent, CardFooter } from "@/components/ui/card";
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input-general";
import { Separator } from "@/components/ui/separator";
import { DEFAULT_MESSAGES } from "@/config/const";
import { cn, handleClientError } from "@/lib/utils";
import {
    UpdateUserGeneral,
    updateUserGeneralSchema,
    UserWithAddressesAndRoles,
} from "@/lib/validations";
import { useUser } from "@clerk/nextjs";
import { isClerkAPIResponseError } from "@clerk/nextjs/errors";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

interface PageProps {
    user: UserWithAddressesAndRoles;
}

export function UserGeneralUpdateForm({ user }: PageProps) {
    const router = useRouter();

    const { user: clerkUser, isLoaded: isClerkUserLoaded } = useUser();

    const form = useForm<UpdateUserGeneral>({
        resolver: zodResolver(updateUserGeneralSchema),
        defaultValues: {
            firstName: user.firstName,
            lastName: user.lastName,
        },
    });

    const { mutate: updateUser, isPending: isUserUpdating } = useMutation({
        onMutate: () => {
            const toastId = toast.loading("Saving changes...");
            return { toastId };
        },
        mutationFn: async (values: UpdateUserGeneral) => {
            if (!isClerkUserLoaded || !clerkUser)
                throw new Error(DEFAULT_MESSAGES.ERRORS.USER_FETCHING);

            await clerkUser.update({
                firstName: values.firstName,
                lastName: values.lastName,
            });
        },
        onSuccess: (_, data, { toastId }) => {
            toast.success("Changes saved successfully", { id: toastId });
            form.reset(data);
            clerkUser?.reload();
            router.refresh();
        },
        onError: (err, _, ctx) => {
            return isClerkAPIResponseError(err)
                ? toast.error(err.errors.map((e) => e.message).join(", "), {
                      id: ctx?.toastId,
                  })
                : handleClientError(err, ctx?.toastId);
        },
    });

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit((values) => updateUser(values))}>
                <Separator />

                <CardContent className="space-y-6 pt-6">
                    <div className="grid gap-4 md:grid-cols-2 md:gap-6">
                        <FormField
                            control={form.control}
                            name="firstName"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel htmlFor={field.name}>
                                        First Name
                                    </FormLabel>

                                    <FormControl>
                                        <Input
                                            placeholder="John"
                                            disabled={isUserUpdating}
                                            {...field}
                                        />
                                    </FormControl>

                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="lastName"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel htmlFor={field.name}>
                                        Last Name
                                    </FormLabel>

                                    <FormControl>
                                        <Input
                                            placeholder="Doe"
                                            disabled={isUserUpdating}
                                            {...field}
                                        />
                                    </FormControl>

                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                    </div>
                </CardContent>

                <Separator
                    className={cn(!form.formState.isDirty && "hidden")}
                />

                <CardFooter
                    className={cn(
                        "justify-end gap-2 py-4 transition-all ease-in-out",
                        !form.formState.isDirty && "p-0 opacity-0"
                    )}
                >
                    <Button
                        type="reset"
                        variant="ghost"
                        size="sm"
                        className={cn(
                            !form.formState.isDirty && "pointer-events-none h-0"
                        )}
                        disabled={isUserUpdating || !form.formState.isDirty}
                        onClick={() => form.reset()}
                    >
                        Cancel
                    </Button>

                    <Button
                        type="submit"
                        size="sm"
                        className={cn(
                            !form.formState.isDirty && "pointer-events-none h-0"
                        )}
                        disabled={isUserUpdating || !form.formState.isDirty}
                    >
                        Save Changes
                    </Button>
                </CardFooter>
            </form>
        </Form>
    );
}
