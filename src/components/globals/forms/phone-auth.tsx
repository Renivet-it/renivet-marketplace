"use client";

import { Icons } from "@/components/icons";
import { Button } from "@/components/ui/button-general";
import { Input } from "@/components/ui/input-general";
import {
    InputOTP,
    InputOTPGroup,
    InputOTPSeparator,
    InputOTPSlot,
} from "@/components/ui/input-otp";
import { DEFAULT_MESSAGES } from "@/config/const";
import { handleClientError } from "@/lib/utils";
import { useSignIn, useSignUp } from "@clerk/nextjs";
import { isClerkAPIResponseError } from "@clerk/nextjs/errors";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { FormEvent, useMemo, useState } from "react";
import { toast } from "sonner";

type PhoneAuthMode = "signin" | "signup";
const formatPhoneNumber = (phone: string) => {
    const trimmed = phone.trim();
    if (trimmed.startsWith("+")) return trimmed.replace(/\s/g, "");

    const digits = trimmed.replace(/\D/g, "");
    if (digits.length === 10) return `+91${digits}`;
    if (digits.startsWith("91") && digits.length === 12) return `+${digits}`;

    return `+${digits}`;
};

const getErrorMessage = (error: unknown) => {
    if (isClerkAPIResponseError(error)) {
        return error.errors.map((e) => e.message).join(", ");
    }

    if (error instanceof Error) return error.message;

    return DEFAULT_MESSAGES.ERRORS.GENERIC;
};

const getMissingRequirementMessage = (missingFields: string[]) => {
    const needsEmail = missingFields.includes("email_address");
    const needsPassword = missingFields.includes("password");

    if (needsEmail || needsPassword) {
        return "Phone OTP is enabled, but Clerk still requires email/password for new sign-ups. In Clerk Dashboard, make email optional/disabled for sign-up and disable Password to allow phone-only accounts.";
    }

    return `Clerk still requires: ${missingFields.join(", ")}. Make those optional in Clerk, or collect them before OTP.`;
};

