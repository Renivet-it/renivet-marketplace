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
import { DEFAULT_MESSAGES } from "@/config/const";
import { handleClientError } from "@/lib/utils";
import { ForgotPasswordS1, forgotPasswordS1Schema } from "@/lib/validations";
import { useSignIn } from "@clerk/nextjs";
import { isClerkAPIResponseError } from "@clerk/nextjs/errors";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

export function ForgotPasswordS1Form() {
    const router = useRouter();

    const form = useForm<ForgotPasswordS1>({
        resolver: zodResolver(forgotPasswordS1Schema),
        defaultValues: {
            email: "",
        },
    });

    const { isLoaded, signIn } = useSignIn();

    const { mutate: handleOTPSend, isPending: isOPTSending } = useMutation({
        onMutate: () => {
            const toastId = toast.loading("Preparing to send OTP...");
            return { toastId };
        },
        mutationFn: async (values: ForgotPasswordS1) => {
            if (!isLoaded) throw new Error(DEFAULT_MESSAGES.ERRORS.GENERIC);
            if (process.env.NEXT_PUBLIC_IS_AUTH_DISABLED === "true")
                throw new Error(
                    DEFAULT_MESSAGES.ERRORS.FORGOT_PASSWORD_DISABLED
                );

            await signIn.create({
                strategy: "reset_password_email_code",
                identifier: values.email,
            });
        },
        onSuccess: async (_, __, { toastId }) => {
            toast.success("An OTP has been sent to your email", {
                id: toastId,
            });
            router.push("/auth/forgot-password/s2");
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
                onSubmit={form.handleSubmit((values) => handleOTPSend(values))}
            >
                <CardContent className="space-y-4">
                    <FormField
                        control={form.control}
                        name="email"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Email</FormLabel>

                                <FormControl>
                                    <Input
                                        type="email"
                                        placeholder="johndoe@gmail.com"
                                        disabled={isOPTSending}
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
                        disabled={isOPTSending}
                    >
                        Send OTP
                    </Button>
                </CardFooter>
            </form>
        </Form>
    );
}
