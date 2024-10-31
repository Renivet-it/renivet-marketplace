import { OTPVerificationForm } from "@/components/globals/forms";
import { GeneralShell } from "@/components/globals/layouts";
import {
    Card,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Metadata } from "next";

export const metadata: Metadata = {
    title: "Verify Email",
    description: "Verify your email address",
};

export default function Page() {
    return (
        <GeneralShell
            classNames={{
                innerWrapper: "max-w-lg xl:max-w-2xl",
            }}
        >
            <Card className="rounded-none">
                <CardHeader>
                    <CardTitle>Verification</CardTitle>
                    <CardDescription>
                        Enter the OTP sent to your email address
                    </CardDescription>
                </CardHeader>

                <OTPVerificationForm />
            </Card>
        </GeneralShell>
    );
}
