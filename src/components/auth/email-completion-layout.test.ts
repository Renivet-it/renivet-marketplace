import { describe, expect, test } from "bun:test";
import { emailVerificationCodeLayout } from "./email-completion-layout";

describe("email verification code layout", () => {
    test("stacks the verify button below the OTP fields on mobile", () => {
        expect(emailVerificationCodeLayout.row.split(" ")).toContain(
            "flex-col"
        );
        expect(emailVerificationCodeLayout.button.split(" ")).toContain(
            "w-full"
        );
    });

    test("lets all six OTP fields share the available mobile width", () => {
        expect(emailVerificationCodeLayout.otp.split(" ")).toContain("w-full");
        expect(emailVerificationCodeLayout.otpGroup.split(" ")).toContain(
            "grid-cols-6"
        );
        expect(emailVerificationCodeLayout.otpSlot.split(" ")).toContain(
            "w-full"
        );
    });
});
