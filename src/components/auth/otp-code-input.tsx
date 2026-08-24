"use client";

import {
    InputOTP,
    InputOTPGroup,
    InputOTPSlot,
} from "@/components/ui/input-otp";

interface OTPCodeInputProps {
    value: string;
    onChange: (value: string) => void;
    disabled?: boolean;
}

export function OTPCodeInput({
    value,
    onChange,
    disabled = false,
}: OTPCodeInputProps) {
    return (
        <InputOTP
            autoFocus
            autoComplete="one-time-code"
            maxLength={6}
            value={value}
            onChange={(nextValue) =>
                onChange(nextValue.replace(/\D/g, "").slice(0, 6))
            }
            disabled={disabled}
            inputMode="numeric"
            pattern="[0-9]*"
        >
            <InputOTPGroup className="gap-2">
                {[0, 1, 2, 3, 4, 5].map((index) => (
                    <InputOTPSlot
                        key={index}
                        index={index}
                        className="size-10 rounded-xl border text-base"
                    />
                ))}
            </InputOTPGroup>
        </InputOTP>
    );
}
