"use client";

import { AlertDialogFooter } from "@/components/ui/alert-dialog-general";
import { Button } from "@/components/ui/button-general";
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form";
import {
    InputOTP,
    InputOTPGroup,
    InputOTPSeparator,
    InputOTPSlot,
} from "@/components/ui/input-otp";
import { DEFAULT_MESSAGES } from "@/config/const";
import { OTP, otpSchema } from "@/lib/validations";
import { useUser } from "@clerk/nextjs";
import { isClerkAPIResponseError } from "@clerk/nextjs/errors";
import { PhoneNumberResource } from "@clerk/types";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { Dispatch, SetStateAction } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

interface PageProps {
    phoneObj?: PhoneNumberResource;
    setIsOpen: Dispatch<SetStateAction<boolean>>;
}

export function PhoneOTPVerificationForm({ phoneObj, setIsOpen }: PageProps) {
    const form = useForm<OTP>({
        resolver: zodResolver(otpSchema),
        defaultValues: {
            otp: "",
        },
    });

    const { user: clerkUser, isLoaded: isClerkUserLoaded } = useUser();

    const { mutate: verifyAccount, isPending: isVerifyingAccount } =
        useMutation({
            onMutate: () => {
                const toastId = toast.loading("Verifying OTP...");
                return { toastId };
            },
            mutationFn: async (values: OTP) => {
                if (!isClerkUserLoaded || !clerkUser)
                    throw new Error(DEFAULT_MESSAGES.ERRORS.USER_FETCHING);
                if (!phoneObj) throw new Error(DEFAULT_MESSAGES.ERRORS.GENERIC);

                const oldPhoneNumber = clerkUser.primaryPhoneNumber;

                const verifyAttempt = await phoneObj.attemptVerification({
                    code: values.otp,
                });

                if (verifyAttempt.verification.status !== "verified")
                    throw verifyAttempt.verification.error;

                await clerkUser.update({
                    primaryPhoneNumberId: phoneObj.id,
                });

                await oldPhoneNumber?.destroy();
            },
            onSuccess: async (_, __, { toastId }) => {
                toast.success("Phone number verified successfully", {
                    id: toastId,
                });
                clerkUser?.reload();
                setIsOpen(false);
            },
            onError: (err, __, ctx) => {
                return isClerkAPIResponseError(err)
                    ? toast.error(err.errors.map((e) => e.message).join(", "), {
                          id: ctx?.toastId,
                      })
                    : toast.error(DEFAULT_MESSAGES.ERRORS.GENERIC, {
                          id: ctx?.toastId,
                      });
            },
        });

    return (
        <Form {...form}>
            <form
                className="space-y-4"
                onSubmit={form.handleSubmit((values) => verifyAccount(values))}
            >
                <FormField
                    control={form.control}
                    name="otp"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>OTP</FormLabel>

                            <FormControl>
                                <InputOTP
                                    maxLength={6}
                                    disabled={isVerifyingAccount}
                                    {...field}
                                >
                                    <InputOTPGroup>
                                        <InputOTPSlot
                                            index={0}
                                            className="first:rounded-l-none"
                                        />
                                        <InputOTPSlot index={1} />
                                        <InputOTPSlot
                                            index={2}
                                            className="last:rounded-r-none"
                                        />
                                    </InputOTPGroup>

                                    <InputOTPSeparator />

                                    <InputOTPGroup>
                                        <InputOTPSlot
                                            index={3}
                                            className="first:rounded-l-none"
                                        />
                                        <InputOTPSlot index={4} />
                                        <InputOTPSlot
                                            index={5}
                                            className="last:rounded-r-none"
                                        />
                                    </InputOTPGroup>
                                </InputOTP>
                            </FormControl>

                            <FormMessage />
                        </FormItem>
                    )}
                />

                <AlertDialogFooter>
                    <Button
                        type="submit"
                        className="w-full"
                        disabled={isVerifyingAccount}
                    >
                        Verify OTP
                    </Button>
                </AlertDialogFooter>
            </form>
        </Form>
    );
}
