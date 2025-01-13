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
import { PasswordInput } from "@/components/ui/password-input";
import { Separator } from "@/components/ui/separator";
import { DEFAULT_MESSAGES } from "@/config/const";
import { POSTHOG_EVENTS } from "@/config/posthog";
import { cn, handleClientError } from "@/lib/utils";
import { UpdatePassword, updatePasswordSchema } from "@/lib/validations";
import { useUser } from "@clerk/nextjs";
import { isClerkAPIResponseError } from "@clerk/nextjs/errors";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { usePostHog } from "posthog-js/react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

export function UserPasswordUpdateForm() {
    const form = useForm<UpdatePassword>({
        resolver: zodResolver(updatePasswordSchema),
        defaultValues: {
            currentPassword: "",
            newPassword: "",
            confirmPassword: "",
        },
    });

    const { user: clerkUser, isLoaded: isClerkUserLoaded } = useUser();
    const posthog = usePostHog();

    const { mutate: updatePassword, isPending: isPasswordUpdating } =
        useMutation({
            onMutate: () => {
                const toastId = toast.loading("Updating password...");
                return { toastId };
            },
            mutationFn: async (values: UpdatePassword) => {
                if (!isClerkUserLoaded || !clerkUser)
                    throw new Error(DEFAULT_MESSAGES.ERRORS.USER_FETCHING);

                await clerkUser.updatePassword({
                    currentPassword: values.currentPassword,
                    newPassword: values.newPassword,
                    signOutOfOtherSessions: false,
                });
            },
            onSuccess: (_, __, { toastId }) => {
                toast.success("Password updated successfully", { id: toastId });
                posthog.capture(POSTHOG_EVENTS.USER.ACCOUNT.PASSWORD.UPDATED, {
                    userId: clerkUser?.id,
                });
                form.reset();
                clerkUser?.reload();
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
            <form
                onSubmit={form.handleSubmit((values) => updatePassword(values))}
            >
                <Separator />

                <CardContent className="space-y-6 p-4 md:p-6">
                    <FormField
                        control={form.control}
                        name="currentPassword"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Current Password</FormLabel>

                                <FormControl>
                                    <PasswordInput
                                        placeholder="********"
                                        disabled={isPasswordUpdating}
                                        {...field}
                                    />
                                </FormControl>

                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    <FormField
                        control={form.control}
                        name="newPassword"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>New Password</FormLabel>

                                <FormControl>
                                    <PasswordInput
                                        placeholder="********"
                                        disabled={isPasswordUpdating}
                                        {...field}
                                    />
                                </FormControl>

                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    <FormField
                        control={form.control}
                        name="confirmPassword"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Confirm Password</FormLabel>

                                <FormControl>
                                    <PasswordInput
                                        placeholder="********"
                                        isToggleDisabled
                                        disabled={isPasswordUpdating}
                                        {...field}
                                    />
                                </FormControl>

                                <FormMessage />
                            </FormItem>
                        )}
                    />
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
                        disabled={isPasswordUpdating || !form.formState.isDirty}
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
                        disabled={isPasswordUpdating || !form.formState.isDirty}
                    >
                        Save Changes
                    </Button>
                </CardFooter>
            </form>
        </Form>
    );
}
