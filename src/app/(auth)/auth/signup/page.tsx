import { GeneralShell } from "@/components/globals/layouts";
import { SignUp } from "@clerk/nextjs";
import { Metadata } from "next";

export const metadata: Metadata = {
    title: "Create an Account",
    description: "Create an account with email",
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
                        Join Renivet
                    </p>
                    <h1 className="mt-2 font-playfair text-3xl text-[#20271d]">
                        Create your account
                    </h1>
                    <p className="mt-2 text-sm text-[#65705d]">
                        Sign up with your email to start shopping on Renivet.
                    </p>
                </div>
                <SignUp
                    routing="hash"
                    signInUrl="/auth/signin"
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
