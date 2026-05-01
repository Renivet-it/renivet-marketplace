import { GeneralShell } from "@/components/globals/layouts";
import { Icons } from "@/components/icons";
import { SignUp } from "@clerk/nextjs";
import { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
    title: "Create an Account",
    description: "Create an account with email or phone",
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
                        Sign up with email or phone number once phone OTP is
                        enabled in Clerk.
                    </p>
                </div>
                <Link
                    href="/auth/phone?mode=signup"
                    className="flex h-12 w-full max-w-[400px] items-center justify-center gap-3 rounded-xl border border-[#d8d0bf] bg-[#fffdf7] px-5 text-sm font-bold text-[#2f3a28] shadow-sm transition hover:border-[#b7aa91] hover:bg-[#f5f0e5]"
                >
                    <Icons.Phone className="size-4" />
                    Continue with phone number
                </Link>
                <div className="flex w-full max-w-[400px] items-center gap-3 text-[10px] font-semibold uppercase tracking-[0.16em] text-[#9a9182]">
                    <span className="h-px flex-1 bg-[#ded6c8]" />
                    or
                    <span className="h-px flex-1 bg-[#ded6c8]" />
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
