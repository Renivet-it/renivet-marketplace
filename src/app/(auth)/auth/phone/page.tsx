import { PhoneAuthForm } from "@/components/globals/forms/phone-auth";
import { GeneralShell } from "@/components/globals/layouts";
import { Metadata } from "next";

export const metadata: Metadata = {
    title: "Continue with Phone",
    description: "Sign in or create an account with phone OTP",
};

export default function Page() {
    return (
        <GeneralShell
            classNames={{
                innerWrapper: "max-w-lg xl:max-w-xl",
            }}
        >
            <div className="flex items-center justify-center">
                <PhoneAuthForm />
            </div>
        </GeneralShell>
    );
}
