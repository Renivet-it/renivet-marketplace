"use client";

import { Google, RenivetFull } from "@/components/svgs";
import { useSignIn } from "@clerk/nextjs";
import { isClerkAPIResponseError } from "@clerk/nextjs/errors";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";

type Method = "phone" | "email";
type Step = "credentials" | "phone-code";

const fieldClass =
    "h-10 w-full rounded-xl border bg-background px-4 text-sm outline-none transition placeholder:text-muted-foreground focus:border-primary focus:ring-4 focus:ring-primary/10";

function normalizeIndianPhone(value: string) {
    const digits = value.replace(/\D/g, "");
    if (digits.length === 10) return `+91${digits}`;
    if (digits.length === 11 && digits.startsWith("0"))
        return `+91${digits.slice(1)}`;
    if (digits.length === 12 && digits.startsWith("91")) return `+${digits}`;
    if (value.startsWith("+")) return value;
    throw new Error("Enter a valid phone number with its country code");
}

function BrandHeader({
    eyebrow,
    title,
    description,
}: {
    eyebrow: string;
    title: string;
    description: string;
}) {
    return (
        <>
            <div className="mb-7 flex items-center justify-between">
                <RenivetFull height={36} width={120} />
                <span className="rounded-full bg-primary/10 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.14em] text-primary">
                    {eyebrow}
                </span>
            </div>
            <h1 className="text-3xl font-semibold tracking-tight">{title}</h1>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">
                {description}
            </p>
        </>
    );
}

