import { GeneralPage } from "@/components/profile";
import { Metadata } from "next";

export const metadata: Metadata = {
    title: "General Settings",
    description: "Update your account's general settings",
};

export default function Page() {
    return <GeneralPage className="md:basis-3/4" />;
}
