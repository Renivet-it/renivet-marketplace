import { SignInForm } from "@/components/globals/forms";
import { GeneralShell } from "@/components/globals/layouts";
import { SignIn, SignUp } from "@clerk/nextjs";
import {
    Card,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
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
            <SignIn routing="hash" signUpUrl="/auth/signup" />
            </div>
        </GeneralShell>
    );
}
