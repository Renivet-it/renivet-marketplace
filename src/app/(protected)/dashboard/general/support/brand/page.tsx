import { redirect } from "next/navigation";

export default function BrandSupportRedirectPage() {
    redirect("/dashboard/general/support?queue=brand");
}
