"use client";

import { isClerkAPIResponseError } from "@clerk/nextjs/errors";
import { useSignIn } from "@clerk/nextjs";
import { Renivet } from "@/components/svgs";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";

type Method = "phone" | "email";
type Step = "credentials" | "phone-code";

function normalizeIndianPhone(value: string) {
    const digits = value.replace(/\D/g, "");
    if (digits.length === 10) return `+91${digits}`;
    if (digits.length === 11 && digits.startsWith("0"))
        return `+91${digits.slice(1)}`;
    if (digits.length === 12 && digits.startsWith("91")) return `+${digits}`;
    if (value.startsWith("+")) return value;
    throw new Error("Enter a valid phone number with its country code");
}

export function PhoneFirstSignIn() {
    const { isLoaded, signIn, setActive } = useSignIn();
    const router = useRouter();
    const [method, setMethod] = useState<Method>("phone");
    const [step, setStep] = useState<Step>("credentials");
    const [phone, setPhone] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [code, setCode] = useState("");
    const [error, setError] = useState<string | null>(null);
    const [pending, setPending] = useState(false);

    const showError = (value: unknown) => {
        if (isClerkAPIResponseError(value))
            setError(value.errors.map((item) => item.message).join(", "));
        else setError(value instanceof Error ? value.message : "Unable to sign in");
    };

    const complete = async (sessionId: string | null) => {
        if (!sessionId) throw new Error("A session could not be created");
        await setActive({ session: sessionId });
        router.push("/");
    };

    const continueWithGoogle = async () => {
        if (!isLoaded) return;
        setPending(true);
        setError(null);
        try {
            await signIn.authenticateWithRedirect({
                strategy: "oauth_google",
                redirectUrl: "/auth/sso-callback",
                redirectUrlComplete: "/",
            });
        } catch (value) {
            showError(value);
            setPending(false);
        }
    };

    const submit = async (event: FormEvent) => {
        event.preventDefault();
        if (!isLoaded) return;

        setPending(true);
        setError(null);
        try {
            if (step === "phone-code") {
                const attempt = await signIn.attemptFirstFactor({
                    strategy: "phone_code",
                    code,
                });
                if (attempt.status !== "complete")
                    throw new Error("The verification code could not be completed");
                await complete(attempt.createdSessionId);
                return;
            }

            if (method === "email") {
                const attempt = await signIn.create({
                    identifier: email.trim(),
                    password,
                });
                if (attempt.status !== "complete")
                    throw new Error("Email and password sign-in could not be completed");
                await complete(attempt.createdSessionId);
                return;
            }

            const attempt = await signIn.create({
                identifier: normalizeIndianPhone(phone),
            });
            const phoneFactor = attempt.supportedFirstFactors?.find(
                (factor) => factor.strategy === "phone_code"
            );
            if (!phoneFactor || phoneFactor.strategy !== "phone_code")
                throw new Error("SMS sign-in is not available for this phone number");

            await signIn.prepareFirstFactor({
                strategy: "phone_code",
                phoneNumberId: phoneFactor.phoneNumberId,
            });
            setStep("phone-code");
        } catch (value) {
            showError(value);
        } finally {
            setPending(false);
        }
    };

    const switchMethod = () => {
        setMethod((current) => (current === "phone" ? "email" : "phone"));
        setStep("credentials");
        setError(null);
    };

    return (
        <div className="w-full max-w-md rounded-2xl border bg-background p-8 shadow-sm">
            <Renivet className="mx-auto mb-4 size-11" />
            <h1 className="text-center text-2xl font-semibold">Sign in to Renivet</h1>
            <p className="mt-2 text-center text-sm text-muted-foreground">
                {step === "phone-code"
                    ? "Enter the SMS code sent to your phone"
                    : "Welcome back! Please sign in to continue"}
            </p>

            {step === "credentials" && (
                <>
                    <button
                        className="mt-7 flex h-11 w-full items-center justify-center gap-3 rounded-lg border bg-background font-medium shadow-sm transition hover:bg-muted disabled:opacity-50"
                        disabled={pending}
                        onClick={continueWithGoogle}
                        type="button"
                    >
                        <span className="text-xl font-bold text-blue-600">G</span>
                        Continue with Google
                    </button>
                    <div className="my-6 flex items-center gap-3 text-xs text-muted-foreground">
                        <span className="h-px flex-1 bg-border" />
                        or
                        <span className="h-px flex-1 bg-border" />
                    </div>
                </>
            )}

            <form className={`${step === "credentials" ? "" : "mt-8"} space-y-5`} onSubmit={submit}>
                {step === "phone-code" ? (
                    <label className="block space-y-2">
                        <span className="text-sm font-medium">SMS verification code</span>
                        <input
                            autoComplete="one-time-code"
                            className="h-11 w-full rounded-md border px-3"
                            inputMode="numeric"
                            onChange={(event) => setCode(event.target.value)}
                            placeholder="Enter the code"
                            required
                            value={code}
                        />
                    </label>
                ) : method === "phone" ? (
                    <label className="block space-y-2">
                        <span className="flex justify-between text-sm font-medium">
                            Phone number
                            <button
                                className="font-normal text-primary underline"
                                onClick={switchMethod}
                                type="button"
                            >
                                    Use email instead
                            </button>
                        </span>
                        <div className="flex h-12 overflow-hidden rounded-lg border bg-background focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/20">
                            <select
                                aria-label="Country"
                                className="w-20 border-r bg-transparent px-3 text-sm outline-none"
                                defaultValue="IN"
                            >
                                <option value="IN">IN</option>
                            </select>
                            <span className="flex items-center px-3 text-sm font-medium">+91</span>
                            <input
                                autoComplete="tel-national"
                                className="min-w-0 flex-1 bg-transparent pr-3 outline-none"
                                inputMode="tel"
                                onChange={(event) => setPhone(event.target.value)}
                                placeholder="Enter your phone number"
                                required
                                value={phone}
                            />
                        </div>
                    </label>
                ) : (
                    <>
                        <label className="block space-y-2">
                            <span className="flex justify-between text-sm font-medium">
                                Email address
                                <button
                                    className="font-normal text-primary underline"
                                    onClick={switchMethod}
                                    type="button"
                                >
                                    Use phone
                                </button>
                            </span>
                            <input
                                autoComplete="email"
                                className="h-11 w-full rounded-md border px-3"
                                onChange={(event) => setEmail(event.target.value)}
                                placeholder="you@example.com"
                                required
                                type="email"
                                value={email}
                            />
                        </label>
                        <label className="block space-y-2">
                            <span className="text-sm font-medium">Password</span>
                            <input
                                autoComplete="current-password"
                                className="h-11 w-full rounded-md border px-3"
                                onChange={(event) => setPassword(event.target.value)}
                                required
                                type="password"
                                value={password}
                            />
                        </label>
                    </>
                )}

                {error && <p className="text-sm text-destructive">{error}</p>}

                <button
                    className="h-11 w-full rounded-md bg-primary font-medium text-primary-foreground disabled:opacity-50"
                    disabled={pending}
                    type="submit"
                >
                    {pending
                        ? "Please wait…"
                        : step === "phone-code"
                          ? "Verify code"
                          : method === "phone"
                            ? "Send SMS code"
                            : "Sign in"}
                </button>
            </form>

            <p className="mt-6 text-center text-sm text-muted-foreground">
                Don&apos;t have an account?{" "}
                <Link className="text-primary underline" href="/auth/signup">
                    Sign up
                </Link>
            </p>
        </div>
    );
}
