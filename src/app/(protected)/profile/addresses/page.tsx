import { AddressesPage } from "@/components/profile";
import { Metadata } from "next";

export const metadata: Metadata = {
    title: "Addresses",
    description: "Update your account's addresses",
};

export default function Page() {
    return <AddressesPage className="md:basis-3/4" />;
}
