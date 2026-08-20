"use client";

import { isClerkAPIResponseError } from "@clerk/nextjs/errors";
import { useSignUp } from "@clerk/nextjs";
import { Renivet } from "@/components/svgs";
import Link from "next/link";
import { useRouter } from "next/navigation";
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
    const router = useRouter();
    const [method, setMethod] = useState<Method>("phone");
    const [step, setStep] = useState<Step>("details");
    const [firstName, setFirstName] = useState("");
    const [lastName, setLastName] = useState("");
    const [phone, setPhone] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [code, setCode] = useState("");
    const [error, setError] = useState<string | null>(null);
    const [pending, setPending] = useState(false);

    const showError = (value: unknown) => {
        if (isClerkAPIResponseError(value))
            setError(value.errors.map((item) => item.message).join(", "));
        else setError(value instanceof Error ? value.message : "Unable to sign up");
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
            await signUp.authenticateWithRedirect({
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
            if (step === "verification") {
                const attempt =
                    method === "phone"
                        ? await signUp.attemptPhoneNumberVerification({ code })
                        : await signUp.attemptEmailAddressVerification({ code });
                if (attempt.status !== "complete")
                    throw new Error("The verification code could not be completed");
                await complete(attempt.createdSessionId);
                return;
            }

            if (method === "phone") {
                await signUp.create({
                    firstName: firstName.trim() || undefined,
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
        <div className="w-full max-w-md overflow-hidden rounded-2xl border bg-background shadow-xl shadow-black/5">
            <div className="border-b bg-gradient-to-b from-primary/5 to-transparent px-8 pb-7 pt-8 text-center">
                <Renivet className="mx-auto mb-4 size-11" />
                <h1 className="text-2xl font-semibold tracking-tight">Create your account</h1>
                <p className="mt-2 text-sm text-muted-foreground">
                    {step === "verification"
                        ? `We sent a code to your ${method === "phone" ? "phone" : "email"}`
                        : "Join Renivet in just a few steps"}
                </p>
            </div>

            {step === "details" && (
                <div className="px-8 pt-7">
                    <button
                        className="flex h-11 w-full items-center justify-center gap-3 rounded-lg border bg-background font-medium shadow-sm transition hover:bg-muted disabled:opacity-50"
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
                </div>
            )}

            <form className="space-y-5 px-8 pb-7" onSubmit={submit}>
                {step === "verification" ? (
                    <label className="block space-y-2">
                        <span className="text-sm font-medium">Verification code</span>
                        <input
                            autoComplete="one-time-code"
                            className="h-12 w-full rounded-lg border bg-background px-3 text-center text-lg tracking-[0.35em] outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
                            inputMode="numeric"
                            onChange={(event) => setCode(event.target.value)}
                            placeholder="••••••"
                            required
                            value={code}
                        />
                    </label>
                ) : (
                    <>
                        <div className="grid grid-cols-2 gap-3">
                            <label className="space-y-2">
                                <span className="text-sm font-medium">First name</span>
                                <input className="h-11 w-full rounded-lg border px-3" onChange={(event) => setFirstName(event.target.value)} value={firstName} />
                            </label>
                            <label className="space-y-2">
                                <span className="text-sm font-medium">Last name</span>
                                <input className="h-11 w-full rounded-lg border px-3" onChange={(event) => setLastName(event.target.value)} value={lastName} />
                            </label>
                        </div>

                        {method === "phone" ? (
                            <label className="block space-y-2">
                                <span className="flex justify-between text-sm font-medium">
                                    Phone number
                                    <button className="font-normal text-primary underline" onClick={switchMethod} type="button">Use email instead</button>
                                </span>
                                <div className="flex h-12 overflow-hidden rounded-lg border bg-background focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/20">
                                    <select aria-label="Country" className="w-20 border-r bg-transparent px-3 text-sm outline-none" defaultValue="IN">
                                        <option value="IN">IN</option>
                                    </select>
                                    <span className="flex items-center px-3 text-sm font-medium">+91</span>
                                    <input autoComplete="tel-national" className="min-w-0 flex-1 bg-transparent pr-3 outline-none" inputMode="tel" onChange={(event) => setPhone(event.target.value)} placeholder="Enter your phone number" required value={phone} />
                                </div>
                                <p className="text-xs text-muted-foreground">We&apos;ll verify this number with an SMS code.</p>
                            </label>
                        ) : (
                            <>
                                <label className="block space-y-2">
                                    <span className="flex justify-between text-sm font-medium">
                                        Email address
                                        <button className="font-normal text-primary underline" onClick={switchMethod} type="button">Use phone</button>
                                    </span>
                                    <input autoComplete="email" className="h-12 w-full rounded-lg border px-3" onChange={(event) => setEmail(event.target.value)} placeholder="you@example.com" required type="email" value={email} />
                                </label>
                                <label className="block space-y-2">
                                    <span className="text-sm font-medium">Create a password</span>
                                    <input autoComplete="new-password" className="h-12 w-full rounded-lg border px-3" onChange={(event) => setPassword(event.target.value)} required type="password" value={password} />
                                </label>
                            </>
                        )}
                    </>
                )}

                {error && <p className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive">{error}</p>}
                <button className="h-12 w-full rounded-lg bg-primary font-semibold text-primary-foreground transition hover:opacity-90 disabled:opacity-50" disabled={pending} type="submit">
                    {pending ? "Please wait…" : step === "verification" ? "Verify & create account" : method === "phone" ? "Continue with phone" : "Create account"}
                </button>
            </form>

            <div className="border-t bg-muted/30 px-8 py-5 text-center text-sm text-muted-foreground">
                Already have an account? <Link className="font-medium text-primary underline" href="/auth/signin">Sign in</Link>
            </div>
        </div>
    );
}
