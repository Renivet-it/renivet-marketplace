import { redirect } from "next/navigation";

export default function UserSupportRedirectPage() {
    redirect("/dashboard/general/support?queue=user");
}