export function PhoneAuthForm() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const initialMode = searchParams.get("mode") === "signup" ? "signup" : "signin";

    const [mode, setMode] = useState<PhoneAuthMode>(initialMode);
    const [phone, setPhone] = useState("");
    const [code, setCode] = useState("");
    const [isVerifying, setIsVerifying] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const {
        isLoaded: isSignInLoaded,
        signIn,
        setActive: setActiveSignIn,
    } = useSignIn();
    const {
        isLoaded: isSignUpLoaded,
        signUp,
        setActive: setActiveSignUp,
    } = useSignUp();

    const formattedPhone = useMemo(() => formatPhoneNumber(phone), [phone]);
    const canSubmitPhone = formattedPhone.length >= 11;
    const canSubmitCode = code.length === 6;

    const handleSendCode = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        if (!canSubmitPhone || isSubmitting) return;

        const toastId = toast.loading("Sending verification code...");
        setIsSubmitting(true);

        try {
            if (mode === "signin") {
                if (!isSignInLoaded || !signIn) {
                    throw new Error(DEFAULT_MESSAGES.ERRORS.GENERIC);
                }

                const signInAttempt = await signIn.create({
                    identifier: formattedPhone,
                });

                const phoneCodeFactor = signInAttempt.supportedFirstFactors?.find(
                    (factor) => factor.strategy === "phone_code"
                ) as unknown as { phoneNumberId?: string } | undefined;

                if (!phoneCodeFactor?.phoneNumberId) {
                    throw new Error(
                        "We could not send an OTP for this phone number. Try creating an account with it."
                    );
                }

                await signIn.prepareFirstFactor({
                    strategy: "phone_code",
                    phoneNumberId: phoneCodeFactor.phoneNumberId,
                });
            } else {
                if (!isSignUpLoaded || !signUp) {
                    throw new Error(DEFAULT_MESSAGES.ERRORS.GENERIC);
                }

                await signUp.create({
                    firstName: "Renivet",
                    lastName: "Customer",
                    phoneNumber: formattedPhone,
                });

                await signUp.preparePhoneNumberVerification();
            }

            setIsVerifying(true);
            toast.success("OTP sent to your phone", { id: toastId });
        } catch (error) {
            toast.error(getErrorMessage(error), { id: toastId });
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleVerifyCode = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        if (!canSubmitCode || isSubmitting) return;

        const toastId = toast.loading("Verifying OTP...");
        setIsSubmitting(true);

        try {
            if (mode === "signin") {
                if (!isSignInLoaded || !signIn) {
                    throw new Error(DEFAULT_MESSAGES.ERRORS.GENERIC);
                }

                const signInAttempt = await signIn.attemptFirstFactor({
                    strategy: "phone_code",
                    code,
                });

                if (signInAttempt.status !== "complete") {
                    throw new Error("Missing requirements or verification aborted");
                }

                await setActiveSignIn?.({
                    session: signInAttempt.createdSessionId,
                });
            } else {
                if (!isSignUpLoaded || !signUp) {
                    throw new Error(DEFAULT_MESSAGES.ERRORS.GENERIC);
                }

                const signUpAttempt =
                    await signUp.attemptPhoneNumberVerification({
                        code,
                    });
                let completedSignUp = signUpAttempt;

                const needsNameFields = signUpAttempt.missingFields?.some(
                    (field) =>
                        ["first_name", "firstName", "last_name", "lastName"].includes(
                            field
                        )
                );

                if (
                    signUpAttempt.status === "missing_requirements" &&
                    needsNameFields
                ) {
                    completedSignUp = await signUp.update({
                        firstName: signUpAttempt.firstName ?? "Renivet",
                        lastName: signUpAttempt.lastName ?? "Customer",
                    });
                }

                if (completedSignUp.status !== "complete") {
                    const missingFields = completedSignUp.missingFields ?? [];

                    throw new Error(
                        missingFields.length > 0
                            ? getMissingRequirementMessage(missingFields)
                            : "Missing requirements or verification aborted"
                    );
                }

                await setActiveSignUp?.({
                    session: completedSignUp.createdSessionId,
                });
            }

            toast.success("Welcome to Renivet", { id: toastId });
            router.push("/");
        } catch (error) {
            return isClerkAPIResponseError(error)
                ? toast.error(error.errors.map((e) => e.message).join(", "), {
                      id: toastId,
                  })
                : handleClientError(error, toastId);
        } finally {
            setIsSubmitting(false);
        }
    };

    const switchMode = (nextMode: PhoneAuthMode) => {
        setMode(nextMode);
        setIsVerifying(false);
        setCode("");
    };

    return (
        <div className="w-full max-w-md rounded-3xl border border-[#ded6c8] bg-[#fffdf7] p-5 shadow-[0_18px_50px_rgba(47,58,40,0.12)] sm:p-7">
            <div className="mb-6 text-center">
                <div className="mx-auto mb-4 flex size-12 items-center justify-center rounded-full bg-[#edf2e5] text-[#65734f]">
                    <Icons.Phone className="size-5" />
                </div>
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#68745d]">
                    Phone OTP
                </p>
                <h1 className="mt-2 font-playfair text-3xl text-[#20271d]">
                    Continue with phone
                </h1>
                <p className="mt-2 text-sm text-[#65705d]">
                    We will send a 6-digit OTP by SMS. No email is needed for
                    this step.
                </p>
            </div>

            <div className="mb-5 grid grid-cols-2 rounded-full border border-[#d8d0bf] bg-[#f8f4e8] p-1">
                <button
                    type="button"
                    onClick={() => switchMode("signin")}
                    className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
                        mode === "signin"
                            ? "bg-white text-[#2f3a28] shadow-sm"
                            : "text-[#6a735f]"
                    }`}
                >
                    Sign in
                </button>
                <button
                    type="button"
                    onClick={() => switchMode("signup")}
                    className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
                        mode === "signup"
                            ? "bg-white text-[#2f3a28] shadow-sm"
                            : "text-[#6a735f]"
                    }`}
                >
                    Sign up
                </button>
            </div>

            {!isVerifying ? (
                <form className="space-y-4" onSubmit={handleSendCode}>
                    <div className="space-y-2">
                        <label
                            htmlFor="phone"
                            className="text-sm font-semibold text-[#2f3a28]"
                        >
                            Phone number
                        </label>
                        <Input
                            id="phone"
                            type="tel"
                            inputMode="tel"
                            autoComplete="tel"
                            placeholder="+91 98765 43210"
                            value={phone}
                            onChange={(event) => setPhone(event.target.value)}
                            disabled={isSubmitting}
                            className="h-12 rounded-xl border-[#d8d0bf] bg-white text-base"
                        />
                        <p className="text-xs text-[#7a8272]">
                            India numbers can be typed as 10 digits. We format
                            them as +91 automatically.
                        </p>
                    </div>

                    <Button
                        type="submit"
                        className="h-12 w-full rounded-xl bg-[#71815a] text-white hover:bg-[#65734f]"
                        disabled={!canSubmitPhone || isSubmitting}
                    >
                        Send OTP
                    </Button>
                </form>
            ) : (
                <form className="space-y-5" onSubmit={handleVerifyCode}>
                    <div className="space-y-3 text-center">
                        <p className="text-sm text-[#65705d]">
                            Enter the OTP sent to{" "}
                            <span className="font-semibold text-[#2f3a28]">
                                {formattedPhone}
                            </span>
                        </p>
                        <InputOTP
                            maxLength={6}
                            value={code}
                            onChange={setCode}
                            disabled={isSubmitting}
                            containerClassName="justify-center"
                        >
                            <InputOTPGroup>
                                <InputOTPSlot index={0} />
                                <InputOTPSlot index={1} />
                                <InputOTPSlot index={2} />
                            </InputOTPGroup>
                            <InputOTPSeparator />
                            <InputOTPGroup>
                                <InputOTPSlot index={3} />
                                <InputOTPSlot index={4} />
                                <InputOTPSlot index={5} />
                            </InputOTPGroup>
                        </InputOTP>
                    </div>

                    <Button
                        type="submit"
                        className="h-12 w-full rounded-xl bg-[#71815a] text-white hover:bg-[#65734f]"
                        disabled={!canSubmitCode || isSubmitting}
                    >
                        Verify and continue
                    </Button>

                    <button
                        type="button"
                        onClick={() => {
                            setIsVerifying(false);
                            setCode("");
                        }}
                        className="w-full text-sm font-semibold text-[#65734f] hover:underline"
                    >
                        Change phone number
                    </button>
                </form>
            )}

            <div className="mt-6 border-t border-[#e3ddcf] pt-4 text-center text-sm text-[#65705d]">
                Prefer email or Google?{" "}
                <Link
                    href={mode === "signup" ? "/auth/signup" : "/auth/signin"}
                    className="font-semibold text-[#2f3a28] underline underline-offset-2"
                >
                    Use regular login
                </Link>
            </div>
        </div>
    );
}
