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
    UpdateUserPhone,
    updateUserPhoneSchema,
    UserWithAddressesRolesAndBrand,
} from "@/lib/validations";
import { useUser } from "@clerk/nextjs";
import { isClerkAPIResponseError } from "@clerk/nextjs/errors";
import { PhoneNumberResource } from "@clerk/types";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { UserPhoneVerifyModal } from "../modals";

interface PageProps {
    user: UserWithAddressesRolesAndBrand;
}

export function UserPhoneUpdateForm({ user }: PageProps) {
    const [phoneObj, setPhoneObj] = useState<PhoneNumberResource>();
    const [isVerifyModalOpen, setIsVerifyModalOpen] = useState(false);

    const form = useForm<UpdateUserPhone>({
        resolver: zodResolver(updateUserPhoneSchema),
        defaultValues: {
            phone: user.phone ?? "",
        },
    });

    const { user: clerkUser, isLoaded: isClerkUserLoaded } = useUser();

    const {
        mutate: sendPhoneVerification,
        isPending: isPhoneVerificationSending,
    } = useMutation({
        onMutate: () => {
            const toastId = toast.loading(
                "Preparing to send verification SMS..."
            );
            return { toastId };
        },
        mutationFn: async (values: UpdateUserPhone) => {
            if (!isClerkUserLoaded || !clerkUser)
                throw new Error(DEFAULT_MESSAGES.ERRORS.USER_FETCHING);
            const res = await clerkUser.createPhoneNumber({
                phoneNumber: values.phone,
            });
            await clerkUser.reload();

            const phoneNumber = clerkUser.phoneNumbers.find(
                (phone) => phone.id === res.id
            );
            if (!phoneNumber)
                throw new Error(DEFAULT_MESSAGES.ERRORS.PHONE_NOT_FOUND);
            await phoneNumber.prepareVerification();

            return phoneNumber;
        },
        onSuccess: (phoneNumber, __, { toastId }) => {
            toast.success("SMS sent successfully", { id: toastId });
            setPhoneObj(phoneNumber);
            form.reset({
                phone: phoneNumber.phoneNumber,
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
                        sendPhoneVerification(values)
                    )}
                >
                    <FormField
                        control={form.control}
                        name="phone"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Phone</FormLabel>

                                <FormControl>
                                    <div className="flex items-center gap-2">
                                        <Input
                                            inputMode="tel"
                                            placeholder="+919874563210"
                                            disabled={
                                                isPhoneVerificationSending
                                            }
                                            {...field}
                                            onChange={(e) => {
                                                const value =
                                                    e.target.value.replace(
                                                        /[^0-9-+]/g,
                                                        ""
                                                    );

                                                field.onChange(value);
                                            }}
                                        />

                                        <Button
                                            type="submit"
                                            disabled={
                                                isPhoneVerificationSending ||
                                                !form.formState.isDirty
                                            }
                                        >
                                            Verify
                                        </Button>
                                    </div>
                                </FormControl>

                                <FormMessage className="text-xs">
                                    Add and verify your phone number for faster
                                    checkout and account updates.
                                </FormMessage>
                            </FormItem>
                        )}
                    />
                </form>
            </Form>

            <UserPhoneVerifyModal
                phoneObj={phoneObj}
                isOpen={isVerifyModalOpen}
                setIsOpen={setIsVerifyModalOpen}
            />
        </>
    );
}
