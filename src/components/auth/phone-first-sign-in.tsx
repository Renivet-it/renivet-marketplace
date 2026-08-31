"use client";

import {
    captureAuthEvent,
    captureAuthInitiation,
    getAuthEventProperties,
} from "@/components/auth/auth-analytics";
import { resolveEmailPasswordSignIn } from "@/components/auth/email-password-sign-in";
import { OTPCodeInput } from "@/components/auth/otp-code-input";
import { Google, RenivetFull } from "@/components/svgs";
import { POSTHOG_EVENTS } from "@/config/posthog";
import { getSafeRedirectUrl } from "@/lib/auth/redirect";
import { useSignIn, useSignUp } from "@clerk/nextjs";
import { isClerkAPIResponseError } from "@clerk/nextjs/errors";
import Image from "next/image";
import Link from "next/link";
import { usePostHog } from "posthog-js/react";
import { FormEvent, useState } from "react";
import { useSearchParams } from "next/navigation";

type Method = "phone" | "email";
type Step = "credentials" | "phone-code" | "email-second-factor";
type PhoneAttempt = "sign-in" | "sign-up";

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

function phoneSignupPlaceholderLastName() {
    return `Customer ${Math.floor(10000 + Math.random() * 90000)}`;
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
    const { signUp, setActive: setSignUpActive } = useSignUp();
    const posthog = usePostHog();
    const searchParams = useSearchParams();
    const destination = getSafeRedirectUrl(searchParams.get("redirect_url"));
    const [method, setMethod] = useState<Method>("phone");
    const [step, setStep] = useState<Step>("credentials");
    const [phoneAttempt, setPhoneAttempt] = useState<PhoneAttempt>("sign-in");
    const [phone, setPhone] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [code, setCode] = useState("");
    const [emailSecondFactorId, setEmailSecondFactorId] = useState<
        string | null
    >(null);
    const [error, setError] = useState<string | null>(null);
    const [notice, setNotice] = useState<string | null>(null);
    const [pending, setPending] = useState(false);

    const showError = (value: unknown) => {
        if (
            isClerkAPIResponseError(value) &&
            value.errors.some((item) => item.code === "form_code_incorrect")
        ) {
            setError(
                `Incorrect code. Please check the latest code sent to your ${step === "email-second-factor" ? "email" : "phone"} and try again.`
            );
            return;
        }

        setError(
            isClerkAPIResponseError(value)
                ? value.errors.map((item) => item.message).join(", ")
                : value instanceof Error
                  ? value.message
                  : "Unable to sign in"
        );
    };
    const complete = async (
        sessionId: string | null,
        flow: "sign-in" | "sign-up" = "sign-in"
    ) => {
        if (!sessionId) throw new Error("A session could not be created");
        if (!setActive) throw new Error("Sign-in is still loading");
        await setActive({ session: sessionId });
        captureAuthEvent(
            posthog,
            POSTHOG_EVENTS.AUTH.SIGNED_IN,
            getAuthEventProperties(flow, method)
        );
        await fetch("/api/account/sync", { method: "POST" }).catch(
            () => undefined
        );
        window.location.assign(destination);
    };

    const completePhoneSignUp = async (sessionId: string | null) => {
        if (!sessionId) throw new Error("A session could not be created");
        if (!setSignUpActive) throw new Error("Sign-up is still loading");
        await setSignUpActive({ session: sessionId });
        captureAuthEvent(
            posthog,
            POSTHOG_EVENTS.AUTH.SIGNED_IN,
            getAuthEventProperties("sign-up", "phone")
        );
        await fetch("/api/account/sync", { method: "POST" }).catch(
            () => undefined
        );
        window.location.assign(destination);
    };

    const isUnknownPhoneNumber = (value: unknown) =>
        isClerkAPIResponseError(value) &&
        value.errors.some((error) =>
            ["form_identifier_not_found", "identifier_not_found"].includes(
                error.code
            )
        );

    const continueWithGoogle = async () => {
        if (!isLoaded) return;
        captureAuthEvent(
            posthog,
            POSTHOG_EVENTS.AUTH.SIGNIN_INITIATED,
            getAuthEventProperties("sign-in", "google")
        );
        setPending(true);
        setError(null);
        try {
            await signIn.authenticateWithRedirect({
                strategy: "oauth_google",
                redirectUrl: "/auth/sso-callback?flow=sign-in",
                redirectUrlComplete: destination,
            });
        } catch (value) {
            showError(value);
            setPending(false);
        }
    };

    const resendOtp = async () => {
        if (!isLoaded) return;
        setPending(true);
        setError(null);
        setNotice(null);
        try {
            if (step === "email-second-factor") {
                if (!emailSecondFactorId)
                    throw new Error(
                        "Email verification is no longer available. Please sign in again."
                    );
                await signIn.prepareSecondFactor({
                    strategy: "email_code",
                    emailAddressId: emailSecondFactorId,
                } as never);
            } else if (phoneAttempt === "sign-up") {
                if (!signUp) throw new Error("Sign-up is still loading");
                await signUp.preparePhoneNumberVerification({
                    strategy: "phone_code",
                });
            } else {
                const phoneFactor = signIn.supportedFirstFactors?.find(
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
            }
            setCode("");
            setNotice(
                `A new verification code has been sent to your ${step === "email-second-factor" ? "email" : "phone"}.`
            );
        } catch (value) {
            showError(value);
        } finally {
            setPending(false);
        }
    };

    const submit = async (event: FormEvent) => {
        event.preventDefault();
        if (!isLoaded) return;
        if (step === "credentials") {
            captureAuthInitiation(posthog, "sign-in", method);
        }
        setPending(true);
        setError(null);
        setNotice(null);
        try {
            if (step === "email-second-factor") {
                const attempt = await signIn.attemptSecondFactor({
                    strategy: "email_code",
                    code,
                } as never);
                if (attempt.status !== "complete")
                    throw new Error(
                        "Email verification could not be completed. Please request a new code and try again."
                    );
                await complete(attempt.createdSessionId);
                return;
            }
            if (step === "phone-code") {
                if (phoneAttempt === "sign-up") {
                    if (!signUp) throw new Error("Sign-up is still loading");
                    const attempt = await signUp.attemptPhoneNumberVerification(
                        {
                            code,
                        }
                    );
                    if (attempt.status !== "complete")
                        throw new Error(
                            "The verification code could not be completed"
                        );
                    await completePhoneSignUp(attempt.createdSessionId);
                    return;
                }

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
                const resolution = resolveEmailPasswordSignIn(attempt);
                if (resolution.type === "complete") {
                    await complete(resolution.sessionId);
                    return;
                }
                if (resolution.type === "verify-email") {
                    await signIn.prepareSecondFactor({
                        strategy: "email_code",
                        emailAddressId: resolution.emailAddressId,
                    } as never);
                    setEmailSecondFactorId(resolution.emailAddressId);
                    setCode("");
                    setStep("email-second-factor");
                    setNotice(
                        "For your security, we sent a verification code to your email."
                    );
                    return;
                }
                if (resolution.status === "needs_new_password")
                    throw new Error(
                        "Your password needs to be reset before you can sign in. Use Forgot password to continue."
                    );
                throw new Error(
                    "This sign-in requires a verification method that is not available. Try Google sign-in or reset your password."
                );
            }
            const normalizedPhone = normalizeIndianPhone(phone);
            try {
                const attempt = await signIn.create({
                    identifier: normalizedPhone,
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
                setPhoneAttempt("sign-in");
                setStep("phone-code");
            } catch (value) {
                if (!isUnknownPhoneNumber(value)) throw value;
                if (!signUp) throw new Error("Sign-up is still loading");

                await signUp.create({
                    phoneNumber: normalizedPhone,
                    // Phone-only sign-up must satisfy Clerk instances that
                    // require names, while the homepage asks the customer to
                    // replace these placeholders after the first login.
                    firstName: "Renivet",
                    lastName: phoneSignupPlaceholderLastName(),
                    legalAccepted: true,
                    unsafeMetadata: {
                        profileCompletionRequired: true,
                    },
                });
                await signUp.preparePhoneNumberVerification({
                    strategy: "phone_code",
                });
                setPhoneAttempt("sign-up");
                setStep("phone-code");
            }
        } catch (value) {
            showError(value);
        } finally {
            setPending(false);
        }
    };

    const switchMethod = () => {
        setMethod((current) => (current === "phone" ? "email" : "phone"));
        setStep("credentials");
        setPhoneAttempt("sign-in");
        setEmailSecondFactorId(null);
        setCode("");
        setError(null);
        setNotice(null);
    };
    const isCode = step !== "credentials";
    const isEmailCode = step === "email-second-factor";

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
                    title={
                        isEmailCode
                            ? "Verify your email"
                            : isCode
                              ? "Check your messages"
                              : "Welcome back"
                    }
                    description={
                        isEmailCode
                            ? "Enter the six-digit code we sent to your email."
                            : isCode
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
                        <div className="my-5 flex items-center gap-3 text-11 font-medium uppercase tracking-[0.14em] text-muted-foreground">
                            <span className="h-px flex-1 bg-border" />
                            or
                            <span className="h-px flex-1 bg-border" />
                        </div>
                    </>
                )}
                <form
                    className={`${isCode ? "mt-2" : ""} space-y-5`}
                    onSubmit={submit}
                >
                    {isCode ? (
                        <label className="block space-y-2">
                            <span className="text-sm font-semibold">
                                {isEmailCode
                                    ? "Email verification code"
                                    : "OTP verification code"}
                            </span>
                            <OTPCodeInput value={code} onChange={setCode} />
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
                                We&apos;ll send a one-time password (OTP). New
                                numbers create an account after verification.
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
                    {notice && (
                        <p className="rounded-xl border border-primary/20 bg-primary/10 px-3 py-2.5 text-sm text-primary">
                            {notice}
                        </p>
                    )}
                    {isCode && (
                        <button
                            className="w-full text-center text-sm font-medium text-primary underline-offset-4 hover:underline disabled:opacity-50"
                            disabled={pending}
                            onClick={resendOtp}
                            type="button"
                        >
                            Didn&apos;t receive it? Resend code
                        </button>
                    )}
                    <button
                        className="h-11 w-full rounded-xl bg-primary font-semibold text-primary-foreground shadow-lg shadow-primary/20 transition hover:brightness-95 disabled:cursor-not-allowed disabled:opacity-50"
                        disabled={pending}
                        type="submit"
                    >
                        {pending
                            ? "Please wait..."
                            : isEmailCode
                              ? "Verify email"
                              : isCode
                                ? "Verify code"
                                : method === "phone"
                                  ? "Login with OTP"
                                  : "Login with email"}
                    </button>
                </form>
                {!isCode && method === "phone" && (
                    <p className="mt-3 text-center text-11 leading-4 text-muted-foreground">
                        By continuing, you agree to our{" "}
                        <Link
                            className="underline underline-offset-2"
                            href="/terms"
                        >
                            Terms
                        </Link>{" "}
                        and{" "}
                        <Link
                            className="underline underline-offset-2"
                            href="/privacy"
                        >
                            Privacy Policy
                        </Link>
                        .
                    </p>
                )}
                <p className="mt-6 text-center text-sm text-muted-foreground">
                    Don&apos;t have an account?{" "}
                    <Link
                        className="font-semibold text-primary underline-offset-4 hover:underline"
                        href={`/auth/signup?redirect_url=${encodeURIComponent(destination)}`}
                    >
                        Sign up
                    </Link>
                </p>
            </div>
        </div>
    );
}