export function PhoneFirstSignIn() {
    const { isLoaded, signIn, setActive } = useSignIn();
    const router = useRouter();
    const [method, setMethod] = useState<Method>("email");
    const [step, setStep] = useState<Step>("credentials");
    const [phone, setPhone] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [code, setCode] = useState("");
    const [error, setError] = useState<string | null>(null);
    const [pending, setPending] = useState(false);

    const showError = (value: unknown) =>
        setError(
            isClerkAPIResponseError(value)
                ? value.errors.map((item) => item.message).join(", ")
                : value instanceof Error
                  ? value.message
                  : "Unable to sign in"
        );
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
                    throw new Error(
                        "The verification code could not be completed"
                    );
                await complete(attempt.createdSessionId);
                return;
            }
            if (method === "email") {
                const attempt = await signIn.create({
                    identifier: email.trim(),
                    password,
                });
                if (attempt.status !== "complete")
                    throw new Error(
                        "Email and password sign-in could not be completed"
                    );
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
                throw new Error(
                    "SMS sign-in is not available for this phone number"
                );
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
    const isCode = step === "phone-code";

    return (
        <div className="relative w-full max-w-[440px] overflow-hidden rounded-[28px] border border-border/80 bg-background shadow-[0_24px_70px_-28px_rgba(24,30,17,0.35)]">
            <Image
                alt=""
                aria-hidden="true"
                className="pointer-events-none absolute -right-10 -top-8 w-72"
                height={288}
                src="/images/auth/botanical-branch.png"
                width={288}
            />
            <Image
                alt=""
                aria-hidden="true"
                className="pointer-events-none absolute -bottom-10 -left-7 w-48 opacity-60"
                height={192}
                src="/images/auth/bottom-leaf-sprig.png"
                width={192}
            />
            <div className="relative bg-gradient-to-b from-primary/[0.07] to-transparent px-6 pb-5 pt-7 sm:px-9 sm:pt-8">
                <BrandHeader
                    eyebrow="Secure access"
                    title={isCode ? "Check your messages" : "Welcome back"}
                    description={
                        isCode
                            ? "Enter the six-digit code we sent to your phone."
                            : "Sign in to continue shopping with Renivet."
                    }
                />
            </div>
            <div className="px-6 pb-7 pt-5 sm:px-9">
                {!isCode && (
                    <>
                        <button
                            className="flex h-12 w-full items-center justify-center gap-3 rounded-xl border bg-background font-medium shadow-sm transition hover:border-primary/35 hover:bg-muted/50 disabled:cursor-not-allowed disabled:opacity-50"
                            disabled={pending}
                            onClick={continueWithGoogle}
                            type="button"
                        >
                            <Google className="size-5" />
                            Continue with Google
                        </button>
                        <div className="my-5 flex items-center gap-3 text-[11px] font-medium uppercase tracking-[0.14em] text-muted-foreground">
                            <span className="h-px flex-1 bg-border" />
                            or
                            <span className="h-px flex-1 bg-border" />
                        </div>
                    </>
                )}
                <form
                    className={`${isCode ? "mt-5" : ""} space-y-5`}
                    onSubmit={submit}
                >
                    {isCode ? (
                        <label className="block space-y-2">
                            <span className="text-sm font-semibold">
                                OTP verification code
                            </span>
                            <input
                                autoComplete="one-time-code"
                                className={`${fieldClass} text-center text-lg tracking-[0.35em] placeholder:tracking-normal`}
                                inputMode="numeric"
                                onChange={(event) =>
                                    setCode(event.target.value)
                                }
                                placeholder="••••••"
                                required
                                value={code}
                            />
                        </label>
                    ) : method === "phone" ? (
                        <label className="block space-y-2">
                            <span className="flex justify-between text-sm font-semibold">
                                Phone number
                                <button
                                    className="font-medium text-primary underline-offset-4 hover:underline"
                                    onClick={switchMethod}
                                    type="button"
                                >
                                    Login with email
                                </button>
                            </span>
                            <div className="flex h-10 overflow-hidden rounded-xl border bg-background transition focus-within:border-primary focus-within:ring-4 focus-within:ring-primary/10">
                                <select
                                    aria-label="Country"
                                    className="w-[86px] border-r bg-transparent px-4 text-sm font-medium outline-none"
                                    defaultValue="IN"
                                >
                                    <option value="IN">IN</option>
                                </select>
                                <span className="flex items-center px-3 text-sm font-semibold text-foreground/80">
                                    +91
                                </span>
                                <input
                                    autoComplete="tel-national"
                                    className="min-w-0 flex-1 bg-transparent pr-4 text-sm outline-none placeholder:text-muted-foreground"
                                    inputMode="tel"
                                    onChange={(event) =>
                                        setPhone(event.target.value)
                                    }
                                    placeholder="Enter your phone number"
                                    required
                                    value={phone}
                                />
                            </div>
                            <p className="text-xs text-muted-foreground">
                                We&apos;ll send a one-time password (OTP).
                            </p>
                        </label>
                    ) : (
                        <>
                            <label className="block space-y-2">
                                <span className="flex justify-between text-sm font-semibold">
                                    Email address
                                    <button
                                        className="font-medium text-primary underline-offset-4 hover:underline"
                                        onClick={switchMethod}
                                        type="button"
                                    >
                                    Login with phone
                                    </button>
                                </span>
                                <input
                                    autoComplete="email"
                                    className={fieldClass}
                                    onChange={(event) =>
                                        setEmail(event.target.value)
                                    }
                                    placeholder="you@example.com"
                                    required
                                    type="email"
                                    value={email}
                                />
                            </label>
                            <label className="block space-y-2">
                                <span className="text-sm font-semibold">
                                    Password
                                </span>
                                <input
                                    autoComplete="current-password"
                                    className={fieldClass}
                                    onChange={(event) =>
                                        setPassword(event.target.value)
                                    }
                                    required
                                    type="password"
                                    value={password}
                                />
                            </label>
                        </>
                    )}
                    {error && (
                        <p className="rounded-xl border border-destructive/20 bg-destructive/10 px-3 py-2.5 text-sm text-destructive">
                            {error}
                        </p>
                    )}
                    <button
                        className="h-11 w-full rounded-xl bg-primary font-semibold text-primary-foreground shadow-lg shadow-primary/20 transition hover:brightness-95 disabled:cursor-not-allowed disabled:opacity-50"
                        disabled={pending}
                        type="submit"
                    >
                        {pending
                            ? "Please wait..."
                            : isCode
                              ? "Verify code"
                              : method === "phone"
                                ? "Login with OTP"
                                : "Login with email"}
                    </button>
                </form>
                <p className="mt-6 text-center text-sm text-muted-foreground">
                    Don&apos;t have an account?{" "}
                    <Link
                        className="font-semibold text-primary underline-offset-4 hover:underline"
                        href="/auth/signup"
                    >
                        Sign up
                    </Link>
                </p>
            </div>
        </div>
    );
}
