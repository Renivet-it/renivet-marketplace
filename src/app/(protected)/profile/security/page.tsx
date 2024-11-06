import { SecurityPage } from "@/components/profile";
import { Metadata } from "next";

export const metadata: Metadata = {
    title: "Password & Security",
    description: "Update your account's password and security settings",
};

export default function Page() {
    return <SecurityPage className="md:basis-3/4" />;
}
