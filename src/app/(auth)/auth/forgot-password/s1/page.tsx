import { ForgotPasswordS1Form } from "@/components/globals/forms";
import { GeneralShell } from "@/components/globals/layouts";
import {
    Card,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Metadata } from "next";

export const metadata: Metadata = {
    title: "Forgot Password",
    description: "Forgot your password? Reset it here",
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
                    <CardTitle>Forgot Password</CardTitle>
                    <CardDescription>
                        Forgot your password? Enter your email address and
                        we&apos;ll send you a link to reset it.
                    </CardDescription>
                </CardHeader>

                <ForgotPasswordS1Form />
            </Card>
        </GeneralShell>
    );
}
