"use client";

import { isClerkAPIResponseError } from "@clerk/nextjs/errors";
import { useSignIn, useUser } from "@clerk/nextjs";
import { EmailAddressResource } from "@clerk/types";
import { Check, Mail, Sparkles, X } from "lucide-react";
import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

type Step = "email" | "code" | "merge-choice" | "merge-code" | "complete";

export function EmailCompletionCard() {
    const { isLoaded, isSignedIn, user } = useUser();
    const { signIn, setActive } = useSignIn();
    const router = useRouter();
    const [dismissed, setDismissed] = useState(false);
    const [step, setStep] = useState<Step>("email");
    const [email, setEmail] = useState("");
    const [code, setCode] = useState("");
    const [emailAddress, setEmailAddress] =
        useState<EmailAddressResource | null>(null);
    const [mergeIntentId, setMergeIntentId] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [pending, setPending] = useState(false);

    const hasVerifiedEmail = user?.emailAddresses.some(
        (address) => address.verification.status === "verified"
    );

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

    const sendCode = async (event: FormEvent) => {
        event.preventDefault();
        setPending(true);
        setError(null);
        try {
            const mergeCheck = await fetch("/api/account-merge", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ action: "start", email: email.trim() }),
            });
            const mergeData = await mergeCheck.json();
            if (!mergeCheck.ok) throw new Error(mergeData.error ?? "Unable to check this email");
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
            if (!addedEmail) throw new Error("Email address could not be added");
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
        setPending(true);
        setError(null);
        try {
            if (step === "merge-code") {
                const response = await fetch("/api/account-merge", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ action: "confirm", intentId: mergeIntentId, code }),
                });
                const data = await response.json();
                if (!response.ok) throw new Error(data.error ?? "Unable to combine accounts");
                const attempt = await signIn.create({ strategy: "ticket", ticket: data.ticket });
                if (attempt.status !== "complete" || !attempt.createdSessionId) throw new Error("Account was combined, but sign-in could not be completed");
                await setActive({ session: attempt.createdSessionId });
                router.push("/");
                return;
            }
            const result = await emailAddress.attemptVerification({ code });
            if (result.verification.status !== "verified")
                throw new Error("That code could not be verified");
            await user.update({ primaryEmailAddressId: emailAddress.id });
            await user.reload();
            setStep("complete");
        } catch (value) {
            showError(value);
        } finally {
            setPending(false);
        }
    };

    return (
        <aside className="fixed bottom-4 right-4 z-50 w-[calc(100%-2rem)] max-w-sm overflow-hidden rounded-2xl border border-primary/15 bg-background shadow-2xl shadow-primary/15 sm:bottom-6 sm:right-6">
            <div className="absolute -right-8 -top-8 size-28 rounded-full bg-primary/10 blur-2xl" />
            <div className="relative p-5">
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
                        <h2 className="mt-1 text-base font-semibold">
                            {step === "complete"
                                ? "Email verified"
                                : "Add an email address"}
                        </h2>
                        <p className="mt-1 text-sm leading-5 text-muted-foreground">
                            {step === "complete"
                                ? "Your account is ready for easier sign-in and order updates."
                                : "Add a verified email for order updates and another secure way to sign in."}
                        </p>
                    </div>
                </div>

                {step === "email" && (
                    <form className="mt-4 flex gap-2" onSubmit={sendCode}>
                        <input
                            autoComplete="email"
                            className="h-10 min-w-0 flex-1 rounded-xl border bg-background px-3 text-sm outline-none transition placeholder:text-muted-foreground focus:border-primary focus:ring-4 focus:ring-primary/10"
                            onChange={(event) => setEmail(event.target.value)}
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
                            {pending ? "Sending" : "Add email"}
                        </button>
                    </form>
                )}

                {step === "code" && (
                    <form className="mt-4 flex gap-2" onSubmit={verifyCode}>
                        <input
                            autoComplete="one-time-code"
                            className="h-10 min-w-0 flex-1 rounded-xl border bg-background px-3 text-center text-sm tracking-[0.2em] outline-none transition placeholder:tracking-normal focus:border-primary focus:ring-4 focus:ring-primary/10"
                            inputMode="numeric"
                            maxLength={6}
                            onChange={(event) => setCode(event.target.value)}
                            placeholder="••••••"
                            required
                            value={code}
                        />
                        <button
                            className="h-10 shrink-0 rounded-xl bg-primary px-3 text-sm font-semibold text-primary-foreground transition hover:brightness-95 disabled:opacity-50"
                            disabled={pending}
                            type="submit"
                        >
                            {pending ? "Checking" : "Verify"}
                        </button>
                    </form>
                )}

                {step === "merge-choice" && (
                    <div className="mt-4 rounded-xl border border-primary/15 bg-primary/5 p-3">
                        <p className="text-sm font-semibold">This email belongs to an existing account.</p>
                        <p className="mt-1 text-xs leading-4 text-muted-foreground">Would you like to verify and combine your orders, addresses, and phone login?</p>
                        <div className="mt-3 flex gap-2">
                            <button className="h-9 flex-1 rounded-lg bg-primary text-xs font-semibold text-primary-foreground" onClick={() => setStep("merge-code")} type="button">Yes, combine</button>
                            <button className="h-9 flex-1 rounded-lg border text-xs font-semibold" onClick={() => { setMergeIntentId(null); setStep("email"); }} type="button">Not now</button>
                        </div>
                    </div>
                )}

                {step === "merge-code" && (
                    <form className="mt-4 flex gap-2" onSubmit={verifyCode}>
                        <input autoComplete="one-time-code" className="h-10 min-w-0 flex-1 rounded-xl border bg-background px-3 text-center text-sm tracking-[0.2em] outline-none" inputMode="numeric" maxLength={6} onChange={(event) => setCode(event.target.value)} placeholder="••••••" required value={code} />
                        <button className="h-10 shrink-0 rounded-xl bg-primary px-3 text-sm font-semibold text-primary-foreground disabled:opacity-50" disabled={pending} type="submit">{pending ? "Checking" : "Verify"}</button>
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
