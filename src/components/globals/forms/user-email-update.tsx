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
import { DEFAULT_MESSAGES } from "@/config/const";
import { handleClientError } from "@/lib/utils";
import {
    UpdateUserEmail,
    updateUserEmailSchema,
    UserWithAddressesAndRoles,
} from "@/lib/validations";
import { useUser } from "@clerk/nextjs";
import { isClerkAPIResponseError } from "@clerk/nextjs/errors";
import { EmailAddressResource } from "@clerk/types";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { UserEmailVerifyModal } from "../modals";

interface PageProps {
    user: UserWithAddressesAndRoles;
}

export function UserEmailUpdateForm({ user }: PageProps) {
    const [emailObj, setEmailObj] = useState<EmailAddressResource>();
    const [isVerifyModalOpen, setIsVerifyModalOpen] = useState(false);

    const form = useForm<UpdateUserEmail>({
        resolver: zodResolver(updateUserEmailSchema),
        defaultValues: {
            email: user.email,
        },
    });

    const { user: clerkUser, isLoaded: isClerkUserLoaded } = useUser();

    const {
        mutate: sendEmailVerification,
        isPending: isEmailVerificationSending,
    } = useMutation({
        onMutate: () => {
            const toastId = toast.loading(
                "Preparing to send verification email..."
            );
            return { toastId };
        },
        mutationFn: async (values: UpdateUserEmail) => {
            if (!isClerkUserLoaded || !clerkUser)
                throw new Error(DEFAULT_MESSAGES.ERRORS.USER_FETCHING);
            const res = await clerkUser.createEmailAddress({
                email: values.email,
            });
            await clerkUser.reload();

            const emailAddress = clerkUser.emailAddresses.find(
                (e) => e.id === res.id
            );
            if (!emailAddress)
                throw new Error(DEFAULT_MESSAGES.ERRORS.EMAIL_NOT_FOUND);
            setEmailObj(emailAddress);

            await emailAddress.prepareVerification({
                strategy: "email_code",
            });
        },
        onSuccess: (_, __, { toastId }) => {
            toast.success(
                "A verification email has been sent to your new email",
                { id: toastId }
            );
            form.reset({
                email: emailObj?.emailAddress,
            });
            setIsVerifyModalOpen(true);
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
        <>
            <Form {...form}>
                <form
                    onSubmit={form.handleSubmit((values) =>
                        sendEmailVerification(values)
                    )}
                >
                    <FormField
                        control={form.control}
                        name="email"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Email</FormLabel>

                                <FormControl>
                                    <div className="flex items-center gap-2">
                                        <Input
                                            inputMode="email"
                                            placeholder="johndoe@gmail.com"
                                            disabled={
                                                isEmailVerificationSending
                                            }
                                            {...field}
                                        />

                                        <Button
                                            type="submit"
                                            disabled={
                                                isEmailVerificationSending ||
                                                !form.formState.isDirty
                                            }
                                        >
                                            Verify
                                        </Button>
                                    </div>
                                </FormControl>

                                <FormMessage />
                            </FormItem>
                        )}
                    />
                </form>
            </Form>

            <UserEmailVerifyModal
                emailObj={emailObj}
                isOpen={isVerifyModalOpen}
                setIsOpen={setIsVerifyModalOpen}
            />
        </>
    );
}
