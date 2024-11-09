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
import { PasswordInput } from "@/components/ui/password-input";
import { DEFAULT_MESSAGES } from "@/config/const";
import { SignUp, signUpSchema } from "@/lib/validations";
import { useSignUp } from "@clerk/nextjs";
import { isClerkAPIResponseError } from "@clerk/nextjs/errors";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

export function SignUpForm() {
    const router = useRouter();

    const form = useForm<SignUp>({
        resolver: zodResolver(signUpSchema),
        defaultValues: {
            firstName: "",
            lastName: "",
            email: "",
            password: "",
            confirmPassword: "",
        },
    });

    const { isLoaded, signUp } = useSignUp();

    const { mutate: handleSignUp, isPending: isSigninUp } = useMutation({
        onMutate: () => {
            const toastId = toast.loading("Creating your account...");
            return { toastId };
        },
        mutationFn: async (values: SignUp) => {
            if (!isLoaded) throw new Error(DEFAULT_MESSAGES.ERRORS.GENERIC);
            if (process.env.NEXT_PUBLIC_IS_AUTH_DISABLED === "true")
                throw new Error(DEFAULT_MESSAGES.ERRORS.SIGNUP_DISABLED);

            await signUp.create({
                emailAddress: values.email,
                password: values.password,
                firstName: values.firstName,
                lastName: values.lastName,
            });

            await signUp.prepareEmailAddressVerification({
                strategy: "email_code",
            });
        },
        onSuccess: (_, __, { toastId }) => {
            toast.success("Account created, please verify your email", {
                id: toastId,
            });
            router.push("/auth/verify");
        },
        onError: (err, __, ctx) => {
            return isClerkAPIResponseError(err)
                ? toast.error(err.errors.map((e) => e.message).join(", "), {
                      id: ctx?.toastId,
                  })
                : toast.error(err.message, {
                      id: ctx?.toastId,
                  });
        },
    });

    return (
        <Form {...form}>
            <form
                className="space-y-4"
                onSubmit={form.handleSubmit((values) => handleSignUp(values))}
            >
                <CardContent className="space-y-4">
                    <div className="flex flex-col items-center gap-4 md:flex-row">
                        <FormField
                            control={form.control}
                            name="firstName"
                            render={({ field }) => (
                                <FormItem className="w-full">
                                    <FormLabel>First Name</FormLabel>

                                    <FormControl>
                                        <Input
                                            placeholder="John"
                                            disabled={isSigninUp}
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
                                <FormItem className="w-full">
                                    <FormLabel>Last Name</FormLabel>

                                    <FormControl>
                                        <Input
                                            placeholder="Doe"
                                            disabled={isSigninUp}
                                            {...field}
                                        />
                                    </FormControl>

                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                    </div>

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
                                        disabled={isSigninUp}
                                        {...field}
                                    />
                                </FormControl>

                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    <div className="flex flex-col items-center gap-4 md:flex-row">
                        <FormField
                            control={form.control}
                            name="password"
                            render={({ field }) => (
                                <FormItem className="w-full">
                                    <FormLabel>Password</FormLabel>

                                    <FormControl>
                                        <PasswordInput
                                            placeholder="********"
                                            disabled={isSigninUp}
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
                                            disabled={isSigninUp}
                                            isToggleDisabled
                                            {...field}
                                        />
                                    </FormControl>

                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                    </div>
                </CardContent>

                <CardFooter className="flex-col items-end gap-4">
                    <Button
                        type="submit"
                        className="w-full"
                        disabled={isSigninUp}
                    >
                        Create Account
                    </Button>

                    <p className="text-sm">
                        Already have an account?{" "}
                        <Link
                            href="/auth/signin"
                            className="text-accent underline underline-offset-2"
                        >
                            Login here
                        </Link>
                    </p>
                </CardFooter>
            </form>
        </Form>
    );
}
