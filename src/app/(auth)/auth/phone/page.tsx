import { Metadata } from "next";
import { redirect } from "next/navigation";

export const metadata: Metadata = {
    title: "Email Sign In",
    description: "Phone sign-in is currently disabled",
};

export default function Page() {
    redirect("/auth/signin");
}
