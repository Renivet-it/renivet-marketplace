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
import {
    InputOTP,
    InputOTPGroup,
    InputOTPSeparator,
    InputOTPSlot,
} from "@/components/ui/input-otp";
import { DEFAULT_MESSAGES } from "@/config/const";
import { siteConfig } from "@/config/site";
import { OTP, otpSchema } from "@/lib/validations";
import { useSignUp } from "@clerk/nextjs";
import { isClerkAPIResponseError } from "@clerk/nextjs/errors";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

export function OTPVerificationForm() {
    const router = useRouter();

    const form = useForm<OTP>({
        resolver: zodResolver(otpSchema),
        defaultValues: {
            otp: "",
        },
    });

    const { isLoaded, signUp, setActive } = useSignUp();

    const { mutate: verifyAccount, isPending: isVerifyingAccount } =
        useMutation({
            onMutate: () => {
                const toastId = toast.loading("Verifying OTP...");
                return { toastId };
            },
            mutationFn: async (values: OTP) => {
                if (!isLoaded) throw new Error(DEFAULT_MESSAGES.ERRORS.GENERIC);

                const signUpAttempt =
                    await signUp.attemptEmailAddressVerification({
                        code: values.otp,
                    });

                if (signUpAttempt.status !== "complete")
                    throw new Error(
                        "Missing requirements or verification aborted"
                    );

                return { signUpAttempt };
            },
            onSuccess: async ({ signUpAttempt }, _, { toastId }) => {
                await setActive?.({
                    session: signUpAttempt.createdSessionId,
                });
                toast.success(
                    `Hey, ${signUpAttempt.firstName}, Welcome to ${siteConfig.name}!`,
                    { id: toastId }
                );
                router.push("/");
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
                <CardContent className="space-y-4">
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
                </CardContent>

                <CardFooter>
                    <Button
                        type="submit"
                        className="w-full"
                        disabled={isVerifyingAccount}
                    >
                        Verify OTP
                    </Button>
                </CardFooter>
            </form>
        </Form>
    );
}
