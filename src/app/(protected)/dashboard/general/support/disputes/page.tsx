import { redirect } from "next/navigation";

export default function SupportDisputesRedirectPage() {
    redirect("/dashboard/general/support/user");
}
