import { GeneralShell } from "@/components/globals/layouts";
import { SignIn } from "@clerk/nextjs";
import { Metadata } from "next";

export const metadata: Metadata = {
    title: "Sign In",
    description: "Sign in to your account with email",
};

export default function Page() {
    return (
        <GeneralShell
            classNames={{
                innerWrapper: "max-w-lg xl:max-w-xl",
            }}
        >
            <div className="flex flex-col items-center justify-center gap-5">
                <div className="max-w-md text-center">
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#68745d]">
                        Welcome back
                    </p>
                    <h1 className="mt-2 font-playfair text-3xl text-[#20271d]">
                        Sign in to Renivet
                    </h1>
                    <p className="mt-2 text-sm text-[#65705d]">
                        Use your email to continue to your Renivet account.
                    </p>
                </div>
                <SignIn
                    routing="hash"
                    signUpUrl="/auth/signup"
                    appearance={{
                        variables: {
                            colorPrimary: "#2f3a28",
                            borderRadius: "12px",
                        },
                        elements: {
                            cardBox: "shadow-[0_18px_50px_rgba(47,58,40,0.12)]",
                            card: "border border-[#ded6c8]",
                            formButtonPrimary:
                                "bg-[#2f3a28] hover:bg-[#24301f]",
                        },
                    }}
                />
            </div>
        </GeneralShell>
    );
}
