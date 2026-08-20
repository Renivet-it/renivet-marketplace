import { PhoneFirstSignIn } from "@/components/auth/phone-first-sign-in";
import { GeneralShell } from "@/components/globals/layouts";
import { Metadata } from "next";

export const metadata: Metadata = {
    title: "Sign In",
    description: "Sign in to your account",
};

export default function Page() {
    return (
        <GeneralShell
            classNames={{
                innerWrapper: "max-w-lg xl:max-w-2xl",
            }}
        >
            <div className="flex items-center justify-center">
                <PhoneFirstSignIn />
            </div>
        </GeneralShell>
    );
}
