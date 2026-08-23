"use client";

import { useSignIn, useUser } from "@clerk/nextjs";
import { isClerkAPIResponseError } from "@clerk/nextjs/errors";
import { EmailAddressResource } from "@clerk/types";
import { Check, Mail, Sparkles, X } from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";

type Step = "email" | "code" | "merge-choice" | "merge-code" | "complete";

export function EmailCompletionCard() {
    const { isLoaded, isSignedIn, user } = useUser();
    const { signIn, setActive } = useSignIn();
    const router = useRouter();
    const [dismissed, setDismissed] = useState(false);
    const [step, setStep] = useState<Step>("email");
    const [email, setEmail] = useState("");
    const [firstName, setFirstName] = useState(
        user?.firstName === "Renivet" ? "" : (user?.firstName ?? "")
    );
    const [lastName, setLastName] = useState(
        user?.lastName?.startsWith("Customer ") ? "" : (user?.lastName ?? "")
    );
    const [code, setCode] = useState("");
    const [emailAddress, setEmailAddress] =
        useState<EmailAddressResource | null>(null);
    const [mergeIntentId, setMergeIntentId] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [pending, setPending] = useState(false);

    const hasVerifiedEmail = user?.emailAddresses.some(
        (address) => address.verification.status === "verified"
    );
    const profileCompletionRequired =
        user?.unsafeMetadata?.profileCompletionRequired === true;
    const needsFirstName =
        profileCompletionRequired || !user?.firstName?.trim();
    const needsLastName = profileCompletionRequired || !user?.lastName?.trim();

    if (!isLoaded || !isSignedIn || !user || hasVerifiedEmail || dismissed)
        return null;

    const showError = (value: unknown) =>
        setError(
            isClerkAPIResponseError(value)
                ? value.errors.map((item) => item.message).join(", ")
                : value instanceof Error
                  ? value.message
                  : "We could not add this email address"
        );

    const updateCode = (value: string) => {
        setCode(value.replace(/\D/g, "").slice(0, 6));
        setError(null);
    };

    const sendCode = async (event: FormEvent) => {
        event.preventDefault();
        setPending(true);
        setError(null);
        try {
            if (needsFirstName || needsLastName) {
                await user.update({
                    firstName: firstName.trim() || user.firstName || "Renivet",
                    lastName: lastName.trim() || user.lastName || "Customer",
                    unsafeMetadata: {
                        ...user.unsafeMetadata,
                        profileCompletionRequired: false,
                    },
                });
            }
            const controller = new AbortController();
            const timeout = window.setTimeout(() => controller.abort(), 10_000);
            const mergeCheck = await fetch("/api/account-merge", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ action: "start", email: email.trim() }),
                signal: controller.signal,
            }).finally(() => window.clearTimeout(timeout));
            const mergeData = await mergeCheck.json();
            if (!mergeCheck.ok)
                throw new Error(
                    mergeData.error ?? "Unable to check this email"
                );
            if (mergeData.exists) {
                setMergeIntentId(mergeData.intentId);
                setStep("merge-choice");
                return;
            }
            const result = await user.createEmailAddress({
                email: email.trim(),
            });
            await user.reload();
            const addedEmail = user.emailAddresses.find(
                (address) => address.id === result.id
            );
            if (!addedEmail)
                throw new Error("Email address could not be added");
            await addedEmail.prepareVerification({ strategy: "email_code" });
            setEmailAddress(addedEmail);
            setStep("code");
        } catch (value) {
            showError(value);
        } finally {
            setPending(false);
        }
    };

    const verifyCode = async (event: FormEvent) => {
        event.preventDefault();
        if (!emailAddress && !mergeIntentId) return;
        const normalizedCode = code.replace(/\D/g, "");
        if (normalizedCode.length !== 6) {
            setError("Enter the complete six-digit verification code.");
            return;
        }
        setPending(true);
        setError(null);
        try {
            if (step === "merge-code") {
                if (!signIn || !setActive)
                    throw new Error(
                        "Sign-in is still loading. Please try again."
                    );
                const response = await fetch("/api/account-merge", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        action: "confirm",
                        intentId: mergeIntentId,
                        code: normalizedCode,
                    }),
                });
                const data = await response.json();
                if (!response.ok) {
                    if (data.error?.toLowerCase().includes("expired")) {
                        setCode("");
                        setStep("merge-choice");
                    } else if (
                        response.status === 404 ||
                        response.status === 409 ||
                        response.status >= 500
                    ) {
                        setCode("");
                        setMergeIntentId(null);
                        setStep("email");
                    }
                    throw new Error(data.error ?? "Unable to combine accounts");
                }
                const attempt = await signIn.create({
                    strategy: "ticket",
                    ticket: data.ticket,
                });
                if (attempt.status !== "complete" || !attempt.createdSessionId)
                    throw new Error(
                        "Account was combined, but sign-in could not be completed"
                    );
                await setActive({ session: attempt.createdSessionId });
                router.push("/");
                return;
            }
            const addressToVerify = emailAddress;
            if (!addressToVerify)
                throw new Error("Email verification is no longer available.");
            const result = await addressToVerify.attemptVerification({
                code: normalizedCode,
            });
            if (result.verification.status !== "verified")
                throw new Error("That code could not be verified");
            await user.update({ primaryEmailAddressId: addressToVerify.id });
            await user.reload();
            const sync = await fetch("/api/account/sync", { method: "POST" });
            if (!sync.ok)
                throw new Error(
                    "Your email was verified, but profile sync failed. Please refresh and try again."
                );
            setStep("complete");
        } catch (value) {
            showError(value);
        } finally {
            setPending(false);
        }
    };

    const consentToMerge = async () => {
        if (!mergeIntentId) return;
        setPending(true);
        setError(null);
        try {
            const response = await fetch("/api/account-merge", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    action: "consent",
                    intentId: mergeIntentId,
                }),
            });
            const data = await response.json();
            if (!response.ok)
                throw new Error(
                    data.error ?? "Unable to send verification code"
                );
            setCode("");
            setStep("merge-code");
        } catch (value) {
            showError(value);
        } finally {
            setPending(false);
        }
    };

    const declineMerge = async () => {
        const intentId = mergeIntentId;
        setMergeIntentId(null);
        setCode("");
        setStep("email");
        if (!intentId) return;
        await fetch("/api/account-merge", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ action: "cancel", intentId }),
        }).catch(() => undefined);
    };

    return (
        <aside className="fixed left-1/2 top-1/2 z-50 w-[calc(100%-2rem)] max-w-sm -translate-x-1/2 -translate-y-1/2 overflow-hidden rounded-3xl border border-primary/15 bg-background shadow-2xl shadow-primary/15 lg:max-w-md">
            <Image
                alt=""
                aria-hidden="true"
                className="pointer-events-none absolute -right-6 -top-8 w-40 opacity-50"
                height={160}
                src="/images/auth/botanical-branch.png"
                width={160}
            />
            <div className="absolute -left-8 -top-8 size-32 rounded-full bg-primary/10 blur-2xl" />
            <div className="relative bg-gradient-to-br from-primary/[0.08] via-transparent to-transparent p-5 sm:p-6">
                <button
                    aria-label="Dismiss email reminder"
                    className="absolute right-3 top-3 rounded-full p-1 text-muted-foreground transition hover:bg-muted hover:text-foreground"
                    onClick={() => setDismissed(true)}
                    type="button"
                >
                    <X className="size-4" />
                </button>
                <div className="flex items-start gap-3 pr-6">
                    <div className="grid size-10 shrink-0 place-items-center rounded-xl bg-primary text-primary-foreground shadow-lg shadow-primary/20">
                        {step === "complete" ? (
                            <Check className="size-5" />
                        ) : (
                            <Mail className="size-5" />
                        )}
                    </div>
                    <div>
                        <p className="flex items-center gap-1 text-xs font-semibold uppercase tracking-[0.12em] text-primary">
                            <Sparkles className="size-3" /> Your Renivet account
                        </p>
                        <h2 className="mt-1 text-lg font-semibold">
                            {step === "complete"
                                ? "Email verified"
                                : needsFirstName || needsLastName
                                  ? "Complete your account"
                                  : "Add an email address"}
                        </h2>
                        <p className="mt-1 text-sm leading-5 text-muted-foreground">
                            {step === "complete"
                                ? "Your account is ready for easier sign-in and order updates."
                                : "Add your details and a verified email for order updates and easier sign-in."}
                        </p>
                    </div>
                </div>

                {step === "email" && (
                    <form className="mt-5 space-y-3" onSubmit={sendCode}>
                        {(needsFirstName || needsLastName) && (
                            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                                {needsFirstName && (
                                    <input
                                        autoComplete="given-name"
                                        className="h-10 rounded-xl border bg-background px-3 text-sm outline-none transition focus:border-primary focus:ring-4 focus:ring-primary/10"
                                        onChange={(event) =>
                                            setFirstName(event.target.value)
                                        }
                                        placeholder="First name"
                                        value={firstName}
                                    />
                                )}
                                {needsLastName && (
                                    <input
                                        autoComplete="family-name"
                                        className="h-10 rounded-xl border bg-background px-3 text-sm outline-none transition focus:border-primary focus:ring-4 focus:ring-primary/10"
                                        onChange={(event) =>
                                            setLastName(event.target.value)
                                        }
                                        placeholder="Last name"
                                        value={lastName}
                                    />
                                )}
                            </div>
                        )}
                        <div className="flex gap-2">
                            <input
                                autoComplete="email"
                                className="h-10 min-w-0 flex-1 rounded-xl border bg-background px-3 text-sm outline-none transition placeholder:text-muted-foreground focus:border-primary focus:ring-4 focus:ring-primary/10"
                                onChange={(event) =>
                                    setEmail(event.target.value)
                                }
                                placeholder="you@example.com"
                                required
                                type="email"
                                value={email}
                            />
                            <button
                                className="h-10 shrink-0 rounded-xl bg-primary px-3 text-sm font-semibold text-primary-foreground transition hover:brightness-95 disabled:opacity-50"
                                disabled={pending}
                                type="submit"
                            >
                                {pending ? "Sending" : "Continue"}
                            </button>
                        </div>
                    </form>
                )}

                {step === "code" && (
                    <form className="mt-4" onSubmit={verifyCode}>
                        <div className="flex gap-2">
                            <input
                                autoComplete="one-time-code"
                                className="h-10 min-w-0 flex-1 rounded-xl border bg-background px-3 text-center text-sm tracking-[0.2em] outline-none transition placeholder:tracking-normal focus:border-primary focus:ring-4 focus:ring-primary/10"
                                inputMode="numeric"
                                maxLength={6}
                                onChange={(event) =>
                                    updateCode(event.target.value)
                                }
                                pattern="[0-9]{6}"
                                placeholder="••••••"
                                required
                                value={code}
                            />
                            <button
                                className="h-10 shrink-0 rounded-xl bg-primary px-3 text-sm font-semibold text-primary-foreground transition hover:brightness-95 disabled:opacity-50"
                                disabled={pending || code.length !== 6}
                                type="submit"
                            >
                                {pending ? "Checking" : "Verify"}
                            </button>
                        </div>
                        {code.length > 0 && code.length < 6 && (
                            <p className="mt-2 text-xs text-amber-700">
                                Enter all six digits from the email.
                            </p>
                        )}
                    </form>
                )}

                {step === "merge-choice" && (
                    <div className="mt-4 rounded-xl border border-primary/15 bg-primary/5 p-3">
                        <p className="text-sm font-semibold">
                            This email belongs to an existing account.
                        </p>
                        <p className="mt-1 text-xs leading-4 text-muted-foreground">
                            Would you like to verify and combine your orders,
                            addresses, and phone login?
                        </p>
                        <div className="mt-3 flex gap-2">
                            <button
                                className="h-9 flex-1 rounded-lg bg-primary text-xs font-semibold text-primary-foreground disabled:opacity-50"
                                disabled={pending}
                                onClick={consentToMerge}
                                type="button"
                            >
                                {pending ? "Sending code" : "Yes, combine"}
                            </button>
                            <button
                                className="h-9 flex-1 rounded-lg border text-xs font-semibold disabled:opacity-50"
                                disabled={pending}
                                onClick={declineMerge}
                                type="button"
                            >
                                Not now
                            </button>
                        </div>
                    </div>
                )}

                {step === "merge-code" && (
                    <form className="mt-4" onSubmit={verifyCode}>
                        <p className="mb-2 text-xs leading-4 text-muted-foreground">
                            Enter the six-digit code sent to the existing
                            account email.
                        </p>
                        <div className="flex gap-2">
                            <input
                                autoComplete="one-time-code"
                                className="h-10 min-w-0 flex-1 rounded-xl border bg-background px-3 text-center text-sm tracking-[0.2em] outline-none"
                                inputMode="numeric"
                                maxLength={6}
                                onChange={(event) =>
                                    updateCode(event.target.value)
                                }
                                pattern="[0-9]{6}"
                                placeholder="••••••"
                                required
                                value={code}
                            />
                            <button
                                className="h-10 shrink-0 rounded-xl bg-primary px-3 text-sm font-semibold text-primary-foreground disabled:opacity-50"
                                disabled={pending || code.length !== 6}
                                type="submit"
                            >
                                {pending ? "Checking" : "Verify"}
                            </button>
                        </div>
                        {code.length > 0 && code.length < 6 && (
                            <p className="mt-2 text-xs text-amber-700">
                                Enter all six digits from the email.
                            </p>
                        )}
                    </form>
                )}

                {error && (
                    <p className="mt-3 rounded-xl bg-destructive/10 px-3 py-2 text-xs leading-4 text-destructive">
                        {error}
                    </p>
                )}
            </div>
        </aside>
    );
}
