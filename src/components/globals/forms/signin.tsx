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
import { handleClientError } from "@/lib/utils";
import { SignIn, signInSchema } from "@/lib/validations";
import { useSignIn } from "@clerk/nextjs";
import { isClerkAPIResponseError } from "@clerk/nextjs/errors";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

export function SignInForm() {
    const router = useRouter();

    const form = useForm<SignIn>({
        resolver: zodResolver(signInSchema),
        defaultValues: {
            email: "",
            password: "",
        },
    });

    const { isLoaded, signIn, setActive } = useSignIn();

    const { mutate: handleSignIn, isPending: isSigninIn } = useMutation({
        onMutate: () => {
            const toastId = toast.loading("Logging you in...");
            return { toastId };
        },
        mutationFn: async (values: SignIn) => {
            if (!isLoaded) throw new Error(DEFAULT_MESSAGES.ERRORS.GENERIC);
            if (process.env.NEXT_PUBLIC_IS_AUTH_DISABLED === "true")
                throw new Error(DEFAULT_MESSAGES.ERRORS.SIGNIN_DISABLED);

            const signInAttempt = await signIn.create({
                identifier: values.email,
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
                        name="email"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Email</FormLabel>

                                <FormControl>
                                    <Input
                                        type="email"
                                        placeholder="johndoe@gmail.com"
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
                </CardContent>

                <CardFooter className="flex-col items-end gap-4">
                    <Button
                        type="submit"
                        className="w-full"
                        disabled={isSigninIn}
                    >
                        Sign In
                    </Button>

                    <div className="space-y-1 text-end">
                        <p className="text-sm">
                            Don&apos;t have an account?{" "}
                            <Link
                                href="/auth/signup"
                                className="text-accent underline underline-offset-2"
                            >
                                Create one here
                            </Link>
                        </p>

                        <p className="text-sm">
                            Forgot your password?{" "}
                            <Link
                                href="/auth/forgot-password/s1"
                                className="text-accent underline underline-offset-2"
                            >
                                Reset here
                            </Link>
                        </p>
                    </div>
                </CardFooter>
            </form>
        </Form>
    );
}
