import { PhoneFirstSignUp } from "@/components/auth/phone-first-sign-up";
import { GeneralShell } from "@/components/globals/layouts";
import { Metadata } from "next";
import { Suspense } from "react";

export const metadata: Metadata = {
    title: "Create an Account",
    description: "Create an account to access all features",
};

export default function Page() {
    return (
        <GeneralShell
            classNames={{
                innerWrapper: "max-w-lg xl:max-w-2xl",
            }}
        >
            <div className="flex items-center justify-center">
                <Suspense>
                    <PhoneFirstSignUp />
                </Suspense>
            </div>
        </GeneralShell>
    );
}
