import { redirect } from "next/navigation";

export default function GrievanceDeskRedirectPage() {
    redirect("/dashboard/general/support?queue=grievance");
}
