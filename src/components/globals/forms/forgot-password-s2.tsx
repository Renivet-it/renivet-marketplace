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
import { PasswordInput } from "@/components/ui/password-input";
import { DEFAULT_MESSAGES } from "@/config/const";
import { handleClientError } from "@/lib/utils";
import { ForgotPasswordS2, forgotPasswordS2Schema } from "@/lib/validations";
import { useSignIn } from "@clerk/nextjs";
import { isClerkAPIResponseError } from "@clerk/nextjs/errors";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

export function ForgotPasswordS2Form() {
    const router = useRouter();

    const form = useForm<ForgotPasswordS2>({
        resolver: zodResolver(forgotPasswordS2Schema),
        defaultValues: {
            otp: "",
            password: "",
            confirmPassword: "",
        },
    });

    const { isLoaded, signIn, setActive } = useSignIn();

    const { mutate: handleSignIn, isPending: isSigninIn } = useMutation({
        onMutate: () => {
            const toastId = toast.loading(
                "Verifying OTP and updating password..."
            );
            return { toastId };
        },
        mutationFn: async (values: ForgotPasswordS2) => {
            if (!isLoaded) throw new Error(DEFAULT_MESSAGES.ERRORS.GENERIC);

            const signInAttempt = await signIn.attemptFirstFactor({
                strategy: "reset_password_email_code",
                code: values.otp,
                password: values.password,
            });

            if (signInAttempt.status !== "complete")
                throw new Error("Missing requirements or verification aborted");

            return { signInAttempt };
        },
        onSuccess: async ({ signInAttempt }, _, { toastId }) => {
            await setActive?.({
                session: signInAttempt.createdSessionId,
            });
            toast.success("Welcome back!", {
                id: toastId,
            });
            router.push("/");
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
                className="space-y-4"
                onSubmit={form.handleSubmit((values) => handleSignIn(values))}
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
                                        disabled={isSigninIn}
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

                    <FormField
                        control={form.control}
                        name="password"
                        render={({ field }) => (
                            <FormItem className="w-full">
                                <FormLabel>Password</FormLabel>

                                <FormControl>
                                    <PasswordInput
                                        placeholder="********"
                                        disabled={isSigninIn}
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
                            <FormItem className="w-full">
                                <FormLabel>Confirm Password</FormLabel>

                                <FormControl>
                                    <PasswordInput
                                        placeholder="********"
                                        disabled={isSigninIn}
                                        isToggleDisabled
                                        {...field}
                                    />
                                </FormControl>

                                <FormMessage />
                            </FormItem>
                        )}
                    />
                </CardContent>

                <CardFooter className="flex-col items-end gap-4">
                    <Button
                        type="submit"
                        className="w-full"
                        disabled={isSigninIn}
                    >
                        Update Password
                    </Button>
                </CardFooter>
            </form>
        </Form>
    );
}
