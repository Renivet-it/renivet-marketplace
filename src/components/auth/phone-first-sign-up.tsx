"use client";

import {
    captureAuthEvent,
    getAuthEventProperties,
} from "@/components/auth/auth-analytics";
import { OTPCodeInput } from "@/components/auth/otp-code-input";
import { Google, RenivetFull } from "@/components/svgs";
import { POSTHOG_EVENTS } from "@/config/posthog";
import { getSafeRedirectUrl } from "@/lib/auth/redirect";
import { useSignUp } from "@clerk/nextjs";
import { isClerkAPIResponseError } from "@clerk/nextjs/errors";
import Image from "next/image";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { usePostHog } from "posthog-js/react";
import { FormEvent, useState } from "react";

type Method = "phone" | "email";
type Step = "details" | "verification";

function normalizeIndianPhone(value: string) {
    const digits = value.replace(/\D/g, "");
    if (digits.length === 10) return `+91${digits}`;
    if (digits.length === 11 && digits.startsWith("0"))
        return `+91${digits.slice(1)}`;
    if (digits.length === 12 && digits.startsWith("91")) return `+${digits}`;
    if (value.startsWith("+")) return value;
    throw new Error("Enter a valid phone number with its country code");
}

export function PhoneFirstSignUp() {
    const { isLoaded, setActive, signUp } = useSignUp();
    const posthog = usePostHog();
    const searchParams = useSearchParams();
    const destination = getSafeRedirectUrl(searchParams.get("redirect_url"));
    const router = useRouter();
    const [method, setMethod] = useState<Method>("phone");
    const [step, setStep] = useState<Step>("details");
    const [firstName, setFirstName] = useState("");
    const [lastName, setLastName] = useState("");
    const [phone, setPhone] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [code, setCode] = useState("");
    const [legalAccepted, setLegalAccepted] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [pending, setPending] = useState(false);

    const showError = (value: unknown) => {
        if (isClerkAPIResponseError(value))
            setError(value.errors.map((item) => item.message).join(", "));
        else
            setError(
                value instanceof Error ? value.message : "Unable to sign up"
            );
    };

    const complete = async (sessionId: string | null) => {
        if (!sessionId) throw new Error("A session could not be created");
        if (!setActive) throw new Error("Sign-up is still loading");
        await setActive({ session: sessionId });
        captureAuthEvent(
            posthog,
            POSTHOG_EVENTS.AUTH.SIGNED_IN,
            getAuthEventProperties("sign-up", method)
        );
        router.push(destination);
    };

    const continueWithGoogle = async () => {
        if (!isLoaded) return;
        if (!legalAccepted) {
            setError("Please accept the Terms of Service and Privacy Policy.");
            return;
        }
        captureAuthEvent(
            posthog,
            POSTHOG_EVENTS.AUTH.SIGNIN_INITIATED,
            getAuthEventProperties("sign-up", "google")
        );
        setPending(true);
        setError(null);
        try {
            await signUp.authenticateWithRedirect({
                strategy: "oauth_google",
                legalAccepted: true,
                redirectUrl: "/auth/sso-callback?flow=sign-up",
                redirectUrlComplete: destination,
            });
        } catch (value) {
            showError(value);
            setPending(false);
        }
    };

    const submit = async (event: FormEvent) => {
        event.preventDefault();
        if (!isLoaded) return;
        if (step === "details" && !legalAccepted) {
            setError("Please accept the Terms of Service and Privacy Policy.");
            return;
        }

        if (step === "details") {
            captureAuthEvent(
                posthog,
                POSTHOG_EVENTS.AUTH.SIGNIN_INITIATED,
                getAuthEventProperties("sign-up", method)
            );
        }

        setPending(true);
        setError(null);
        try {
            if (step === "verification") {
                const attempt =
                    method === "phone"
                        ? await signUp.attemptPhoneNumberVerification({ code })
                        : await signUp.attemptEmailAddressVerification({
                              code,
                          });
                if (attempt.status !== "complete")
                    throw new Error(
                        "The verification code could not be completed"
                    );
                await complete(attempt.createdSessionId);
                return;
            }

            if (method === "phone") {
                await signUp.create({
                    firstName: firstName.trim() || undefined,
                    legalAccepted: true,
                    lastName: lastName.trim() || undefined,
                    phoneNumber: normalizeIndianPhone(phone),
                });
                await signUp.preparePhoneNumberVerification({
                    strategy: "phone_code",
                });
            } else {
                await signUp.create({
                    emailAddress: email.trim(),
                    firstName: firstName.trim() || undefined,
                    legalAccepted: true,
                    lastName: lastName.trim() || undefined,
                    password,
                });
                await signUp.prepareEmailAddressVerification({
                    strategy: "email_code",
                });
            }
            setStep("verification");
        } catch (value) {
            showError(value);
        } finally {
            setPending(false);
        }
    };

    const switchMethod = () => {
        setMethod((current) => (current === "phone" ? "email" : "phone"));
        setStep("details");
        setError(null);
    };

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
                <div className="mb-7 flex items-center justify-between">
                    <RenivetFull height={36} width={120} />
                    <span className="rounded-full bg-primary/10 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.14em] text-primary">
                        New account
                    </span>
                </div>
                <h1 className="text-3xl font-semibold tracking-tight">
                    Create your account
                </h1>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">
                    {step === "verification"
                        ? `We sent a code to your ${method === "phone" ? "phone" : "email"}`
                        : "Join Renivet in just a few steps"}
                </p>
            </div>

            {step === "details" && (
                <div className="px-6 pt-5 sm:px-9">
                    <button
                        className="flex h-10 w-full items-center justify-center gap-3 rounded-xl border bg-background font-medium shadow-sm transition hover:border-primary/35 hover:bg-muted/50 disabled:cursor-not-allowed disabled:opacity-50"
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
                </div>
            )}

            <form className="space-y-5 px-6 pb-7 sm:px-9" onSubmit={submit}>
                {step === "verification" ? (
                    <label className="block space-y-2">
                        <span className="text-sm font-medium">
                            Verification code
                        </span>
                        <OTPCodeInput
                            value={code}
                            onChange={setCode}
                            disabled={pending}
                        />
                    </label>
                ) : (
                    <>
                        <div className="grid grid-cols-2 gap-3">
                            <label className="space-y-2">
                                <span className="text-sm font-medium">
                                    First name
                                </span>
                                <input
                                    className="h-10 w-full rounded-lg border px-3"
                                    onChange={(event) =>
                                        setFirstName(event.target.value)
                                    }
                                    value={firstName}
                                />
                            </label>
                            <label className="space-y-2">
                                <span className="text-sm font-medium">
                                    Last name
                                </span>
                                <input
                                    className="h-10 w-full rounded-lg border px-3"
                                    onChange={(event) =>
                                        setLastName(event.target.value)
                                    }
                                    value={lastName}
                                />
                            </label>
                        </div>

                        {method === "phone" ? (
                            <label className="block space-y-2">
                                <span className="flex justify-between text-sm font-medium">
                                    Phone number
                                    <button
                                        className="font-normal text-primary underline"
                                        onClick={switchMethod}
                                        type="button"
                                    >
                                        Sign up with email
                                    </button>
                                </span>
                                <div className="flex h-10 overflow-hidden rounded-lg border bg-background focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/20">
                                    <select
                                        aria-label="Country"
                                        className="w-20 border-r bg-transparent px-3 text-sm outline-none"
                                        defaultValue="IN"
                                    >
                                        <option value="IN">IN</option>
                                    </select>
                                    <span className="flex items-center px-3 text-sm font-medium">
                                        +91
                                    </span>
                                    <input
                                        autoComplete="tel-national"
                                        className="min-w-0 flex-1 bg-transparent pr-3 outline-none"
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
                                    We&apos;ll verify this number with an SMS
                                    code.
                                </p>
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
                                            Sign up with phone
                                        </button>
                                    </span>
                                    <input
                                        autoComplete="email"
                                        className="h-10 w-full rounded-lg border px-3"
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
                                    <span className="text-sm font-medium">
                                        Create a password
                                    </span>
                                    <input
                                        autoComplete="new-password"
                                        className="h-10 w-full rounded-lg border px-3"
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
                    </>
                )}

                {step === "details" && (
                    <label className="flex cursor-pointer items-start gap-3 rounded-lg bg-muted/45 px-3 py-2.5 text-xs leading-5 text-muted-foreground">
                        <input
                            checked={legalAccepted}
                            className="mt-0.5 size-4 shrink-0 accent-primary"
                            onChange={(event) =>
                                setLegalAccepted(event.target.checked)
                            }
                            required
                            type="checkbox"
                        />
                        <span>
                            I agree to the{" "}
                            <Link
                                className="font-medium text-primary underline underline-offset-2"
                                href="/terms"
                                target="_blank"
                            >
                                Terms of Service
                            </Link>{" "}
                            and{" "}
                            <Link
                                className="font-medium text-primary underline underline-offset-2"
                                href="/privacy"
                                target="_blank"
                            >
                                Privacy Policy
                            </Link>
                            .
                        </span>
                    </label>
                )}

                {error && (
                    <p className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive">
                        {error}
                    </p>
                )}
                <button
                    className="h-10 w-full rounded-lg bg-primary font-semibold text-primary-foreground transition hover:opacity-90 disabled:opacity-50"
                    disabled={pending}
                    type="submit"
                >
                    {pending
                        ? "Please wait…"
                        : step === "verification"
                          ? "Verify & create account"
                          : method === "phone"
                            ? "Continue with phone"
                            : "Create account"}
                </button>
            </form>

            <div className="bg-muted/30 px-6 py-5 text-center text-sm text-muted-foreground sm:px-9">
                Already have an account?{" "}
                <Link
                    className="font-medium text-primary underline"
                        href={`/auth/signin?redirect_url=${encodeURIComponent(destination)}`}
                >
                    Sign in
                </Link>
            </div>
        </div>
    );
}
