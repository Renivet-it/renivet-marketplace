import { SignUpForm } from "@/components/globals/forms";
import { GeneralShell } from "@/components/globals/layouts";
import {
    Card,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Metadata } from "next";

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
            <Card className="rounded-none">
                <CardHeader>
                    <CardTitle>Create an Account</CardTitle>
                    <CardDescription>
                        Create an account to access all features
                    </CardDescription>
                </CardHeader>

                <SignUpForm />
            </Card>
        </GeneralShell>
    );
}
